// 测试 WebSocket 连接到仙宫云 IndexTTS
import { WebSocket } from 'ws';
import fs from 'fs';

const wsUrl = 'wss://fz3dtvk633lsowpo-8000.container.x-gpu.com/ws';

console.log('连接到:', wsUrl);

const ws = new WebSocket(wsUrl);

const audioChunks = [];

ws.on('open', () => {
  console.log('✅ WebSocket 已连接');

  // 读取 Base64 编码的参考音频
  const base64Audio = fs.readFileSync('sample-voice-base64.txt', 'utf8');
  console.log('✅ 已加载参考音频 Base64，长度:', base64Audio.length);

  const message = {
    text: '你好，世界！这是一个测试。',
    type: 'request',
    priority: 5,
    reference_audio_b64: base64Audio, // 使用 Base64 编码的参考音频
    infer_mode: 'normal',
  };

  console.log('发送消息（不含 Base64）:', {
    ...message,
    reference_audio_b64: `[Base64 data, ${base64Audio.length} chars]`
  });
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  // 检查是否是文本消息
  try {
    const text = data.toString('utf8');
    if (text.startsWith('{')) {
      const json = JSON.parse(text);
      console.log('收到JSON消息:', json);

      // 如果是完成消息，关闭连接
      if (json.type === 'complete' || json.status === 'complete') {
        console.log('✅ 生成完成');
        ws.close();
        return;
      }
      return; // JSON 消息不是音频数据
    }
  } catch (e) {
    // 不是 JSON，可能是音频数据
  }

  // 是音频数据
  console.log('收到音频数据:', data.length, 'bytes');
  audioChunks.push(data);
});

ws.on('close', () => {
  console.log('WebSocket 已关闭');
  
  if (audioChunks.length === 0) {
    console.error('❌ 未收到音频数据');
    process.exit(1);
  }

  const audioBuffer = Buffer.concat(audioChunks);
  console.log('✅ 总共收到:', audioBuffer.length, 'bytes');

  // 转换为 WAV
  const wavBuffer = pcmToWav(audioBuffer, 22050, 16, 1);
  
  fs.writeFileSync('test-output.wav', wavBuffer);
  console.log('✅ 已保存到 test-output.wav');
  
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error.message);
  process.exit(1);
});

// 超时
setTimeout(() => {
  console.error('❌ 超时');
  ws.close();
  process.exit(1);
}, 60000); // 增加到60秒

function pcmToWav(pcmData, sampleRate, bitsPerSample, channels) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

