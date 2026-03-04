import { BaseAgent } from './base-agent.js';

export class CustomizedAgent extends BaseAgent {
  constructor() {
    super('定制化Agent', `你是一个专业的零件定制顾问。
你的任务是引导用户定制零件，询问必要的参数和需求。
请生成3-5个关键问题，帮助用户明确定制需求。

以JSON格式返回：
{
  "questions": [
    {
      "question": "问题内容",
      "type": "text|number|select",
      "options": ["选项1", "选项2"] // 仅当type为select时
    }
  ]
}`);
  }

  async generateQuestions(partName, onThinking = null) {
    const userMessage = `用户想要定制零件：${partName}
请生成3-5个关键问题，帮助明确定制需求。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析定制问题');
      }

      const data = JSON.parse(jsonMatch[0]);
      return data.questions;
    } catch (error) {
      console.error('解析定制问题失败:', error);
      return [];
    }
  }
}