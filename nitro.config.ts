// Nitro 配置文件
export default defineNitroConfig({
  // 开发服务器配置
  devServer: {
    port: 3001,
  },

  // 路由配置
  routeRules: {
    // API 路由
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  },

  // 环境变量
  runtimeConfig: {
    // 私有环境变量（仅服务器端）
    ttsServerUrl: process.env.TTS_SERVER_URL || 'http://localhost:8000',
    comfyuiServerUrl: process.env.COMFYUI_SERVER_URL || 'http://localhost:8001',
    
    // 公开环境变量（客户端和服务器端）
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
  },

  // 预渲染配置（Vercel 部署需要）
  prerender: {
    crawlLinks: false,
    routes: ['/'],
  },
})

