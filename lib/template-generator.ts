// lib/template-generator.ts
/**
 * 模板数据生成器
 * 使用 DeepSeek API 生成完整的模板数据
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices[0].message.content;
}

/**
 * 生成完整的拆解树
 */
export async function generateDeconstructionTree(itemName: string): Promise<any> {
  const prompt = `你是一个制造业和材料专家。请为"${itemName}"生成一个完整的拆解树（最多6层）。

要求：
1. 使用中文输出
2. 第一层：主要功能组件（3-5个）
3. 逐层拆解到基础原材料（铁矿石、原油、硅砂等）
4. 每个节点包含：name（名称）、description（描述）、is_raw_material（是否原材料）、icon（emoji图标）、searchTerm（英文搜索词）
5. 返回完整的树形结构JSON

输出格式：
{
  "root": {
    "name": "${itemName}",
    "description": "简短描述",
    "icon": "📱",
    "searchTerm": "mechanical keyboard",
    "children": [
      {
        "name": "组件名",
        "description": "描述",
        "is_raw_material": false,
        "icon": "⌨️",
        "searchTerm": "keycap",
        "children": [...]
      }
    ]
  }
}

请直接返回JSON，不要包含任何markdown标记。`;

  const response = await callDeepSeek([
    { role: 'system', content: '你是一个专业的制造业分析专家，擅长拆解产品结构。' },
    { role: 'user', content: prompt }
  ]);

  // 清理 markdown 代码块
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleaned);
}

/**
 * 生成7个智能体分析报告
 */
export async function generateAgentReports(itemName: string, treeData: any): Promise<any> {
  const agents = [
    {
      name: 'market_analyst',
      prompt: `作为市场分析师，分析"${itemName}"的市场定位、目标用户、竞争格局和市场趋势。返回JSON格式。`
    },
    {
      name: 'supply_chain_expert',
      prompt: `作为供应链专家，分析"${itemName}"的供应链结构、关键供应商、物流路径和风险点。返回JSON格式。`
    },
    {
      name: 'manufacturing_engineer',
      prompt: `作为制造工程师，分析"${itemName}"的生产工艺、制造流程、质量控制和生产成本。返回JSON格式。`
    },
    {
      name: 'materials_scientist',
      prompt: `作为材料科学家，分析"${itemName}"的材料选择、材料特性、替代方案和环保性。返回JSON格式。`
    },
    {
      name: 'cost_analyst',
      prompt: `作为成本分析师，分析"${itemName}"的成本结构、定价策略、利润空间和成本优化建议。返回JSON格式。`
    },
    {
      name: 'sustainability_expert',
      prompt: `作为可持续发展专家，分析"${itemName}"的环境影响、碳足迹、循环经济潜力和绿色改进方案。返回JSON格式。`
    },
    {
      name: 'innovation_strategist',
      prompt: `作为创新战略师，分析"${itemName}"的技术创新点、未来发展方向、颠覆性机会和创新建议。返回JSON格式。`
    }
  ];

  const reports: any = {};

  for (const agent of agents) {
    console.log(`Generating report from ${agent.name}...`);
    const response = await callDeepSeek([
      { role: 'system', content: `你是一个${agent.name}，提供专业的分析报告。` },
      { role: 'user', content: agent.prompt }
    ]);

    // 清理并解析
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      reports[agent.name] = JSON.parse(cleaned);
    } catch (e) {
      // 如果解析失败，保存原始文本
      reports[agent.name] = { raw_text: cleaned };
    }
  }

  return reports;
}

/**
 * 生成完整模板
 */
export async function generateCompleteTemplate(config: {
  templateKey: string;
  displayName: string;
  category: string;
  keywords: string[];
}): Promise<any> {
  console.log(`🚀 Generating template for: ${config.displayName}`);

  // 1. 生成识别结果
  const identificationResult = {
    name: config.displayName,
    category: config.category,
    brief_description: `${config.displayName}的详细拆解分析`,
    icon: '⌨️',
    searchTerm: config.keywords[0]
  };

  // 2. 生成拆解树
  console.log('📊 Generating deconstruction tree...');
  const treeData = await generateDeconstructionTree(config.displayName);

  // 3. 生成智能体报告
  console.log('🤖 Generating agent reports...');
  const agentReports = await generateAgentReports(config.displayName, treeData);

  return {
    templateKey: config.templateKey,
    displayName: config.displayName,
    category: config.category,
    keywords: JSON.stringify(config.keywords),
    identificationResult,
    treeData,
    nodePositions: {},
    agentReports,
    productionAnalysis: {},
    priority: 0,
    isActive: true
  };
}
