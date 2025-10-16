// TTS 生成 API
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    // 转发请求到 IndexTTS 服务
    const response = await $fetch(`${config.ttsServerUrl}/api/tts/generate`, {
      method: 'POST',
      body,
      // 返回原始响应（音频文件）
      responseType: 'arrayBuffer',
    })

    // 设置响应头
    setResponseHeaders(event, {
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="speech.wav"',
    })

    return response
  } catch (error: any) {
    console.error('TTS service error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'TTS service error',
    })
  }
})

