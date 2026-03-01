import axios from 'axios';

const API_KEY = 'sk-d7815171e62e44108b983636fed17c08';
const BASE_URL = 'https://api.deepseek.com';

export class DeepSeekAPI {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async chat(messages, options = {}) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: options.model || 'deepseek-chat',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: options.stream || false
      });
      return response.data;
    } catch (error) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async streamChat(messages, onChunk, options = {}) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: options.model || 'deepseek-chat',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: true
      }, {
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    } catch (error) {
      console.error('DeepSeek Stream Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new DeepSeekAPI();
