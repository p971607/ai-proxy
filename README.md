# AI Proxy Service

基于 Nitro 的 AI 服务代理层，用于转发请求到后端 AI 服务（IndexTTS、ComfyUI 等）。

## 🎯 功能

- ✅ TTS 语音生成代理
- ✅ 图像生成代理（ComfyUI）
- ✅ 健康检查
- ✅ CORS 支持
- ✅ 全球 CDN（通过 Vercel）

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 编辑 .env，填入后端服务地址
# TTS_SERVER_URL=https://your-tts-server.xiangongyun.com
# COMFYUI_SERVER_URL=https://your-comfyui-server.xiangongyun.com

# 启动开发服务器
npm run dev
```

访问 http://localhost:3001

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 设置环境变量
vercel env add TTS_SERVER_URL
# 输入: https://your-tts-server.xiangongyun.com

vercel env add COMFYUI_SERVER_URL
# 输入: https://your-comfyui-server.xiangongyun.com

# 重新部署到生产环境
vercel --prod
```

## 📡 API 端点

### 1. TTS 语音生成

**POST** `/api/tts/generate`

请求体：
```json
{
  "text": "你好，世界！",
  "voice_prompt": "examples/voice_01.wav",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 1.0
}
```

响应：音频文件（WAV 格式）

### 2. 图像生成

**POST** `/api/image/generate`

请求体：
```json
{
  "prompt": "a beautiful landscape",
  "style": "anime",
  "width": 1024,
  "height": 1024
}
```

响应：图像文件（PNG 格式）

### 3. 健康检查

**GET** `/api/health`

响应：
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "services": {
    "tts": true,
    "comfyui": true
  }
}
```

## 🏗️ 项目结构

```
ai-proxy/
├── routes/                    # API 路由
│   ├── index.get.ts          # 首页
│   └── api/
│       ├── health.get.ts     # 健康检查
│       ├── tts/
│       │   └── generate.post.ts  # TTS 生成
│       └── image/
│           └── generate.post.ts  # 图像生成
├── nitro.config.ts           # Nitro 配置
├── vercel.json               # Vercel 配置
├── .env.example              # 环境变量示例
└── package.json
```

## 🔧 配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `TTS_SERVER_URL` | IndexTTS 服务地址 | `http://localhost:8000` |
| `COMFYUI_SERVER_URL` | ComfyUI 服务地址 | `http://localhost:8001` |
| `API_BASE` | API 基础路径 | `/api` |

### Nitro 配置

编辑 `nitro.config.ts` 来自定义：
- 端口号
- CORS 设置
- 路由规则
- 预渲染配置

## 📊 架构

```
用户请求
    ↓
Vercel CDN（全球边缘节点）
    ↓
Nitro 代理层（本项目）
    ↓
后端 AI 服务（仙宫云）
    ├── IndexTTS (8000)
    └── ComfyUI (8001)
```

## 🎓 技术栈

- **Nitro**: 全栈服务器框架
- **H3**: HTTP 服务器
- **Vercel**: 部署平台

## 📝 开发指南

### 添加新的 API 端点

1. 在 `routes/api/` 下创建新文件
2. 使用 `defineEventHandler` 定义处理函数
3. 使用 `$fetch` 转发请求到后端服务

示例：
```typescript
// routes/api/new-service/action.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const response = await $fetch(`${config.newServiceUrl}/action`, {
    method: 'POST',
    body,
  })

  return response
})
```

### 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试 TTS API
curl -X POST http://localhost:3001/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voice_prompt":"examples/voice_01.wav"}' \
  --output test.wav

# 测试健康检查
curl http://localhost:3001/api/health
```

## 🐛 故障排查

### 问题：CORS 错误

确保 `nitro.config.ts` 中的 CORS 配置正确：
```typescript
routeRules: {
  '/api/**': {
    cors: true,
  },
}
```

### 问题：后端服务连接失败

1. 检查环境变量是否正确设置
2. 确认后端服务是否正常运行
3. 检查网络连接

### 问题：Vercel 部署失败

1. 确保 `vercel.json` 配置正确
2. 检查构建日志
3. 确认环境变量已在 Vercel 中设置

## 📚 相关文档

- [Nitro 文档](https://nitro.unjs.io/)
- [H3 文档](https://h3.unjs.io/)
- [Vercel 文档](https://vercel.com/docs)

## 📄 许可证

MIT

