# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import base64
import json
import logging
import os
from typing import Annotated, List, cast, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Request, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from langchain_core.messages import (
    AIMessageChunk,
    ToolMessage,
    BaseMessage,
    HumanMessage,
)
from langgraph.types import Command

from src.config.report_style import ReportStyle
from src.config.tools import SELECTED_RAG_PROVIDER
from src.graph.builder import build_graph_with_memory
from src.podcast.graph.builder import build_graph as build_podcast_graph
from src.ppt.graph.builder import build_graph as build_ppt_graph
from src.prose.graph.builder import build_graph as build_prose_graph
from src.prompt_enhancer.graph.builder import build_graph as build_prompt_enhancer_graph
from src.rag.builder import build_retriever
from src.rag.retriever import Resource
from src.server.chat_request import (
    ChatRequest,
    EnhancePromptRequest,
    GeneratePodcastRequest,
    GeneratePPTRequest,
    GenerateProseRequest,
    TTSRequest,
)
from src.server.mcp_request import MCPServerMetadataRequest, MCPServerMetadataResponse
from src.server.mcp_utils import load_mcp_tools
from src.server.rag_request import (
    RAGConfigResponse,
    RAGResourceRequest,
    RAGResourcesResponse,
)
from src.server.config_request import ConfigResponse
from src.llms.llm import get_configured_llm_models
from src.tools import VolcengineTTS
from src.backend.auth.middleware import get_user_id_from_request
from src.llms.model_info import ModelInfo
from src.llms.default_models import initialize_default_models_for_account
from src.backend.database.user_context import get_user_session
from src.llms.model_parameters import ModelParameters
from src.backend.database.settings_crud import (
    get_settings_by_user_id,
    upsert_settings_by_user_id,
)
from src.backend.database.session import get_session
from src.backend.auth.middleware import AuthMiddleware

from fastapi import status

logger = logging.getLogger(__name__)

INTERNAL_SERVER_ERROR_DETAIL = "Internal Server Error"

app = FastAPI(
    title="DeerFlow API",
    description="API for Deer",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add Auth middleware directly to the main app
app.add_middleware(AuthMiddleware)

graph = build_graph_with_memory()


# Dependency to get current user ID
async def get_current_user_id(request: Request) -> str:
    """Get current user ID from request"""
    user_id = get_user_id_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


# Dependency to get optional user ID (doesn't require authentication)
async def get_optional_user_id(request: Request) -> Optional[str]:
    """Get optional user ID from request"""
    return get_user_id_from_request(request)


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, request_obj: Request):
    thread_id = request.thread_id or "__default__"
    if thread_id == "__default__":
        thread_id = str(uuid4())

    # Get user ID from request if available
    user_id = get_user_id_from_request(request_obj)

    # Provide default values for parameters that may be None
    messages = request.model_dump().get("messages") or []
    resources = request.resources if request.resources is not None else []
    max_plan_iterations = (
        request.max_plan_iterations if request.max_plan_iterations is not None else 1
    )
    max_step_num = request.max_step_num if request.max_step_num is not None else 3
    max_search_results = (
        request.max_search_results if request.max_search_results is not None else 3
    )
    auto_accepted_plan = (
        request.auto_accepted_plan if request.auto_accepted_plan is not None else False
    )
    interrupt_feedback = (
        request.interrupt_feedback if request.interrupt_feedback is not None else ""
    )
    custom_prompts = (
        request.custom_prompts if request.custom_prompts is not None else {}
    )
    selected_models = (
        request.selected_models if request.selected_models is not None else {}
    )
    model_parameters = (
        request.model_parameters if request.model_parameters is not None else {}
    )
    mcp_settings = request.mcp_settings if request.mcp_settings is not None else {}
    enable_background_investigation = (
        request.enable_background_investigation
        if request.enable_background_investigation is not None
        else True
    )
    report_style = (
        request.report_style
        if request.report_style is not None
        else ReportStyle.ACADEMIC
    )
    enable_deep_thinking = (
        request.enable_deep_thinking
        if request.enable_deep_thinking is not None
        else False
    )

    return StreamingResponse(
        _astream_workflow_generator(
            messages,
            thread_id,
            resources,
            max_plan_iterations,
            max_step_num,
            max_search_results,
            auto_accepted_plan,
            interrupt_feedback,
            mcp_settings,
            enable_background_investigation,
            report_style,
            enable_deep_thinking,
            custom_prompts,
            selected_models,
            model_parameters,
            user_id,
        ),
        media_type="text/event-stream",
    )


async def _astream_workflow_generator(
    messages: List[dict],
    thread_id: str,
    resources: List[Resource],
    max_plan_iterations: int,
    max_step_num: int,
    max_search_results: int,
    auto_accepted_plan: bool,
    interrupt_feedback: str,
    mcp_settings: dict,
    enable_background_investigation: bool,
    report_style: ReportStyle,
    enable_deep_thinking: bool,
    custom_prompts: dict = {},
    selected_models: dict = {},
    model_parameters: dict = {},
    user_id: Optional[str] = None,
):
    # Import Command here to avoid circular imports
    from langgraph.types import Command

    # Proper input structure based on State class
    input_ = {
        "messages": messages,
        "plan_iterations": 0,
        "final_report": "",
        "current_plan": None,
        "observations": [],
        "auto_accepted_plan": auto_accepted_plan,
        "enable_background_investigation": enable_background_investigation,
        "research_topic": messages[-1]["content"] if messages else "",
    }

    # Handle interrupt feedback - if provided and plan is not auto-accepted, create Command
    if not auto_accepted_plan and interrupt_feedback:
        resume_msg = f"[{interrupt_feedback}]"
        # add the last message to the resume message
        if messages:
            resume_msg += f" {messages[-1]['content']}"
        input_ = Command(resume=resume_msg)

    async for agent, _, event_data in graph.astream(
        input_,
        config={
            "configurable": {
                "thread_id": thread_id,
                "resources": resources,
                "max_plan_iterations": max_plan_iterations,
                "max_step_num": max_step_num,
                "max_search_results": max_search_results,
                "mcp_settings": mcp_settings,
                "report_style": report_style.value,
                "enable_deep_thinking": enable_deep_thinking,
                "custom_prompts": custom_prompts,
                "selected_models": selected_models,
                "model_parameters": model_parameters,
                "user_id": user_id,  # Pass user_id to graph
            }
        },
        stream_mode=["messages", "updates"],
        subgraphs=True,
    ):
        if isinstance(event_data, dict):
            if "__interrupt__" in event_data:
                yield _make_event(
                    "interrupt",
                    {
                        "thread_id": thread_id,
                        "id": event_data["__interrupt__"][0].ns[0],
                        "role": "assistant",
                        "content": event_data["__interrupt__"][0].value,
                        "finish_reason": "interrupt",
                        "options": [
                            {"text": "Edit plan", "value": "edit_plan"},
                            {"text": "Start research", "value": "accepted"},
                        ],
                    },
                )
            continue
        message_chunk, message_metadata = cast(
            tuple[BaseMessage, dict[str, any]], event_data
        )
        event_stream_message: dict[str, any] = {
            "thread_id": thread_id,
            "agent": agent[0].split(":")[0],
            "id": message_chunk.id,
            "role": "assistant",
            "content": message_chunk.content,
        }
        if message_chunk.additional_kwargs.get("reasoning_content"):
            event_stream_message["reasoning_content"] = message_chunk.additional_kwargs[
                "reasoning_content"
            ]
        if message_chunk.response_metadata.get("finish_reason"):
            event_stream_message["finish_reason"] = message_chunk.response_metadata.get(
                "finish_reason"
            )
        if isinstance(message_chunk, ToolMessage):
            # Tool Message - Return the result of the tool call
            event_stream_message["tool_call_id"] = message_chunk.tool_call_id
            yield _make_event("tool_call_result", event_stream_message)
        elif isinstance(message_chunk, AIMessageChunk):
            # AI Message - Raw message tokens
            if message_chunk.tool_calls:
                # AI Message - Tool Call
                event_stream_message["tool_calls"] = message_chunk.tool_calls
                event_stream_message["tool_call_chunks"] = (
                    message_chunk.tool_call_chunks
                )
                yield _make_event("tool_calls", event_stream_message)
            elif message_chunk.tool_call_chunks:
                # AI Message - Tool Call Chunks
                event_stream_message["tool_call_chunks"] = (
                    message_chunk.tool_call_chunks
                )
                yield _make_event("tool_call_chunks", event_stream_message)
            else:
                # AI Message - Raw message tokens
                yield _make_event("message_chunk", event_stream_message)


def _make_event(event_type: str, data: dict[str, any]):
    if data.get("content") == "":
        data.pop("content")
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using volcengine TTS API."""
    app_id = os.getenv("VOLCENGINE_TTS_APPID", "")
    if not app_id:
        raise HTTPException(status_code=400, detail="VOLCENGINE_TTS_APPID is not set")
    access_token = os.getenv("VOLCENGINE_TTS_ACCESS_TOKEN", "")
    if not access_token:
        raise HTTPException(
            status_code=400, detail="VOLCENGINE_TTS_ACCESS_TOKEN is not set"
        )

    try:
        cluster = os.getenv("VOLCENGINE_TTS_CLUSTER", "volcano_tts")
        voice_type = os.getenv("VOLCENGINE_TTS_VOICE_TYPE", "BV700_V2_streaming")

        tts_client = VolcengineTTS(
            appid=app_id,
            access_token=access_token,
            cluster=cluster,
            voice_type=voice_type,
        )
        # Provide default values for request fields that may be None
        encoding = request.encoding if request.encoding is not None else "mp3"
        speed_ratio = request.speed_ratio if request.speed_ratio is not None else 1.0
        volume_ratio = request.volume_ratio if request.volume_ratio is not None else 1.0
        pitch_ratio = request.pitch_ratio if request.pitch_ratio is not None else 1.0
        text_type = request.text_type if request.text_type is not None else "plain"
        with_frontend = (
            request.with_frontend if request.with_frontend is not None else 1
        )
        frontend_type = (
            request.frontend_type if request.frontend_type is not None else "unitTson"
        )

        # Call the TTS API
        result = tts_client.text_to_speech(
            text=request.text[:1024],
            encoding=encoding,
            speed_ratio=speed_ratio,
            volume_ratio=volume_ratio,
            pitch_ratio=pitch_ratio,
            text_type=text_type,
            with_frontend=with_frontend,
            frontend_type=frontend_type,
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail=str(result["error"]))

        # Decode the base64 audio data
        audio_data = base64.b64decode(result["audio_data"])

        # Return the audio file
        return Response(
            content=audio_data,
            media_type=f"audio/{encoding}",
            headers={
                "Content-Disposition": f"attachment; filename=tts_output.{encoding}"
            },
        )

    except Exception as e:
        logger.exception(f"Error in TTS endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/podcast/generate")
async def generate_podcast(request: GeneratePodcastRequest):
    try:
        report_content = request.content
        print(report_content)
        workflow = build_podcast_graph()
        final_state = workflow.invoke({"input": report_content})
        audio_bytes = final_state["output"]
        return Response(content=audio_bytes, media_type="audio/mp3")
    except Exception as e:
        logger.exception(f"Error occurred during podcast generation: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/ppt/generate")
async def generate_ppt(request: GeneratePPTRequest):
    try:
        report_content = request.content
        print(report_content)
        workflow = build_ppt_graph()
        final_state = workflow.invoke({"input": report_content})
        generated_file_path = final_state["generated_file_path"]
        with open(generated_file_path, "rb") as f:
            ppt_bytes = f.read()
        return Response(
            content=ppt_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
    except Exception as e:
        logger.exception(f"Error occurred during ppt generation: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/prose/generate")
async def generate_prose(request: GenerateProseRequest):
    try:
        sanitized_prompt = request.prompt.replace("\r\n", "").replace("\n", "")
        logger.info(f"Generating prose for prompt: {sanitized_prompt}")
        workflow = build_prose_graph()
        events = workflow.astream(
            {
                "content": request.prompt,
                "option": request.option,
                "command": request.command,
            },
            stream_mode="messages",
            subgraphs=True,
        )
        return StreamingResponse(
            (f"data: {event[0].content}\n\n" async for _, event in events),
            media_type="text/event-stream",
        )
    except Exception as e:
        logger.exception(f"Error occurred during prose generation: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/prompt/enhance")
async def enhance_prompt(request: EnhancePromptRequest):
    try:
        sanitized_prompt = request.prompt.replace("\r\n", "").replace("\n", "")
        logger.info(f"Enhancing prompt: {sanitized_prompt}")

        # Convert string report_style to ReportStyle enum
        report_style = None
        if request.report_style:
            try:
                # Handle both uppercase and lowercase input
                style_mapping = {
                    "ACADEMIC": ReportStyle.ACADEMIC,
                    "POPULAR_SCIENCE": ReportStyle.POPULAR_SCIENCE,
                    "NEWS": ReportStyle.NEWS,
                    "SOCIAL_MEDIA": ReportStyle.SOCIAL_MEDIA,
                    "academic": ReportStyle.ACADEMIC,
                    "popular_science": ReportStyle.POPULAR_SCIENCE,
                    "news": ReportStyle.NEWS,
                    "social_media": ReportStyle.SOCIAL_MEDIA,
                }
                report_style = style_mapping.get(
                    request.report_style, ReportStyle.ACADEMIC
                )
            except Exception:
                # If invalid style, default to ACADEMIC
                report_style = ReportStyle.ACADEMIC
        else:
            report_style = ReportStyle.ACADEMIC

        workflow = build_prompt_enhancer_graph()
        final_state = workflow.invoke(
            {
                "prompt": request.prompt,
                "context": request.context,
                "report_style": report_style,
            }
        )
        return {"result": final_state["output"]}
    except Exception as e:
        logger.exception(f"Error occurred during prompt enhancement: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.post("/api/mcp/server/metadata")
async def mcp_server_metadata(request: MCPServerMetadataRequest):
    """Get information about an MCP server."""
    import time

    try:
        # Set default timeout with a longer value for this endpoint
        timeout = 300  # Default to 300 seconds for this endpoint

        # Use custom timeout from request if provided
        if request.timeout_seconds is not None:
            timeout = request.timeout_seconds

        # Load tools from the MCP server using the utility function
        tools = await load_mcp_tools(
            server_type=request.transport,
            command=request.command,
            args=request.args,
            url=request.url,
            env=request.env,
            timeout_seconds=timeout,
        )

        now = int(time.time() * 1000)
        # Determine the name: prefer request.name, fallback to command/url, else 'unknown'
        name = request.name
        if not name:
            if request.command:
                name = request.command
            elif request.url:
                name = request.url
            else:
                name = "unknown"

        # Always include all required fields in the response
        response = {
            "name": name,
            "transport": request.transport,
            "command": request.command,
            "args": request.args,
            "url": request.url,
            "env": request.env,
            "tools": tools,
            "enabled": True,
            "createdAt": now,
            "updatedAt": now,
            "account_id": "",
        }
        return response
    except Exception as e:
        logger.exception(f"Error in MCP server metadata endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR_DETAIL)


@app.get("/api/rag/config", response_model=RAGConfigResponse)
async def rag_config():
    """Get the config of the RAG."""
    return RAGConfigResponse(provider=SELECTED_RAG_PROVIDER)


@app.get("/api/rag/resources", response_model=RAGResourcesResponse)
async def rag_resources(request: Annotated[RAGResourceRequest, Query()]):
    """Get the resources of the RAG."""
    retriever = build_retriever()
    if retriever:
        return RAGResourcesResponse(resources=retriever.list_resources(request.query))
    return RAGResourcesResponse(resources=[])


@app.get("/api/config", response_model=ConfigResponse)
async def config():
    """Get the config of the server."""
    from src.server.config_request import ModelInfo

    # Convert the model data to the new format
    raw_models = get_configured_llm_models()
    formatted_models = {}

    for llm_type, models_list in raw_models.items():
        formatted_models[llm_type] = [
            ModelInfo(**model_data) for model_data in models_list
        ]

    return ConfigResponse(
        rag=RAGConfigResponse(provider=SELECTED_RAG_PROVIDER),
        models=formatted_models,
    )


@app.get("/api/models")
async def get_account_models(user_id: str = Depends(get_current_user_id)):
    """
    Get all models for the authenticated account. Ensures default models are initialized.
    """
    async for session in get_user_session(user_id):
        # Ensure default models are initialized
        await initialize_default_models_for_account(user_id, session)
        # Fetch all models for this account
        models = await ModelInfo.get_for_account(session, user_id)
        return {"models": [m.to_dict() for m in models]}


@app.get("/api/model-parameters")
async def list_model_parameters(user_id: str = Depends(get_current_user_id)):
    async for session in get_user_session(user_id):
        params = await ModelParameters.get_for_account(session, user_id)
        return {"parameters": [p.to_dict() for p in params]}


@app.get("/api/model-parameters/{model_id}")
async def get_model_parameters(
    model_id: str, user_id: str = Depends(get_current_user_id)
):
    async for session in get_user_session(user_id):
        param = await ModelParameters.get_for_model(session, user_id, model_id)
        if not param:
            raise HTTPException(status_code=404, detail="Model parameters not found")
        return param.to_dict()


@app.post("/api/model-parameters/{model_id}")
async def upsert_model_parameters(
    model_id: str,
    params: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    allowed_keys = {"temperature", "max_tokens", "top_p", "frequency_penalty"}
    filtered = {k: v for k, v in params.items() if k in allowed_keys}
    async for session in get_user_session(user_id):
        obj = await ModelParameters.upsert(session, user_id, model_id, filtered)
        return obj.to_dict()


@app.delete("/api/model-parameters/{model_id}")
async def delete_model_parameters(
    model_id: str, user_id: str = Depends(get_current_user_id)
):
    async for session in get_user_session(user_id):
        ok = await ModelParameters.delete_for_model(session, user_id, model_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Model parameters not found")
        return {"success": True}


@app.get("/api/settings")
async def get_user_settings(user_id: str = Depends(get_current_user_id)):
    DEFAULT_SETTINGS = {
        "flows": [],
        "activeFlowId": "",
        "modelParameters": {},
        "mcp": {"servers": [], "preRegistered": []},
    }
    async for session in get_user_session(user_id):
        settings = await get_settings_by_user_id(session, user_id)
        if settings is None:
            # Auto-create default settings for new user
            settings = await upsert_settings_by_user_id(
                session, user_id, DEFAULT_SETTINGS
            )
        return {"settings": settings}


@app.post("/api/settings")
async def update_user_settings(
    settings: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    async for session in get_user_session(user_id):
        updated = await upsert_settings_by_user_id(session, user_id, settings)
        return {"settings": updated}
