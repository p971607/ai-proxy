// 创建测试音频
import fs from 'fs';

console.log('创建测试音频...');

// 创建一个 5秒的 WAV 文件
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
  
  const value = Math.floor(sample * 32767 * 0.8);
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
console.log('✅ 文件大小:', wavData.length, 'bytes');
console.log('✅ Base64 长度:', base64.length);
console.log('✅ 已保存 Base64 到 sample-voice-base64.txt');

