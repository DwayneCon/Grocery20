import OpenAI from 'openai';
import { config } from '../../config/env.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova', // warm, friendly female voice - perfect for Nora
    input: text,
    response_format: 'mp3',
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
