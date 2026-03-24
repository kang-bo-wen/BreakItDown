import { NextRequest, NextResponse } from 'next/server';
import deepseek from '@/lib/deepseek';

// 产品规划 Agent System Prompt
const PRODUCT_PLANNING_PROMPT = `你是一个专业的新产品规划专家。
你正在进行产品规划的零件是整体产品的一个组成部分。
**你必须根据该零件在整体拆解结构中的位置和角色来规划其产品方向。**

分析要点：
1. 该零件是整体产品的第几层组成部分
2. 该零件与其他部件之间的关系（是核心部件还是辅助部件）
3. 该零件的功能定位（结构件、功能件、装饰件等）

请提供以下信息：
- 目标用途（3-5个推荐用途）- 必须与该零件在整体中的角色相匹配
- 目标价格区间（最低价和最高价）- 根据零件的重要性和功能定位来估算
- 推荐材料（3-5种）- 考虑该零件的具体功能需求
- 产品特性（3-5个）- 与整体产品功能相关的特性

**重要**：你给出的推荐用途必须能够体现该零件在整体拆解结构中的角色！
如果该零件是核心部件，用途应偏向高端应用；如果是辅助部件，用途应考虑配套价值。

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
- 主要竞品（3-5个）- 每个竞品包含品牌名称和价格信息
- 定价建议
- 市场趋势

以JSON格式返回：
{
  "marketResearch": {
    "searchKeyword": "用于搜索的关键字",
    "marketPrice": { "low": 最低价, "mid": 中端价, "high": 最高价, "currency": "CNY" },
    "competitors": [
      {
        "name": "竞品名称",
        "brand": "品牌名称（如：华为、小米、苹果）",
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

请严格基于以下数据进行分析：
- 成本分析数据
- 风险评估数据
- 碳排放评估数据

决策规则：
1. 如果成本合理、风险可控、碳排放达标，应建议"keep"（保持当前生产方案）
2. 只有在成本过高、风险过高或碳排放不达标时，才建议"break"（继续拆分）
3. 不要假设数据不足，请基于提供的实际数据做出判断

以JSON格式返回：
{
  "recommendation": "break|keep",
  "confidence": 置信度(0-100),
  "reasoning": "决策理由（必须包含对成本、风险、碳排放的具体分析）",
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

// 调用 DeepSeek AI 并解析 JSON
async function callDeepSeek(systemPrompt: string, userMessage: string): Promise<any> {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  console.log('Calling DeepSeek API...');

  const response = await deepseek.chat(messages, {
    temperature: 0.8,
    max_tokens: 3000
  });

  const result = response.choices?.[0]?.message?.content || '';

  try {
    // 多种方式尝试提取 JSON
    let jsonStr = '';

    // 方式1: 尝试从 ```json ... ``` 代码块中提取
    const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // 方式2: 尝试直接匹配 {...}
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    if (!jsonStr) {
      throw new Error('无法提取JSON数据');
    }

    // 尝试解析，可能失败
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      // 尝试修复常见JSON问题
      let fixedJson = jsonStr
        // 移除行尾逗号
        .replace(/,(\s*[\]\}])/g, '$1')
        // 移除单引号改为双引号（简单情况）
        .replace(/'([^']*?)'/g, '"$1"')
        // 移除多余空白
        .trim();

      try {
        return JSON.parse(fixedJson);
      } catch (二次解析Error) {
        console.error('JSON解析失败，原始数据:', result);
        console.error('提取的JSON:', jsonStr);
        throw new Error('JSON格式错误');
      }
    }
  } catch (error) {
    console.error('解析DeepSeek返回数据失败:', error, result);
    return null;
  }
}

// 处理各个 Agent 请求
async function handleAgentRequest(action: string, data: any): Promise<any> {
  const { partName, partSpecs, option, optionType, customizedParams, costData, riskData, carbonData, productPlan, competitorAnalysis, selectedSupplier, selectedProcess, analysisResult, treeData } = data;

  // 解析产品规划信息
  const materials = productPlan?.materials || [];
  const budget = productPlan?.budget || '';
  const features = productPlan?.features || [];

  // 格式化拆解树为上下文信息
  const formatTreeContext = (tree: any, targetPartName: string): string => {
    if (!tree) return '';

    // 递归查找节点路径
    const findNodePath = (node: any, target: string, path: string[] = []): string[] | null => {
      if (!node) return null;

      const currentName = node.name || node.id || '';
      const currentPath = [...path, currentName];

      // 匹配目标
      if (currentName === target) {
        return currentPath;
      }

      // 递归搜索子节点
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const result = findNodePath(child, target, currentPath);
          if (result) return result;
        }
      }

      return null;
    };

    // 获取所有部件名称
    const getAllParts = (node: any, parts: string[] = []): string[] => {
      if (!node) return parts;
      const name = node.name || node.id;
      if (name) parts.push(name);
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          getAllParts(child, parts);
        }
      }
      return parts;
    };

    // 递归查找父节点及其同级节点
    const findParentAndSiblings = (node: any, target: string, parent: any = null): { parent: any, siblings: string[] } | null => {
      if (!node) return null;

      const currentName = node.name || node.id || '';

      // 找到目标节点
      if (currentName === target) {
        if (parent && parent.children) {
          const siblings = parent.children
            .filter((child: any) => (child.name || child.id) !== target)
            .map((child: any) => child.name || child.id)
            .filter((name: string) => name);
          return { parent, siblings };
        }
        return { parent: null, siblings: [] };
      }

      // 递归搜索子节点
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const result = findParentAndSiblings(child, target, node);
          if (result) return result;
        }
      }

      return null;
    };

    const path = findNodePath(tree, targetPartName) || [];
    const allParts = getAllParts(tree);
    const parentInfo = findParentAndSiblings(tree, targetPartName);

    let context = '';

    // 添加路径信息
    if (path.length > 0) {
      context += `\n【该零件在整体拆解结构中的位置】\n`;
      context += `完整路径: ${path.join(' > ')}\n`;
      context += `层级: 第${path.length}层（根节点为第1层）\n`;
      context += `该零件是整体产品的第${path.length}层组成部分\n`;
    }

    // 添加完整结构
    if (allParts.length > 0) {
      context += `\n【完整拆解结构】\n`;
      context += `全部组成部分（共${allParts.length}个）: ${allParts.join('、')}\n`;
    }

    // 添加同级部件信息
    if (parentInfo && parentInfo.siblings.length > 0) {
      context += `\n【同级别部件】\n`;
      context += `与 "${targetPartName}" 同级的其他部件: ${parentInfo.siblings.join('、')}\n`;
    }

    // 添加根节点信息
    if (path.length > 0) {
      context += `\n【产品定位】\n`;
      context += `产品根节点: ${path[0]}\n`;
      context += `目标零件 "${targetPartName}" 是 "${path[0]}" 的组成部分\n`;
    }

    return context;
  };

  const treeContext = formatTreeContext(treeData, partName);

  switch (action) {
    case 'product_planning': {
      const userMessage = `请为以下零件进行产品规划：
零件名称：${partName}
${treeContext}

**核心任务**：根据该零件在整体拆解结构中的位置和角色，推荐最合适的用途。

**关键要求**：
1. 该零件是"${partName}"，它在整体产品中扮演什么角色？
2. 它的用途必须符合它在整体拆解结构中的功能定位
3. 价格区间要考虑该零件是核心部件还是辅助部件

请基于以上分析，给出推荐用途、价格区间、材料和特性。`;

      const result = await callDeepSeek(PRODUCT_PLANNING_PROMPT, userMessage);
      return result;
    }

    case 'market_research': {
      const userMessage = `请为以下零件进行竞品分析：
零件名称：${partName}
产品规划：${JSON.stringify(productPlan || {}, null, 2)}
${treeContext}

请分析市场竞争情况，包括价格区间、主要竞品、定价建议和市场趋势。在制定定价策略时，请考虑该零件在整体产品中的定位。`;

      const result = await callDeepSeek(COMPETITOR_ANALYSIS_PROMPT, userMessage);
      return result;
    }

    case 'find_suppliers': {
      const userMessage = `请为以下零件寻找供应商：
零件名称：${partName}
${partSpecs ? `规格要求：${partSpecs}` : ''}
${materials.length > 0 ? `首选材料：${materials.join(', ')}` : ''}
${budget ? `目标价格区间：${budget} CNY` : ''}
${features.length > 0 ? `产品特性：${features.join(', ')}` : ''}
${treeContext}

请根据以上信息生成3-5个最合适的供应商选项，优先考虑能够提供所选材料和满足预算要求的供应商。在选择供应商时，请考虑该零件在整体产品中的重要性和成本占比。`;

      const result = await callDeepSeek(SUPPLIER_AGENT_PROMPT, userMessage);
      return { suppliers: result?.suppliers || [] };
    }

    case 'start_customization': {
      const userMessage = `用户想要定制零件：${partName}
${treeContext}

请生成3-5个关键问题，帮助明确定制需求。在设计问题时，请考虑该零件在整体拆解结构中的位置和功能，以及它与其他部件之间的关系。`;

      const result = await callDeepSeek(CUSTOMIZED_AGENT_PROMPT, userMessage);
      return { questions: result?.questions || [] };
    }

    case 'generate_processes': {
      const userMessage = `零件名称：${partName}
定制参数：${JSON.stringify(customizedParams || {}, null, 2)}
${treeContext}

请生成3-4种可行的工艺方案。在选择工艺时，请考虑该零件在整体产品中的功能定位和成本占比，选择最合适的加工工艺。`;

      const result = await callDeepSeek(PROCESS_AGENT_PROMPT, userMessage);
      return { processes: result?.processes || [] };
    }

    case 'analyze_cost': {
      const userMessage = `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请分析总成本并给出详细分解。`;

      const result = await callDeepSeek(COST_AGENT_PROMPT, userMessage);
      return { cost: result };
    }

    case 'assess_risk': {
      const userMessage = `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请评估工程风险。`;

      const result = await callDeepSeek(RISK_AGENT_PROMPT, userMessage);
      return { risk: result };
    }

    case 'assess_carbon': {
      const userMessage = `选项类型：${optionType || '标准'}
选项详情：${JSON.stringify(option || {}, null, 2)}

请评估碳排放。`;

      const result = await callDeepSeek(CARBON_AGENT_PROMPT, userMessage);
      return { carbon: result };
    }

    case 'recommend': {
      const userMessage = `成本分析：${JSON.stringify(costData || {}, null, 2)}
风险评估：${JSON.stringify(riskData || {}, null, 2)}
碳排放评估：${JSON.stringify(carbonData || {}, null, 2)}

请给出是否继续生产的建议。`;

      const result = await callDeepSeek(BREAKING_AGENT_PROMPT, userMessage);
      return { recommendation: result };
    }

    case 'generate_final_report': {
      const userMessage = `请为以下产品生成最终规划报告：

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

      const result = await callDeepSeek(FINAL_REPORT_PROMPT, userMessage);
      return result;
    }

    case 'deep_production_analysis': {
      // 深度生产分析 - 顺序执行各个 agent
      // 1. 供应商搜索
      const supplierResult = await handleAgentRequest('find_suppliers', { partName, partSpecs });
      // 2. 定制问题
      const customResult = await handleAgentRequest('start_customization', { partName });
      // 3. 工艺方案
      const processResult = await handleAgentRequest('generate_processes', { partName, customizedParams });
      // 4. 成本分析
      const costResult = await handleAgentRequest('analyze_cost', { option: processResult.processes?.[0], optionType: 'process' });
      // 5. 风险评估
      const riskResult = await handleAgentRequest('assess_risk', { option: processResult.processes?.[0], optionType: 'process' });
      // 6. 碳排放评估
      const carbonResult = await handleAgentRequest('assess_carbon', { option: processResult.processes?.[0], optionType: 'process' });
      // 7. 综合决策
      const breakingResult = await handleAgentRequest('recommend', {
        costData: costResult,
        riskData: riskResult,
        carbonData: carbonResult
      });

      return {
        suppliers: supplierResult.suppliers,
        customization: { questions: customResult.questions },
        processes: processResult.processes,
        cost: costResult.cost,
        risk: riskResult.risk,
        carbon: carbonResult.carbon,
        breaking: breakingResult.recommendation
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const result = await handleAgentRequest(action, data || {});

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Smart manufacturing API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
