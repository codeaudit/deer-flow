# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeerFlow is a community-driven Deep Research framework that combines language models with specialized tools for web search, crawling, and Python code execution. It features a modular multi-agent system architecture built on LangGraph with both Python backend and Next.js web frontend.

## Development Commands

### Python Backend
- **Install dependencies**: `uv sync`
- **Run console UI**: `uv run main.py`
- **Run server**: `uv run server.py` or `make serve`
- **Run tests**: `uv run pytest tests/` or `make test`
- **Format code**: `uv run black --preview .` or `make format`
- **Lint code**: `uv run black --check .` or `make lint`
- **Coverage**: `uv run pytest --cov=src tests/ --cov-report=term-missing --cov-report=xml` or `make coverage`
- **LangGraph debugging**: `make langgraph-dev` (requires Python 3.12+)

### Web Frontend (in /web directory)
- **Install dependencies**: `pnpm install`
- **Development server**: `pnpm dev` (requires backend running)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Type check**: `pnpm typecheck`
- **Format**: `pnpm format:write`

### Full Stack Development
- **Start both servers**: `./bootstrap.sh -d` (macOS/Linux) or `bootstrap.bat -d` (Windows)

## Architecture

The system implements a multi-agent workflow using LangGraph with these key components:

### Core Agents
- **Coordinator**: Entry point that manages workflow lifecycle and delegates to planner
- **Planner**: Creates structured execution plans and determines research flow
- **Research Team**: Collection of specialized agents that execute plans
  - **Researcher**: Web searches and information gathering using various APIs
  - **Coder**: Python code analysis and execution using REPL tool
- **Reporter**: Aggregates findings and generates comprehensive reports

### Key Files
- `src/workflow.py`: Main workflow orchestration and async execution
- `src/graph/builder.py`: LangGraph state machine definition with nodes and edges
- `src/graph/nodes.py`: Individual agent implementations
- `main.py`: CLI entry point with interactive mode
- `server.py`: FastAPI server for web API

### Configuration
- `conf.yaml`: LLM model configuration and API keys
- `.env`: Environment variables for search APIs and services
- `pyproject.toml`: Python dependencies and project metadata
- `web/package.json`: Node.js dependencies and scripts

## Testing

Tests are organized in `/tests` with unit and integration test suites:
- Use `pytest` for running tests
- Coverage target is 25% minimum
- Test files follow `test_*.py` naming convention

## MCP Integration

The project supports Model Context Protocol (MCP) for extending capabilities. MCP servers can be configured in the workflow configuration for specialized tools and data access.

## Environment Setup

Python 3.12+ required with these key dependencies:
- LangGraph for multi-agent orchestration
- LiteLLM for model integration
- FastAPI for web API
- Various search and crawling libraries

Web frontend uses Next.js 15+ with React 19 and TypeScript.