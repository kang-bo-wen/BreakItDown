// app/api/templates/[key]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const template = await prisma.templateSession.findFirst({
      where: { templateKey: key, isActive: true },
      select: {
        id: true,
        templateKey: true,
        displayName: true,
        category: true,
        identificationResult: true,
        treeData: true,
        agentReports: true,
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    return NextResponse.json({ error: '获取模板详情失败' }, { status: 500 });
  }
}
