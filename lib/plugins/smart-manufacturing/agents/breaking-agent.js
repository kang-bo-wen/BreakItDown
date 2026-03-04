import { BaseAgent } from './base-agent.js';

export class BreakingAgent extends BaseAgent {
  constructor() {
    super('Keep Breaking Agent', `你是一个专业的决策分析师。
综合成本、风险、碳排放等因素，判断是否应该继续拆分零件。

考虑因素：
- 当前选项的成本效益
- 风险可控性
- 碳排放影响
- 与之前供应商选项的对比

以JSON格式返回：
{
  "recommendation": "break|keep",
  "confidence": 0-100,
  "reasoning": "详细推理过程",
  "keyFactors": ["关键因素1", "关键因素2"]
}`);
  }

  async recommend(costData, riskData, carbonData, previousOptions = [], onThinking = null) {
    const userMessage = `成本分析：${JSON.stringify(costData, null, 2)}
风险评估：${JSON.stringify(riskData, null, 2)}
碳排放：${JSON.stringify(carbonData, null, 2)}
${previousOptions.length > 0 ? `之前的选项：${JSON.stringify(previousOptions, null, 2)}` : ''}

请综合分析，给出是否继续拆分的建议。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析建议数据');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('解析建议数据失败:', error);
      return null;
    }
  }
}