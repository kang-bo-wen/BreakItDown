import { BaseAgent } from './base-agent.js';
import { Part } from '../models/data-models.js';

export class PartBreakdownAgent extends BaseAgent {
  constructor() {
    super('零件拆解Agent', `你是一个专业的产品拆解专家。
根据产品名称，将其拆解为4-6个主要零件。

以JSON格式返回：
{
  "parts": [
    {
      "name": "零件名称",
      "description": "零件描述",
      "importance": "高|中|低"
    }
  ]
}

注意：不要硬编码结果，要根据产品特性生成合理的零件拆解。`);
  }

  async breakdownProduct(productName, onThinking = null) {
    const userMessage = `请将以下产品拆解为4-6个主要零件：
产品名称：${productName}`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析零件数据');
      }

      const data = JSON.parse(jsonMatch[0]);
      const parts = data.parts.map((p, index) =>
        new Part(
          `part-${Date.now()}-${index}`,
          p.name,
          1,
          null
        )
      );

      return parts;
    } catch (error) {
      console.error('解析零件数据失败:', error);
      return [];
    }
  }

  async breakdownPart(partName, parentId, level, onThinking = null) {
    const userMessage = `请将以下零件进一步拆解为4-6个子零件或原材料：
零件名称：${partName}`;

    let result;
    if (onThinking) {
      result = await this.thinkStream(userMessage, onThinking);
    } else {
      result = await this.think(userMessage);
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析零件数据');
      }

      const data = JSON.parse(jsonMatch[0]);
      const parts = data.parts.map((p, index) =>
        new Part(
          `part-${Date.now()}-${index}`,
          p.name,
          level,
          parentId
        )
      );

      return parts;
    } catch (error) {
      console.error('解析零件数据失败:', error);
      return [];
    }
  }
}