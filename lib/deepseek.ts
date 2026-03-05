// lib/deepseek.ts
// DeepSeek API 客户端

const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-d7815171e62e44108b983636fed17c08';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class DeepSeekAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = BASE_URL;
    this.apiKey = API_KEY;
  }

  async chat(messages: DeepSeekMessage[], options: DeepSeekOptions = {}) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'deepseek-chat',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw error;
    }
  }

  async streamChat(
    messages: DeepSeekMessage[],
    onChunk: (chunk: any) => void,
    options: DeepSeekOptions = {}
  ) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'deepseek-chat',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: true
        }),
        signal: AbortSignal.timeout(120000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Cannot read response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('DeepSeek Stream Error:', error);
      throw error;
    }
  }
}

export default new DeepSeekAPI();
