import { BaseAgent } from './base-agent.js';

export class CarbonAgent extends BaseAgent {
  constructor() {
    super('碳排放Agent', `你是一个专业的碳排放评估专家。
评估选项的碳排放，包括：
- 生产过程碳排放
- 运输碳排放
- 材料碳足迹

以JSON格式返回：
{
  "totalEmission": 总排放量（kg CO2）,
  "breakdown": {
    "production": 生产排放,
    "transportation": 运输排放,
    "material": 材料排放
  },
  "rating": "A|B|C|D|E",
  "analysis": "碳排放分析"
}`);
  }

  async assessCarbon(option, optionType, onThinking = null) {
    const userMessage = `选项类型：${optionType}
选项详情：${JSON.stringify(option, null, 2)}

请评估碳排放。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析碳排放数据');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('解析碳排放数据失败:', error);
      return null;
    }
  }
}