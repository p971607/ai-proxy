// 下载公开的中文语音样本
import https from 'https';
import fs from 'fs';

// 使用 Mozilla Common Voice 的中文样本
const sampleUrl = 'https://mozilla-common-voice-datasets.s3.dualstack.us-west-2.amazonaws.com/cv-corpus-6.1-2020-12-11/zh-CN/clips/common_voice_zh-CN_18885991.mp3';

console.log('下载中文语音样本...');

const file = fs.createWriteStream('sample-voice.mp3');

https.get(sampleUrl, (response) => {
  response.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('✅ 下载完成: sample-voice.mp3');
    
    // 转换为 Base64
    const audioData = fs.readFileSync('sample-voice.mp3');
    const base64 = audioData.toString('base64');
    
    console.log('✅ Base64 长度:', base64.length);
    console.log('✅ 文件大小:', audioData.length, 'bytes');
    
    // 保存 Base64
    fs.writeFileSync('sample-voice-base64.txt', base64);
    console.log('✅ 已保存 Base64 到 sample-voice-base64.txt');
  });
}).on('error', (err) => {
  fs.unlink('sample-voice.mp3', () => {});
  console.error('❌ 下载失败:', err.message);
  
  // 如果下载失败，创建一个简单的测试音频
  console.log('创建测试音频...');
  createTestAudio();
});

function createTestAudio() {
  // 创建一个简单的 WAV 文件（5秒，多个频率模拟语音）
  const sampleRate = 22050;
  const duration = 5; // 5秒

  const numSamples = sampleRate * duration;
  const pcmData = Buffer.alloc(numSamples * 2); // 16-bit

  // 生成类似语音的复杂波形
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // 混合多个频率模拟语音
    const sample =
      0.3 * Math.sin(2 * Math.PI * 200 * t) +  // 基频
      0.2 * Math.sin(2 * Math.PI * 400 * t) +  // 第一泛音
      0.1 * Math.sin(2 * Math.PI * 600 * t) +  // 第二泛音
      0.05 * Math.sin(2 * Math.PI * 800 * t);  // 第三泛音

    const value = Math.floor(sample * 32767 * 0.8); // 降低音量避免削波
    pcmData.writeInt16LE(value, i * 2);
  }
  
  // 添加 WAV 头
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmData.length, 40);
  
  const wavData = Buffer.concat([header, pcmData]);
  fs.writeFileSync('sample-voice.wav', wavData);
  
  const base64 = wavData.toString('base64');
  fs.writeFileSync('sample-voice-base64.txt', base64);
  
  console.log('✅ 已创建测试音频: sample-voice.wav');
  console.log('✅ Base64 长度:', base64.length);
}

