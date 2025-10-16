// 测试 Vercel 代理
import fs from 'fs';
import https from 'https';

const vercelUrl = 'https://ai-proxy-5kgx30of0-p971607s-projects.vercel.app/api/tts/generate';

console.log('测试 Vercel 代理:', vercelUrl);

// 读取 Base64 参考音频
const base64Audio = fs.readFileSync('sample-voice-base64.txt', 'utf8');
console.log('✅ 已加载参考音频 Base64，长度:', base64Audio.length);

const requestData = JSON.stringify({
  text: '你好，世界！这是通过 Vercel 代理的测试。',
  reference_audio_b64: base64Audio,
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': requestData.length,
  },
};

console.log('发送请求...');

const req = https.request(vercelUrl, options, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);

  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
    console.log('收到数据:', chunk.length, 'bytes');
  });

  res.on('end', () => {
    const audioBuffer = Buffer.concat(chunks);
    console.log('✅ 总共收到:', audioBuffer.length, 'bytes');

    if (res.statusCode === 200) {
      fs.writeFileSync('test-vercel-output.wav', audioBuffer);
      console.log('✅ 已保存到 test-vercel-output.wav');
    } else {
      console.error('❌ 错误响应:', audioBuffer.toString('utf8'));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求错误:', error.message);
});

req.write(requestData);
req.end();

// 超时
setTimeout(() => {
  console.error('❌ 超时');
  process.exit(1);
}, 120000); // 2分钟超时

