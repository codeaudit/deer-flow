# Configuration Guide

## Quick Settings

Copy the `conf.yaml.example` file to `conf.yaml` and modify the configurations to match your specific settings and requirements.

```bash
cd deer-flow
cp conf.yaml.example conf.yaml
```

## Which models does DeerFlow support?

In DeerFlow, currently we only support non-reasoning models, which means models like OpenAI's o1/o3 or DeepSeek's R1 are not supported yet, but we will add support for them in the future.

### Supported Models

`doubao-1.5-pro-32k-250115`, `gpt-4o`, `qwen-max-latest`, `gemini-2.0-flash`, `deepseek-v3`, and theoretically any other non-reasoning chat models that implement the OpenAI API specification.

> [!NOTE]
> The Deep Research process requires the model to have a **longer context window**, which is not supported by all models.
> A work-around is to set the `Max steps of a research plan` to `2` in the settings dialog located on the top right corner of the web page,
> or set `max_step_num` to `2` when invoking the API.

### How to configure multiple models?

DeerFlow now supports configuring multiple models per type, allowing you to switch between different models during conversations through the web interface.

#### New Multi-Model Configuration Format

```yaml
# Configure multiple models for basic tasks
BASIC_MODELS:
  - id: "gemini-2-flash"
    name: "Gemini 2.0 Flash"
    model: "gemini-2.0-flash"
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/"
    api_key: "your_api_key"
    provider: "Google"
    context_window: 1000000
  - id: "gpt-4o"
    name: "GPT-4o"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
    api_key: "your_openai_key"
    provider: "OpenAI"
    context_window: 128000

# Configure reasoning models (optional)
REASONING_MODELS:
  - id: "doubao-thinking"
    name: "Doubao 1.5 Thinking Pro"
    model: "doubao-1-5-thinking-pro-m-250428"
    base_url: "https://ark-cn-beijing.bytedance.net/api/v3"
    api_key: "your_api_key"
    provider: "ByteDance"
    context_window: 32000
```

#### Legacy Single-Model Support

The legacy format is still supported for backward compatibility:

```yaml
BASIC_MODEL:
  base_url: https://ark.cn-beijing.volces.com/api/v3
  model: "doubao-1-5-pro-32k-250115"
  api_key: xxxx
```

#### Switching Models

- **Via Web Interface**: Use the Model Selection section in Settings to choose different models for each task type
- **Via Configuration**: The first model in each list serves as the default
- **Runtime Selection**: Models can be selected per conversation without server restart

---

### How to use OpenAI-Compatible models?

DeerFlow supports integration with OpenAI-Compatible models, which are models that implement the OpenAI API specification. This includes various open-source and commercial models that provide API endpoints compatible with the OpenAI format. You can refer to [litellm OpenAI-Compatible](https://docs.litellm.ai/docs/providers/openai_compatible) for detailed documentation.
The following is a configuration example of `conf.yaml` for using OpenAI-Compatible models:

```yaml
# An example of Doubao models served by VolcEngine
BASIC_MODEL:
  base_url: "https://ark.cn-beijing.volces.com/api/v3"
  model: "doubao-1.5-pro-32k-250115"
  api_key: YOUR_API_KEY

# An example of Aliyun models
BASIC_MODEL:
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  model: "qwen-max-latest"
  api_key: YOUR_API_KEY

# An example of deepseek official models
BASIC_MODEL:
  base_url: "https://api.deepseek.com"
  model: "deepseek-chat"
  api_key: YOUR_API_KEY

# An example of Google Gemini models using OpenAI-Compatible interface
BASIC_MODEL:
  base_url: "https://generativelanguage.googleapis.com/v1beta/openai/"
  model: "gemini-2.0-flash"
  api_key: YOUR_API_KEY
```

### How to use models with self-signed SSL certificates?

If your LLM server uses self-signed SSL certificates, you can disable SSL certificate verification by adding the `verify_ssl: false` parameter to your model configuration:

```yaml
BASIC_MODEL:
  base_url: "https://your-llm-server.com/api/v1"
  model: "your-model-name"
  api_key: YOUR_API_KEY
  verify_ssl: false  # Disable SSL certificate verification for self-signed certificates
```

> [!WARNING]
> Disabling SSL certificate verification reduces security and should only be used in development environments or when you trust the LLM server. In production environments, it's recommended to use properly signed SSL certificates.

### How to use Ollama models?

DeerFlow supports the integration of Ollama models. You can refer to [litellm Ollama](https://docs.litellm.ai/docs/providers/ollama). <br>
The following is a configuration example of `conf.yaml` for using Ollama models(you might need to run the 'ollama serve' first):

```yaml
BASIC_MODEL:
  model: "model-name"  # Model name, which supports the completions API(important), such as: qwen3:8b, mistral-small3.1:24b, qwen2.5:3b
  base_url: "http://localhost:11434/v1" # Local service address of Ollama, which can be started/viewed via ollama serve
  api_key: "whatever"  # Mandatory, fake api_key with a random string you like :-)
```

### How to use OpenRouter models?

DeerFlow supports the integration of OpenRouter models. You can refer to [litellm OpenRouter](https://docs.litellm.ai/docs/providers/openrouter). To use OpenRouter models, you need to:
1. Obtain the OPENROUTER_API_KEY from OpenRouter (https://openrouter.ai/) and set it in the environment variable.
2. Add the `openrouter/` prefix before the model name.
3. Configure the correct OpenRouter base URL.

The following is a configuration example for using OpenRouter models:
1. Configure OPENROUTER_API_KEY in the environment variable (such as the `.env` file)
```ini
OPENROUTER_API_KEY=""
```
2. Set the model name in `conf.yaml`
```yaml
BASIC_MODEL:
  model: "openrouter/google/palm-2-chat-bison"
```

Note: The available models and their exact names may change over time. Please verify the currently available models and their correct identifiers in [OpenRouter's official documentation](https://openrouter.ai/docs).

### How to use Azure models?

DeerFlow supports the integration of Azure models. You can refer to [litellm Azure](https://docs.litellm.ai/docs/providers/azure). Configuration example of `conf.yaml`:
```yaml
BASIC_MODEL:
  model: "azure/gpt-4o-2024-08-06"
  api_base: $AZURE_API_BASE
  api_version: $AZURE_API_VERSION
  api_key: $AZURE_API_KEY
```
