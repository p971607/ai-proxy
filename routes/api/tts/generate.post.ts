// TTS 生成 API - WebSocket 转 HTTP
// 将 HTTP 请求转换为 WebSocket 调用 IndexTTS
import { WebSocket } from 'ws'

interface TTSRequest {
  text: string;
  audio_path?: string;
  reference_audio_b64?: string;
  emo_vector?: number[];
  emo_alpha?: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  let body: TTSRequest | undefined;
  try {
    body = await readBody<TTSRequest>(event);
  } catch (error) {
    console.error("[Nitro Proxy] Failed to read body:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Failed to parse request body",
    });
  }

  if (!body || !body.text) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required field: text",
    });
  }

  try {
    console.log("[Nitro Proxy] 转发 TTS 请求到:", config.ttsServerUrl);
    console.log("[Nitro Proxy] 请求参数:", {
      text: body.text?.substring(0, 50) + "...",
      hasAudioPath: !!body.audio_path,
      hasReferenceAudioB64: !!body.reference_audio_b64,
      hasEmoVector: !!body.emo_vector,
    });

    // 将 HTTP 请求转换为 WebSocket 消息
    const wsUrl =
      config.ttsServerUrl
        .replace("https://", "wss://")
        .replace("http://", "ws://") + "/ws";

    console.log("[Nitro Proxy] 连接 WebSocket:", wsUrl);

    // 创建 WebSocket 连接
    const ws = new WebSocket(wsUrl);

    // 收集音频数据
    const audioChunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("TTS 生成超时"));
      }, 60000); // 60秒超时

      ws.on("open", () => {
        console.log("[Nitro Proxy] WebSocket 已连接");

        // 发送 TTS 请求
        const wsMessage: any = {
          text: body.text,
          type: "request",
          priority: 5,
          infer_mode: "normal",
        };

        // 添加参考音频（优先使用 Base64）
        if (body.reference_audio_b64) {
          wsMessage.reference_audio_b64 = body.reference_audio_b64;
        } else if (body.audio_path) {
          wsMessage.reference_audio_path = body.audio_path;
        }

        console.log("[Nitro Proxy] 发送 WebSocket 消息:", {
          ...wsMessage,
          reference_audio_b64: wsMessage.reference_audio_b64
            ? `[Base64 data, ${wsMessage.reference_audio_b64.length} chars]`
            : undefined,
        });
        ws.send(JSON.stringify(wsMessage));
      });

      ws.on("message", (data: Buffer) => {
        // 检查是否是 JSON 消息
        try {
          const text = data.toString("utf8");
          if (text.startsWith("{")) {
            const json = JSON.parse(text);
            console.log("[Nitro Proxy] 收到JSON消息:", json);

            // 如果是完成消息，关闭连接
            if (json.type === "complete" || json.status === "complete") {
              console.log("[Nitro Proxy] 生成完成");
              ws.close();
              return;
            }

            // 如果是错误消息
            if (json.status === "error") {
              console.error("[Nitro Proxy] 错误:", json.message);
              ws.close();
              reject(new Error(json.message));
              return;
            }

            return; // JSON 消息不是音频数据
          }
        } catch (e) {
          // 不是 JSON，可能是音频数据
        }

        // 是音频数据
        console.log("[Nitro Proxy] 收到音频数据:", data.length, "bytes");
        audioChunks.push(data);
      });

      ws.on("close", () => {
        clearTimeout(timeout);
        console.log("[Nitro Proxy] WebSocket 已关闭");

        if (audioChunks.length === 0) {
          reject(new Error("未收到音频数据"));
          return;
        }

        // 合并所有音频数据
        const audioBuffer = Buffer.concat(audioChunks);
        console.log(
          "[Nitro Proxy] TTS 生成成功，总大小:",
          audioBuffer.length,
          "bytes"
        );

        // 将 PCM 转换为 WAV
        const wavBuffer = pcmToWav(audioBuffer, 22050, 16, 1);

        // 设置响应头
        setResponseHeaders(event, {
          "Content-Type": "audio/wav",
          "Content-Disposition": 'attachment; filename="speech.wav"',
        });

        resolve(wavBuffer);
      });

      ws.on("error", (error) => {
        clearTimeout(timeout);
        console.error("[Nitro Proxy] WebSocket 错误:", error);
        reject(error);
      });
    });
  } catch (error: any) {
    console.error("[Nitro Proxy] TTS service error:", error);

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "TTS service error",
    });
  }
});

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

