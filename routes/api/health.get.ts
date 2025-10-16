// 健康检查 API
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 检查后端服务状态
  const services = {
    tts: false,
    comfyui: false,
  }

  try {
    await $fetch(`${config.ttsServerUrl}/health`, {
      method: 'GET',
      timeout: 3000,
    })
    services.tts = true
  } catch (error) {
    console.warn('TTS service health check failed')
  }

  try {
    await $fetch(`${config.comfyuiServerUrl}/health`, {
      method: 'GET',
      timeout: 3000,
    })
    services.comfyui = true
  } catch (error) {
    console.warn('ComfyUI service health check failed')
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services,
  }
})

