import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET 获取生产分析进度
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const partId = request.nextUrl.searchParams.get('partId');

    if (!sessionId || !partId) {
      return NextResponse.json({ error: '缺少 sessionId 或 partId' }, { status: 400 });
    }

    const progress = await prisma.productionAnalysisProgress.findFirst({
      where: { sessionId, partId }
    });

    if (!progress) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error('获取生产分析进度失败:', error);
    return NextResponse.json({ error: '获取进度失败' }, { status: 500 });
  }
}

// POST 保存生产分析进度
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      partId,
      partName,
      currentStep,
      productPlan,
      competitorAnalysis,
      suppliers,
      selectedSupplier,
      customizationQuestions,
      customizationAnswers,
      processes,
      selectedProcess,
      analysisResult,
      finalReport,
      isCompleted
    } = body;

    if (!sessionId || !partId) {
      return NextResponse.json({ error: '缺少 sessionId 或 partId' }, { status: 400 });
    }

    // 验证 session 是否存在
    const session = await prisma.deconstructionSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // 查找是否已有进度
    const existing = await prisma.productionAnalysisProgress.findFirst({
      where: { sessionId, partId }
    });

    let progress;
    if (existing) {
      // 更新
      progress = await prisma.productionAnalysisProgress.update({
        where: { id: existing.id },
        data: {
          partName: partName || undefined,
          currentStep,
          productPlan,
          competitorAnalysis,
          suppliers,
          selectedSupplier,
          customizationQuestions,
          customizationAnswers,
          processes,
          selectedProcess,
          analysisResult,
          finalReport,
          isCompleted,
          updatedAt: new Date()
        }
      });
    } else {
      // 创建
      progress = await prisma.productionAnalysisProgress.create({
        data: {
          sessionId,
          partId,
          partName: partName || '',
          currentStep: currentStep || 'product-planning',
          productPlan,
          competitorAnalysis,
          suppliers,
          selectedSupplier,
          customizationQuestions,
          customizationAnswers,
          processes,
          selectedProcess,
          analysisResult,
          finalReport,
          isCompleted: isCompleted || false
        }
      });
    }

    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error('保存生产分析进度失败:', error);
    return NextResponse.json({ error: '保存进度失败' }, { status: 500 });
  }
}

// DELETE 删除生产分析进度
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const partId = request.nextUrl.searchParams.get('partId');

    if (!sessionId || !partId) {
      return NextResponse.json({ error: '缺少 sessionId 或 partId' }, { status: 400 });
    }

    await prisma.productionAnalysisProgress.deleteMany({
      where: { sessionId, partId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除生产分析进度失败:', error);
    return NextResponse.json({ error: '删除进度失败' }, { status: 500 });
  }
}
