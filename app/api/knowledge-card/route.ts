import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callTextAPI } from '@/lib/ai-client';

// 重试函数
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 如果是最后一次重试，直接抛出错误
      if (i === maxRetries) {
        break;
      }

      // 计算延迟时间（指数退避）
      const delay = initialDelay * Math.pow(2, i);
      console.log(`知识卡片请求失败，${delay}ms后重试 (${i + 1}/${maxRetries})...`);

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  // 检查认证
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { parentName, parentDescription, children } = await request.json();

    if (!parentName || !children || children.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 构建知识卡片提示词
    const childrenList = children.map((c: any, idx: number) =>
      `${idx + 1}. ${c.name}${c.isRawMaterial ? ' (原材料)' : ''}: ${c.description}`
    ).join('\n');

    const prompt = `Role: You are a manufacturing engineering expert specializing in production planning and supply chain management.

Task: Generate a detailed manufacturing process card for "${parentName}".

Components to use:
${childrenList}

Return JSON format (strictly follow format, no markdown code blocks):
{
  "title": "${parentName}生产制造流程",
  "doc_number": "PROC-${Date.now().toString().slice(-6)}",
  "supply_chain": {
    "raw_material_source": "主要原材料来源地区或供应商类型",
    "procurement_lead_time": "采购周期（如：2-3周）",
    "estimated_material_cost": "材料成本占比估算"
  },
  "steps": [
    {
      "step_number": 1,
      "stage": "生产阶段（原料/加工/组装/测试/包装）",
      "action_title": "步骤标题（3-5字）",
      "description": "步骤描述（15-30字，包含具体操作和供应链要点）",
      "equipment": "所需设备/生产线类型",
      "parameters": [
        {"label": "核心材料", "value": "具体材料名"},
        {"label": "工艺参数", "value": "温度/压力/时间等关键参数"},
        {"label": "供应链要点", "value": "供应商/物流/仓储说明"}
      ],
      "ai_image_prompt": "Technical drawing of [action], vintage blueprint style, detailed engineering lines, white background"
    }
  ],
  "quality_control": {
    "inspection_points": ["关键质检点1", "关键质检点2"],
    "standards": "执行的质量标准"
  },
  "logistics": {
    "packaging": "包装要求",
    "shipping": "运输方式",
    "storage": "储存条件"
  }
}

要求（中文输出）：
1. **强调供应链流程**：每个步骤必须包含供应链相关信息（原材料采购、物流运输、仓储管理等）
2. **生产工程视角**：从工厂实际生产角度描述，不是教学角度
3. **包含供应链信息**：必须填写 supply_chain、quality_control、logistics 字段
4. **实用性强**：描述要具体、可操作，符合实际生产场景
5. description说明该步骤的具体操作和供应链要点，可以详细一点，但不超过100字
6. ai_image_prompt用英文描述该步骤的技术图纸风格提示词
7. 直接返回JSON，不要包含\`\`\`json标记`;

    // 使用重试机制调用AI API
    const content = await retryWithBackoff(() => callTextAPI(prompt));

    // 清理可能的markdown代码块标记
    const cleanedContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    // 解析JSON
    const jsonData = JSON.parse(cleanedContent);

    return NextResponse.json(jsonData);
  } catch (error: any) {
    console.error('知识卡片生成错误:', error);

    // 返回更详细的错误信息
    const errorMessage = error.message || '知识卡片生成失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
