// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 获取所有活跃的模板，按优先级和分类排序
    const templates = await prisma.templateSession.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { category: 'asc' },
        { displayName: 'asc' }
      ],
      select: {
        id: true,
        templateKey: true,
        displayName: true,
        category: true,
        keywords: true,
        identificationResult: true,
      }
    });

    // 按分类分组
    const groupedTemplates = templates.reduce((acc: any, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: template.id,
        templateKey: template.templateKey,
        displayName: template.displayName,
        category: template.category,
        keywords: JSON.parse(template.keywords as string),
        identificationResult: template.identificationResult
      });
      return acc;
    }, {});

    return NextResponse.json({
      templates: groupedTemplates,
      total: templates.length
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json(
      { error: '获取模板失败' },
      { status: 500 }
    );
  }
}
