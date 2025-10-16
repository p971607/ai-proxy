// TTS 生成 API - 转发到 IndexTTS /v2/synthesize
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    console.log('[Nitro Proxy] 转发 TTS 请求到:', config.ttsServerUrl)
    console.log('[Nitro Proxy] 请求参数:', {
      text: body.text?.substring(0, 50) + '...',
      hasAudioPath: !!body.audio_path,
      hasEmoVector: !!body.emo_vector,
    })

    // 转发请求到 IndexTTS 服务的 /v2/synthesize 端点
    const response = await $fetch(`${config.ttsServerUrl}/v2/synthesize`, {
      method: 'POST',
      body,
      // 返回原始响应（音频文件）
      responseType: 'arrayBuffer',
    })

    console.log('[Nitro Proxy] TTS 生成成功，音频大小:', response.byteLength, 'bytes')

    // 设置响应头
    setResponseHeaders(event, {
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="speech.wav"',
    })

    return response
  } catch (error: any) {
    console.error('[Nitro Proxy] TTS service error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'TTS service error',
    })
  }
})

