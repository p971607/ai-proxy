// 首页
export default defineEventHandler(() => {
  return {
    name: 'AI Proxy Service',
    version: '1.0.0',
    description: 'Proxy service for AI services (IndexTTS, ComfyUI)',
    endpoints: {
      tts: '/api/tts/generate',
      image: '/api/image/generate',
      health: '/api/health',
    },
    documentation: 'https://github.com/p971607/novel-ai-services',
  }
})

