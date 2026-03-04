import { BaseAgent } from './base-agent.js';
import { Process } from '../models/data-models.js';

export class ProcessAgent extends BaseAgent {
  constructor() {
    super('工艺Agent', `你是一个专业的制造工艺专家。
根据零件信息和用户的定制需求，生成3-4种可行的工艺方案。
每个方案应包含：
- 工艺名称
- 工艺描述
- 预估成本（人民币）
- 风险评估
- 碳排放估算（kg CO2）

以JSON格式返回：
{
  "processes": [
    {
      "name": "工艺名称",
      "description": "详细描述",
      "cost": 成本数字,
      "risk": "风险描述",
      "carbonEmission": 碳排放数字
    }
  ]
}`);
  }

  async generateProcesses(partName, customizedParams, onThinking = null) {
    const userMessage = `零件名称：${partName}
定制参数：${JSON.stringify(customizedParams, null, 2)}

请生成3-4种可行的工艺方案。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析工艺方案');
      }

      const data = JSON.parse(jsonMatch[0]);
      const processes = data.processes.map((p, index) =>
        new Process(
          `process-${Date.now()}-${index}`,
          p.name,
          p.description,
          p.cost,
          p.risk,
          p.carbonEmission
        )
      );

      return processes;
    } catch (error) {
      console.error('解析工艺方案失败:', error);
      return [];
    }
  }
}
