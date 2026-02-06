# AI 接口配置指南

本项目支持两种AI接口配置方式：

## 方式1: 使用阿里云通义千问（默认）

在 `.env.local` 文件中配置：

```bash
DASHSCOPE_API_KEY=sk-your-dashscope-api-key
```

获取API Key: https://dashscope.console.aliyun.com/apiKey

## 方式2: 使用自定义AI接口（推荐）

如果你有自己的AI接口（OpenAI兼容格式），在 `.env.local` 中配置：

```bash
AI_BASE_URL=https://your-api-endpoint.com/v1
AI_API_KEY=your_api_key_here
AI_MODEL_VISION=gpt-4-vision-preview
AI_MODEL_TEXT=gpt-4
```

### 配置说明

- **AI_BASE_URL**: 你的AI接口地址（需要兼容OpenAI API格式）
  - 例如: `https://api.openai.com/v1`
  - 或者: `https://your-custom-api.com/v1`

- **AI_API_KEY**: 你的API密钥

- **AI_MODEL_VISION**: 视觉模型名称（用于图片识别）
  - OpenAI: `gpt-4-vision-preview` 或 `gpt-4o`
  - 其他兼容接口: 根据你的服务提供商文档填写

- **AI_MODEL_TEXT**: 文本模型名称（用于物体拆解）
  - OpenAI: `gpt-4` 或 `gpt-3.5-turbo`
  - 其他兼容接口: 根据你的服务提供商文档填写

## 优先级

如果同时配置了两种方式，系统会优先使用自定义AI接口（方式2）。

## 兼容的AI服务

本项目使用OpenAI兼容的API格式，以下服务都可以使用：

### 官方服务
- ✅ OpenAI API
- ✅ Azure OpenAI
- ✅ 阿里云通义千问

### 第三方代理
- ✅ OpenRouter
- ✅ Together AI
- ✅ Groq
- ✅ 任何OpenAI兼容的代理服务

### 自部署
- ✅ LocalAI
- ✅ Ollama (需要OpenAI兼容层)
- ✅ vLLM
- ✅ Text Generation WebUI (OpenAI模式)

## API格式要求

你的自定义AI接口需要支持以下格式：

### 图片识别接口

```bash
POST {AI_BASE_URL}/chat/completions
Content-Type: application/json
Authorization: Bearer {AI_API_KEY}

{
  "model": "{AI_MODEL_VISION}",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "prompt" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ],
  "max_tokens": 1000
}
```

### 文本拆解接口

```bash
POST {AI_BASE_URL}/chat/completions
Content-Type: application/json
Authorization: Bearer {AI_API_KEY}

{
  "model": "{AI_MODEL_TEXT}",
  "messages": [
    { "role": "system", "content": "system prompt" },
    { "role": "user", "content": "user prompt" }
  ],
  "temperature": 0.8,
  "max_tokens": 2000
}
```

## 测试配置

配置完成后，重启服务器：

```bash
# 停止服务器 (Ctrl+C)
npm run dev
```

查看终端输出，应该会显示：
- 使用自定义AI: `Using custom AI vision model: gpt-4-vision-preview`
- 使用通义千问: `Using Qwen vision model`

## 常见问题

### Q: 如何切换AI服务？

A: 修改 `.env.local` 文件中的配置，然后重启服务器。

### Q: 可以同时配置两种吗？

A: 可以，系统会优先使用自定义AI接口。

### Q: 我的接口不兼容OpenAI格式怎么办？

A: 你需要修改 `lib/ai-client.ts` 中的 `callCustomVision` 和 `callCustomText` 函数，适配你的API格式。

### Q: 如何验证配置是否正确？

A:
1. 查看服务器启动日志，确认没有配置错误
2. 上传图片测试识别功能
3. 查看终端输出，确认使用的是哪个AI服务

## 示例配置

### 使用OpenAI

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-openai-api-key
AI_MODEL_VISION=gpt-4-vision-preview
AI_MODEL_TEXT=gpt-4
```

### 使用Azure OpenAI

```bash
AI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments
AI_API_KEY=your-azure-api-key
AI_MODEL_VISION=gpt-4-vision
AI_MODEL_TEXT=gpt-4
```

### 使用本地部署的模型

```bash
AI_BASE_URL=http://localhost:8000/v1
AI_API_KEY=not-needed
AI_MODEL_VISION=llava
AI_MODEL_TEXT=llama-3
```

---

**提示**: 确保你的API服务支持视觉模型（用于图片识别）和文本模型（用于物体拆解）。
