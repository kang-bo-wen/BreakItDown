import deepseekAPI from '../api/deepseek.js';

// 基础Agent类
export class BaseAgent {
  constructor(name, systemPrompt) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.thinkingProcess = [];
  }

  async think(userMessage, context = {}) {
    this.thinkingProcess = [];

    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const response = await deepseekAPI.chat(messages, {
      temperature: 0.8,
      max_tokens: 3000
    });

    const result = response.choices[0].message.content;
    this.thinkingProcess.push({
      timestamp: Date.now(),
      content: result
    });

    return result;
  }

  async thinkStream(userMessage, onThinking, context = {}) {
    this.thinkingProcess = [];
    let fullContent = '';

    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userMessage }
    ];

    await deepseekAPI.streamChat(messages, (chunk) => {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onThinking({
          agent: this.name,
          content: delta,
          fullContent: fullContent
        });
      }
    }, { temperature: 0.8, max_tokens: 3000 });

    this.thinkingProcess.push({
      timestamp: Date.now(),
      content: fullContent
    });

    return fullContent;
  }

  getThinkingProcess() {
    return this.thinkingProcess;
  }

  clearThinkingProcess() {
    this.thinkingProcess = [];
  }
}
