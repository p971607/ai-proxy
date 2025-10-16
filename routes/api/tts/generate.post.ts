// TTS 生成 API - WebSocket 转 HTTP
// 将 HTTP 请求转换为 WebSocket 调用 IndexTTS
import { WebSocket } from 'ws'

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

    // 将 HTTP 请求转换为 WebSocket 消息
    const wsUrl = config.ttsServerUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'

    console.log('[Nitro Proxy] 连接 WebSocket:', wsUrl)

    // 创建 WebSocket 连接
    const ws = new WebSocket(wsUrl)

    // 收集音频数据
    const audioChunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('TTS 生成超时'))
      }, 60000) // 60秒超时

      ws.on('open', () => {
        console.log('[Nitro Proxy] WebSocket 已连接')

        // 发送 TTS 请求
        const wsMessage = {
          text: body.text,
          type: 'request',
          priority: 5,
          reference_audio_path: body.audio_path,
          infer_mode: 'normal',
        }

        console.log('[Nitro Proxy] 发送 WebSocket 消息:', wsMessage)
        ws.send(JSON.stringify(wsMessage))
      })

      ws.on('message', (data: Buffer) => {
        console.log('[Nitro Proxy] 收到音频数据:', data.length, 'bytes')
        audioChunks.push(data)
      })

      ws.on('close', () => {
        clearTimeout(timeout)
        console.log('[Nitro Proxy] WebSocket 已关闭')

        if (audioChunks.length === 0) {
          reject(new Error('未收到音频数据'))
          return
        }

        // 合并所有音频数据
        const audioBuffer = Buffer.concat(audioChunks)
        console.log('[Nitro Proxy] TTS 生成成功，总大小:', audioBuffer.length, 'bytes')

        // 将 PCM 转换为 WAV
        const wavBuffer = pcmToWav(audioBuffer, 22050, 16, 1)

        // 设置响应头
        setResponseHeaders(event, {
          'Content-Type': 'audio/wav',
          'Content-Disposition': 'attachment; filename="speech.wav"',
        })

        resolve(wavBuffer)
      })

      ws.on('error', (error) => {
        clearTimeout(timeout)
        console.error('[Nitro Proxy] WebSocket 错误:', error)
        reject(error)
      })
    })
  } catch (error: any) {
    console.error('[Nitro Proxy] TTS service error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'TTS service error',
    })
  }
})

/**
 * 将 PCM 音频转换为 WAV 格式
 * @param pcmData PCM 音频数据
 * @param sampleRate 采样率
 * @param bitsPerSample 位深度
 * @param channels 声道数
 * @returns WAV 音频数据
 */
function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  bitsPerSample: number,
  channels: number
): Buffer {
  const blockAlign = (channels * bitsPerSample) / 8
  const byteRate = sampleRate * blockAlign
  const dataSize = pcmData.length
  const fileSize = 36 + dataSize

  const header = Buffer.alloc(44)

  // RIFF chunk descriptor
  header.write('RIFF', 0)
  header.writeUInt32LE(fileSize, 4)
  header.write('WAVE', 8)

  // fmt sub-chunk
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20) // AudioFormat (1 for PCM)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)

  // data sub-chunk
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmData])
}

