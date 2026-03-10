import { NextRequest } from 'next/server';
import deepseek from '@/lib/deepseek';

// 产品规划 Agent System Prompt
const PRODUCT_PLANNING_PROMPT = `你是一个专业的新产品规划专家。
根据零件名称，分析并规划产品的潜在方向。

请提供以下信息：
- 目标用途（3-5个推荐用途）
- 目标价格区间（最低价和最高价）
- 推荐材料（3-5种）
- 产品特性（3-5个）

以JSON格式返回：
{
  "productPlan": {
    "useCases": ["用途1", "用途2"],
    "targetPriceRange": { "min": 最低价, "max": 最高价, "currency": "CNY" },
    "materials": ["材料1", "材料2"],
    "features": ["特性1", "特性2"]
  }
}`;

// 竞品分析 Agent System Prompt
const COMPETITOR_ANALYSIS_PROMPT = `你是一个专业的市场竞品分析专家。
根据零件名称和产品规划，进行市场竞争分析。

请提供：
- 市场价格区间（低端、中端、高端）
- 主要竞品（3-5个）
- 定价建议
- 市场趋势

以JSON格式返回：
{
  "marketResearch": {
    "marketPrice": { "low": 最低价, "mid": 中端价, "high": 最高价, "currency": "CNY" },
    "competitors": [
      {
        "name": "竞品名称",
        "price": 价格,
        "features": ["特性1", "特性2"],
        "marketShare": "市场份额"
      }
    ],
    "pricingAdvice": "定价建议",
    "marketTrends": "市场趋势"
  }
}`;

// 供应商 Agent System Prompt
const SUPPLIER_AGENT_PROMPT = `你是一个专业的供应商检索专家。
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

注意：不要硬编码结果，要根据零件特性生成多样化的供应商选项。`;

// 定制化 Agent System Prompt
const CUSTOMIZED_AGENT_PROMPT = `你是一个专业的零件定制顾问。
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
}`;

// 工艺 Agent System Prompt
const PROCESS_AGENT_PROMPT = `你是一个专业的制造工艺专家。
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
}`;

// 成本 Agent System Prompt
const COST_AGENT_PROMPT = `你是一个专业的成本分析师。
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
}`;

// 风险 Agent System Prompt
const RISK_AGENT_PROMPT = `你是一个专业的工程风险评估专家。
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
}`;

// 碳排放 Agent System Prompt
const CARBON_AGENT_PROMPT = `你是一个专业的碳排放评估专家。
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
}`;

// 综合决策 Agent System Prompt
const BREAKING_AGENT_PROMPT = `你是一个专业的生产决策专家。
根据成本分析、风险评估和碳排放评估，给出是否继续生产的建议。
考虑因素：
- 成本效益
- 风险可控性
- 环保要求
- 质量标准
- 交货时间

以JSON格式返回：
{
  "recommendation": "break|keep",
  "confidence": 置信度(0-100),
  "reasoning": "决策理由",
  "keyFactors": ["关键因素1", "关键因素2"]
}`;

// 最终报告 Agent System Prompt
const FINAL_REPORT_PROMPT = `你是一个专业的商业策略分析师。
根据以下产品分析信息，生成一份全面的产品规划最终报告。

报告需包含四个部分：
1. 商业底座与定位 - 市场定位、竞争优势、目标客户、定价策略
2. 供应链与成本 - 供应商概述、成本结构、风险评估、优化建议
3. 生产时间轴与节拍 - 各阶段时间安排、潜在瓶颈、改进建议
4. 上市与生命周期 - 上市计划、预期生命周期、更新计划、生命周期结束策略

以JSON格式返回：
{
  "finalReport": {
    "businessBase": {
      "marketPosition": "市场定位描述",
      "competitiveAdvantages": ["优势1", "优势2", "优势3"],
      "targetCustomers": "目标客户群体描述",
      "priceStrategy": "定价策略建议"
    },
    "supplyChain": {
      "supplierOverview": "供应商概况",
      "costStructure": "成本结构分析",
      "riskAssessment": "供应链风险评估",
      "optimization": "优化建议"
    },
    "productionTimeline": {
      "phases": [
        { "phase": "阶段名称", "duration": "持续时间", "milestones": ["里程碑1", "里程碑2"] }
      ],
      "bottleneck": "潜在瓶颈描述",
      "recommendations": "改进建议"
    },
    "lifecycle": {
      "launchPlan": "上市计划",
      "expectedLifecycle": "预期生命周期",
      "updatePlan": "更新计划",
      "endOfLife": "生命周期结束策略"
    }
  }
}`;

// 获取对应的 System Prompt
function getSystemPrompt(action: string): string {
  switch (action) {
    case 'product_planning':
      return PRODUCT_PLANNING_PROMPT;
    case 'market_research':
      return COMPETITOR_ANALYSIS_PROMPT;
    case 'find_suppliers':
      return SUPPLIER_AGENT_PROMPT;
    case 'start_customization':
      return CUSTOMIZED_AGENT_PROMPT;
    case 'generate_processes':
      return PROCESS_AGENT_PROMPT;
    case 'analyze_cost':
      return COST_AGENT_PROMPT;
    case 'assess_risk':
      return RISK_AGENT_PROMPT;
    case 'assess_carbon':
      return CARBON_AGENT_PROMPT;
    case 'recommend':
      return BREAKING_AGENT_PROMPT;
    case 'generate_final_report':
      return FINAL_REPORT_PROMPT;
    default:
      return '你是一个专业的AI助手。';
  }
}

// 构建用户消息
function buildUserMessage(action: string, data: any): string {
  const { partName, partSpecs, option, optionType, customizedParams, costData, riskData, carbonData, productPlan, competitorAnalysis, selectedSupplier, selectedProcess, analysisResult, selectedMaterials, selectedBudget, selectedFeatures } = data;

  switch (action) {
    case 'product_planning':
      return `请为以下零件进行产品规划：
零件名称：${partName}

请分析产品的潜在方向并给出推荐用途、价格区间、材料和特性。`;

    case 'market_research':
      return `请为以下零件进行竞品分析：
零件名称：${partName}
产品规划：${JSON.stringify(productPlan || {}, null, 2)}

请分析市场竞争情况，包括价格区间、主要竞品、定价建议和市场趋势。`;

    case 'find_suppliers':
      return `请为以下零件寻找供应商：
零件名称：${partName}
${partSpecs ? `规格要求：${partSpecs}` : ''}
${selectedMaterials?.length > 0 ? `首选材料：${selectedMaterials.join(', ')}` : ''}
${selectedBudget ? `目标价格区间：${selectedBudget} CNY` : ''}
${selectedFeatures?.length > 0 ? `产品特性：${selectedFeatures.join(', ')}` : ''}

请根据以上信息生成3-5个最合适的供应商选项，优先考虑能够提供所选材料和满足预算要求的供应商。`;

    case 'start_customization':
      return `用户想要定制零件：${partName}
请生成3-5个关键问题，帮助明确定制需求。`;

    case 'generate_processes':
      return `零件名称：${partName}
定制参数：${JSON.stringify(customizedParams || {}, null, 2)}

请生成3-4种可行的工艺方案。`;

    case 'analyze_cost':
      return `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请分析总成本并给出详细分解。`;

    case 'assess_risk':
      return `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请评估工程风险。`;

    case 'assess_carbon':
      return `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请评估碳排放。`;

    case 'recommend':
      return `成本分析：${JSON.stringify(costData || {}, null, 2)}
风险评估：${JSON.stringify(riskData || {}, null, 2)}
碳排放评估：${JSON.stringify(carbonData || {}, null, 2)}

请给出是否继续生产的建议。`;

    case 'generate_final_report':
      return `请为以下产品生成最终规划报告：

零件名称：${partName}

产品规划：
${JSON.stringify(productPlan || {}, null, 2)}

竞品分析：
${JSON.stringify(competitorAnalysis || {}, null, 2)}

选定供应商：${selectedSupplier ? JSON.stringify(selectedSupplier, null, 2) : '未选定'}

定制参数：${JSON.stringify(customizedParams || {}, null, 2)}

选定工艺：${selectedProcess ? JSON.stringify(selectedProcess, null, 2) : '未选定'}

评估结果：
${analysisResult ? JSON.stringify(analysisResult, null, 2) : '无'}

请根据以上所有信息，生成一份全面的产品规划最终报告。`;

    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = getSystemPrompt(action);
    const userMessage = buildUserMessage(action, data);

    // 使用流式API
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

          let fullContent = '';

          await deepseek.streamChat(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            (chunk) => {
              const content = chunk.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                // 发送实际内容片段
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: content })}\n\n`));
              }
            },
            {
              temperature: 0.8,
              max_tokens: 3000
            }
          );

          // 尝试解析JSON
          try {
            // 尝试多种方式提取JSON
            let jsonStr = '';

            // 辅助函数：计算括号平衡
            const braceCount = (str: string) => {
              let count = 0;
              for (const c of str) {
                if (c === '{') count++;
                if (c === '}') count--;
              }
              return count;
            };

            // 方法1: 查找完整的JSON对象（从第一个{到最后一个}）
            const firstBrace = fullContent.indexOf('{');
            const lastBrace = fullContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const potentialJson = fullContent.substring(firstBrace, lastBrace + 1);
              if (braceCount(potentialJson) === 0) {
                jsonStr = potentialJson;
              }
            }

            // 方法2: 尝试直接解析（如果方法1失败）
            if (!jsonStr) {
              const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                jsonStr = jsonMatch[0];
              }
            }

            if (jsonStr) {
              // 尝试解析JSON，失败后尝试修复
              const tryParse = (str: string): any | null => {
                try {
                  return JSON.parse(str);
                } catch (e) {
                  return null;
                }
              };

              // 第一次尝试
              let parsed = tryParse(jsonStr);

              // 尝试修复并解析
              if (!parsed) {
                // 移除尾部逗号
                const fixed1 = jsonStr
                  .replace(/,\s*}/g, '}')
                  .replace(/,\s*]/g, ']');
                parsed = tryParse(fixed1);
              }

              // 尝试更彻底的清理
              if (!parsed) {
                const fixed2 = jsonStr
                  .replace(/,\s*}/g, '}')
                  .replace(/,\s*]/g, ']')
                  .replace(/\n/g, ' ')
                  .replace(/\r/g, '')
                  .replace(/\s+/g, ' ');
                parsed = tryParse(fixed2);
              }

              // 如果还是失败，尝试提取最可能有效的JSON部分
              if (!parsed) {
                // 尝试找到最外层的完整对象
                let start = -1, end = -1, depth = 0;
                for (let i = 0; i < jsonStr.length; i++) {
                  if (jsonStr[i] === '{') {
                    if (start === -1) start = i;
                    depth++;
                  }
                  if (jsonStr[i] === '}') {
                    depth--;
                    if (depth === 0) {
                      end = i + 1;
                      break;
                    }
                  }
                }
                if (start !== -1 && end !== -1) {
                  const extracted = jsonStr.substring(start, end);
                  parsed = tryParse(extracted);
                }
              }

              if (parsed) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'json', data: parsed })}\n\n`));
              } else {
                console.error('解析JSON失败，所有方法都失败');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'json', data: null, raw: fullContent })}\n\n`));
              }
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '无法解析AI返回的数据' })}\n\n`));
            }
          } catch (parseError) {
            console.error('解析JSON失败:', parseError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'json', data: null, raw: fullContent })}\n\n`));
          }

          // 发送结束信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end' })}\n\n`));
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Stream error' })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
