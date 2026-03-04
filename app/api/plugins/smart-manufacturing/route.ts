import { NextRequest, NextResponse } from 'next/server';

// 模拟供应商数据
const mockSuppliers = [
  { name: '精密制造有限公司', specs: '高精度CNC加工,公差±0.01mm', price: 150, reliability: 9.2, leadTime: 7 },
  { name: '智造供应链', specs: '快速成型,3D打印服务', price: 200, reliability: 8.8, leadTime: 3 },
  { name: '工业零件厂商', specs: '大规模生产,性价比高', price: 80, reliability: 7.5, leadTime: 14 },
  { name: '高端定制工作室', specs: '军工级品质,特殊材料', price: 350, reliability: 9.5, leadTime: 10 },
  { name: '新手小作坊', specs: '价格实惠,适合打样', price: 50, reliability: 6.0, leadTime: 5 },
];

// 模拟定制问题
const mockCustomizationQuestions = [
  { question: '您对零件的精度要求是什么？', type: 'select', options: ['普通精度(±0.1mm)', '高精度(±0.05mm)', '超精度(±0.01mm)'] },
  { question: '需要的材料类型？', type: 'select', options: ['铝合金', '不锈钢', '钛合金', '塑料', '碳纤维'] },
  { question: '批量大小？', type: 'select', options: ['1-10件(打样)', '10-100件(小批量)', '100-1000件(中批量)', '1000件以上(大批量)'] },
  { question: '是否需要表面处理？', type: 'select', options: ['无需处理', '阳极氧化', '喷砂', '电镀', '喷漆'] },
  { question: '交货时间要求？', type: 'select', options: ['加急(3天内)', '正常(7天)', '宽松(14天以上)'] },
];

// 模拟工艺方案
const mockProcesses = [
  { name: 'CNC精密加工', description: '使用五轴CNC机床进行精密加工,适合复杂几何形状', cost: 180, risk: '低', carbonEmission: 12.5 },
  { name: '3D打印成型', description: '选择性激光熔化技术,适合小批量定制', cost: 250, risk: '中', carbonEmission: 8.2 },
  { name: '冲压成型', description: '大批量金属板材成型,成本效率高', cost: 90, risk: '低', carbonEmission: 18.3 },
  { name: '铸造工艺', description: '失蜡铸造,适合复杂内部结构', cost: 320, risk: '高', carbonEmission: 25.6 },
];

// 处理各个 Agent 请求
async function handleAgentRequest(action: string, data: any) {
  switch (action) {
    case 'find_suppliers': {
      // 模拟供应商搜索
      await new Promise(resolve => setTimeout(resolve, 1500));
      const suppliers = mockSuppliers.filter(() => Math.random() > 0.2);
      return { suppliers: suppliers.length > 0 ? suppliers : mockSuppliers.slice(0, 3) };
    }

    case 'start_customization': {
      // 模拟定制问题生成
      await new Promise(resolve => setTimeout(resolve, 1200));
      return { questions: mockCustomizationQuestions };
    }

    case 'generate_processes': {
      // 模拟工艺方案生成
      await new Promise(resolve => setTimeout(resolve, 1800));
      return { processes: mockProcesses };
    }

    case 'analyze_cost': {
      // 模拟成本分析
      await new Promise(resolve => setTimeout(resolve, 1000));
      const baseCost = data.option?.price || 200;
      return {
        cost: {
          totalCost: baseCost * 1.5,
          breakdown: {
            material: baseCost * 0.5,
            processing: baseCost * 0.6,
            shipping: baseCost * 0.2,
            other: baseCost * 0.2
          },
          analysis: `基于 ${data.optionType || '标准'} 方案的综合成本分析。材料成本占比最大，建议优化材料选择以降低整体成本。`
        }
      };
    }

    case 'assess_risk': {
      // 模拟风险评估
      await new Promise(resolve => setTimeout(resolve, 1100));
      const riskLevel = Math.random() > 0.5 ? '中等' : '低';
      return {
        risk: {
          riskLevel,
          risks: [
            { type: '供应链风险', description: '原材料供应可能出现延迟', impact: '中', mitigation: '建立备选供应商机制' },
            { type: '质量风险', description: '加工精度可能不达要求', impact: '高', mitigation: '增加质检环节' },
            { type: '时间风险', description: '交货期可能因不可抗力延误', impact: '低', mitigation: '预留缓冲时间' },
          ],
          overallAssessment: `整体风险等级为${riskLevel}，建议重点关注供应链和质量控制环节。`
        }
      };
    }

    case 'assess_carbon': {
      // 模拟碳排放评估
      await new Promise(resolve => setTimeout(resolve, 900));
      const emission = (data.option?.price || 200) * 0.15;
      return {
        carbon: {
          totalEmission: emission,
          breakdown: {
            production: emission * 0.6,
            transportation: emission * 0.25,
            material: emission * 0.15
          },
          rating: emission < 20 ? 'A' : emission < 35 ? 'B' : 'C',
          analysis: `碳排放等级${emission < 20 ? 'A' : emission < 35 ? 'B' : 'C'}，生产环节是主要排放源，建议优化生产工艺。`
        }
      };
    }

    case 'recommend': {
      // 模拟综合决策
      await new Promise(resolve => setTimeout(resolve, 800));
      const costData = data.costData?.cost || {};
      const riskData = data.riskData?.risk || {};
      const carbonData = data.carbonData?.carbon || {};

      const score = (10 - (costData.totalCost || 200) / 50) + (riskData.riskLevel === '低' ? 3 : 0) + (carbonData.rating === 'A' ? 3 : carbonData.rating === 'B' ? 1 : 0);

      return {
        recommendation: score > 12 ? 'break' : 'keep',
        confidence: Math.min(95, 60 + score),
        reasoning: `综合分析得分${score.toFixed(1)}分。成本得分${(10 - (costData.totalCost || 200) / 50).toFixed(1)}，风险评估为${riskData.riskLevel || '中等'}，碳排放等级${carbonData.rating || 'B'}。`,
        keyFactors: ['生产成本', '供应链稳定性', '环保要求', '质量标准', '交货时间']
      };
    }

    case 'full_analysis': {
      // 完整分析 - 包含所有步骤
      const [suppliers, customRes, processRes, costRes, riskRes, carbonRes, breakingRes] = await Promise.all([
        handleAgentRequest('find_suppliers', data),
        handleAgentRequest('start_customization', data),
        handleAgentRequest('generate_processes', data),
        handleAgentRequest('analyze_cost', { option: { price: 200 }, optionType: 'process' }),
        handleAgentRequest('assess_risk', { option: { price: 200 }, optionType: 'process' }),
        handleAgentRequest('assess_carbon', { option: { price: 200 }, optionType: 'process' }),
        handleAgentRequest('recommend', { costData: { cost: { totalCost: 300 } }, riskData: { risk: { riskLevel: '低' } }, carbonData: { carbon: { rating: 'A' } } }),
      ]);

      return {
        suppliers,
        customization: customRes,
        processes: processRes,
        cost: costRes,
        risk: riskRes,
        carbon: carbonRes,
        breaking: breakingRes
      };
    }

    case 'deep_production_analysis': {
      // 深度生产分析 - 包含供应商、定制问题、工艺方案、成本、风险、碳排放
      const [deepSuppliers, customQuestions, processResult, deepCost, deepRisk, deepCarbon] = await Promise.all([
        handleAgentRequest('find_suppliers', data),
        handleAgentRequest('start_customization', data),
        handleAgentRequest('generate_processes', data),
        handleAgentRequest('analyze_cost', { option: { price: 200 }, optionType: 'process' }),
        handleAgentRequest('assess_risk', { option: { price: 200 }, optionType: 'process' }),
        handleAgentRequest('assess_carbon', { option: { price: 200 }, optionType: 'process' }),
      ]);

      const deepBreaking = await handleAgentRequest('recommend', {
        costData: deepCost,
        riskData: deepRisk,
        carbonData: deepCarbon
      });

      return {
        suppliers: deepSuppliers,
        customization: { questions: customQuestions.questions },
        processes: processResult,
        cost: deepCost,
        risk: deepRisk,
        carbon: deepCarbon,
        breaking: deepBreaking
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
