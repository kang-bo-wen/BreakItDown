'use server'

import { NextRequest, NextResponse } from 'next/server'
import { callTextAPI } from '@/lib/ai-client'

// 重试机制
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      console.log(`Retry ${i + 1}/${maxRetries}:`, error.message)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parentName, children, breakdownMode } = body

    if (!parentName || !children || !Array.isArray(children)) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 构建生产流程提示词 - 更详细的流程图风格
    const childrenList = children.map((c: any, idx: number) => {
      let desc = c.description || '组件'
      if (c.isRawMaterial) {
        desc += '（原材料）'
      }
      if (c.children && c.children.length > 0) {
        const subItems = c.children.map((sub: any) => sub.name).join('、')
        desc += `，包含: ${subItems}`
      }
      return `${idx + 1}. ${c.name}: ${desc}`
    }).join('\n')

    const prompt = `你是一个专业的工业流程工程师。请为"${parentName}"生成详细的生产制造流程图。

## 基础组件信息：
${childrenList}

## 生产模式：${breakdownMode === 'production' ? '量产模式' : '简易模式'}

请返回JSON格式的生产流程（严格遵守格式，不要添加markdown代码块）：
{
  "title": "${parentName}生产流程图",
  "overview": "整体流程的一句话概述（20-30字）",
  "flowchart": [
    {
      "stage": "阶段名称",
      "icon": "Heroicons图标名称（如 beaker、cog、wrench、cube 等）",
      "steps": [
        {
          "step_id": "A1",
          "action": "具体操作动作",
          "detail": "详细说明（50-80字，必须包含使用的具体组件名称）",
          "tools": ["工具1", "工具2"],
          "materials": ["使用的组件/材料名称"],
          "time_estimate": "预估时间",
          "quality_points": ["质量控制点1", "质量控制点2"]
        }
      ]
    }
  ],
  "total_time": "总预估时间",
  "difficulty": "难度等级（简单/中等/困难）",
  "tips": ["小贴士1", "小贴士2"]
}

要求：
1. flowchart数组包含2-4个阶段（如"原料准备"、"加工成型"、"组装测试"、"包装入库"）
2. 每个阶段包含1-3个具体步骤steps
3. 每个步骤的detail必须**原封不动地使用上述组件名称**，例如："使用${children[0]?.name}作为外壳，配合${children[1]?.name}进行组装"
4. tools列出该步骤使用的工具设备
5. materials列出该步骤使用的主要组件/材料（必须用上面的组件名称）
6. quality_points列出该步骤的质量控制要点
7. difficulty根据复杂度判断：只有原材料则"简单"，有加工有组装则"中等"，有精密加工则"困难"
8. 直接返回JSON，不要包含\`\`\`json标记`;

    // 使用重试机制调用AI API
    const content = await retryWithBackoff(() => callTextAPI(prompt))

    // 清理可能的markdown代码块标记
    const cleanedContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()

    // 解析JSON
    const jsonData = JSON.parse(cleanedContent)

    return NextResponse.json(jsonData)
  } catch (error: any) {
    console.error('生产流程生成错误:', error)

    const errorMessage = error.message || '生产流程生成失败'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
