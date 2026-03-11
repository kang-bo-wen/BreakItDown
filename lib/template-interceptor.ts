// lib/template-interceptor.ts
/**
 * 模板拦截器
 * 检测用户输入是否命中预设模板
 */

import { PrismaClient } from '@prisma/client';
import { IdentificationResponse } from '@/types/graph';

const prisma = new PrismaClient();

interface TemplateMatch {
  template: any;
  confidence: number;
}

/**
 * 标准化用户输入
 */
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * 计算编辑距离（Levenshtein Distance）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 删除
          dp[i][j - 1] + 1,    // 插入
          dp[i - 1][j - 1] + 1 // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 检测用户输入是否命中预设模板
 */
export async function detectTemplateMatch(userInput: string): Promise<TemplateMatch | null> {
  const normalized = normalizeInput(userInput);

  // 从数据库加载所有活跃模板
  const templates = await prisma.templateSession.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' }
  });

  for (const template of templates) {
    const keywords = JSON.parse(template.keywords) as string[];

    // 精确匹配
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeInput(keyword);

      // 完全匹配
      if (normalized === normalizedKeyword || normalized.includes(normalizedKeyword)) {
        console.log(`🎯 精确匹配: "${userInput}" -> "${template.displayName}" (关键词: "${keyword}")`);
        return { template, confidence: 1.0 };
      }

      // 模糊匹配（编辑距离 <= 2，且长度相近）
      const distance = levenshteinDistance(normalized, normalizedKeyword);
      const lengthRatio = Math.min(normalized.length, normalizedKeyword.length) /
                         Math.max(normalized.length, normalizedKeyword.length);

      // 只有当编辑距离小且长度相近时才认为是模糊匹配
      if (distance <= 2 && lengthRatio >= 0.6) {
        console.log(`🎯 模糊匹配: "${userInput}" -> "${template.displayName}" (关键词: "${keyword}", 距离: ${distance})`);
        return { template, confidence: 0.8 };
      }
    }
  }

  console.log(`❌ 未命中模板: "${userInput}"`);
  return null;
}

/**
 * 模拟 AI 处理延迟（1-1.5秒）
 */
export async function simulateAIDelay(): Promise<void> {
  const delay = 1000 + Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 从模板提取识别结果
 */
export function extractIdentificationFromTemplate(template: any): IdentificationResponse {
  return template.identificationResult as IdentificationResponse;
}

/**
 * 从模板提取完整拆解树
 */
export function extractTreeDataFromTemplate(template: any): any {
  return template.treeData;
}

/**
 * 从模板提取智能体报告
 */
export function extractAgentReportsFromTemplate(template: any): any {
  return template.agentReports;
}
