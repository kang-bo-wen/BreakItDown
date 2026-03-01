import { BaseAgent } from './base-agent.js';

export class RiskAgent extends BaseAgent {
  constructor() {
    super('工程风险Agent', `你是一个专业的工程风险评估专家。
评估选项的潜在风险，包括：
- 技术风险
- 供应链风险
- 质量风险
- 时间风险

以JSON格式返回：
{
  "riskLevel": "低|中|高",
  "risks": [
    {
      "type": "风险类型",
      "description": "风险描述",
      "impact": "影响程度",
      "mitigation": "缓解措施"
    }
  ],
  "overallAssessment": "总体评估"
}`);
  }

  async assessRisk(option, optionType, onThinking = null) {
    const userMessage = `选项类型：${optionType}
选项详情：${JSON.stringify(option, null, 2)}

请评估工程风险。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析风险数据');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('解析风险数据失败:', error);
      return null;
    }
  }
}