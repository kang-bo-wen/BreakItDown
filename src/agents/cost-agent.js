import { BaseAgent } from './base-agent.js';

export class CostAgent extends BaseAgent {
  constructor() {
    super('成本Agent', `你是一个专业的成本分析师。
根据选择的供应商或工艺方案，计算总成本。
考虑因素：
- 材料成本
- 加工成本
- 运输成本
- 其他附加成本

以JSON格式返回：
{
  "totalCost": 总成本数字,
  "breakdown": {
    "material": 材料成本,
    "processing": 加工成本,
    "shipping": 运输成本,
    "other": 其他成本
  },
  "analysis": "成本分析说明"
}`);
  }

  async analyzeCost(option, optionType, onThinking = null) {
    const userMessage = `选项类型：${optionType}
选项详情：${JSON.stringify(option, null, 2)}

请分析总成本并给出详细分解。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析成本数据');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('解析成本数据失败:', error);
      return null;
    }
  }
}