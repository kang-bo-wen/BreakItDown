import { BaseAgent } from './base-agent.js';
import { Supplier } from '../models/data-models.js';

export class SupplierAgent extends BaseAgent {
  constructor() {
    super('供应商Agent', `你是一个专业的供应商检索专家。
你的任务是根据零件的名称和规格，生成3-5个可能的供应商选项。
每个供应商应包含：
- 供应商名称
- 零件规格描述
- 价格估算（人民币）
- 可靠性评分（1-10）
- 交货周期（天数）

请以JSON格式返回结果，格式如下：
{
  "suppliers": [
    {
      "name": "供应商名称",
      "specs": "规格描述",
      "price": 价格数字,
      "reliability": 可靠性评分,
      "leadTime": 交货周期
    }
  ]
}

注意：不要硬编码结果，要根据零件特性生成多样化的供应商选项。`);
  }

  async findSuppliers(partName, partSpecs = '', onThinking = null) {
    const userMessage = `请为以下零件寻找供应商：
零件名称：${partName}
${partSpecs ? `规格要求：${partSpecs}` : ''}

请生成3-5个可能的供应商选项。`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析供应商数据');
      }

      const data = JSON.parse(jsonMatch[0]);
      const suppliers = data.suppliers.map((s, index) =>
        new Supplier(
          `supplier-${Date.now()}-${index}`,
          s.name,
          partName,
          s.specs,
          s.price,
          s.reliability,
          s.leadTime
        )
      );

      return suppliers;
    } catch (error) {
      console.error('解析供应商数据失败:', error);
      return [];
    }
  }
}
