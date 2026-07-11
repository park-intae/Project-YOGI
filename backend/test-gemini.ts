import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 로드
dotenv.config({ path: path.join(__dirname, '.env') });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env');
    return;
  }

  console.log('Testing Gemini API...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    const result = await model.generateContent('안녕하세요, 테스트 요청입니다.');
    console.log('API 호출 성공! 응답:', result.response.text());
  } catch (error: any) {
    console.error('============================');
    console.error('API 호출 실패! 에러 상세 내역:');
    console.error('Error Message:', error.message);
    if (error.status) console.error('Status:', error.status);
    console.error('============================');
  }
}

testGemini();
