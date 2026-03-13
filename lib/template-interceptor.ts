// lib/template-interceptor.ts
/**
 * 模板拦截器
 * 检测用户输入是否命中预设模板
 */

import { PrismaClient } from '@prisma/client';
import { IdentificationResponse } from '@/types/graph';

const prisma = new PrismaClient();

export interface TemplateMatch {
  template: any;
  confidence: number;
}

// ── 内存索引（避免每次请求全表扫描）──
interface IndexEntry {
  templateKey: string;
  displayName: string;
  keywords: string[];
  dimensions: string[];
  priority: number;
}

let memoryIndex: IndexEntry[] = [];
let indexBuiltAt = 0;
const INDEX_TTL = 5 * 60 * 1000; // 5分钟重建一次

async function ensureIndex(): Promise<void> {
  if (Date.now() - indexBuiltAt < INDEX_TTL && memoryIndex.length > 0) return;

  const templates = await prisma.templateSession.findMany({
    where: { isActive: true },
    select: {
      templateKey: true,
      displayName: true,
      keywords: true,
      dimensions: true,
      priority: true,
    },
    orderBy: { priority: 'desc' },
  });

  memoryIndex = templates.map((t) => ({
    templateKey: t.templateKey,
    displayName: t.displayName,
    keywords: JSON.parse(t.keywords) as string[],
    dimensions: JSON.parse(t.dimensions) as string[],
    priority: t.priority,
  }));
  indexBuiltAt = Date.now();
}

/**
 * 强制重建内存索引（新增/修改模板后调用）
 */
export function invalidateIndex(): void {
  indexBuiltAt = 0;
}

/**
 * 标准化用户输入
 */
function normalizeInput(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * 计算编辑距离（Levenshtein Distance）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * 命中后按 templateKey 加载完整模板数据
 */
async function loadFullTemplate(templateKey: string, confidence: number): Promise<TemplateMatch> {
  const template = await prisma.templateSession.findUnique({ where: { templateKey } });
  return { template, confidence };
}

/**
 * 检测用户输入是否命中预设模板（三级匹配）
 * Level 1: 包含匹配  confidence=1.0
 * Level 2: 模糊匹配  confidence=0.8
 */
export async function detectTemplateMatch(userInput: string): Promise<TemplateMatch | null> {
  await ensureIndex();
  const normalized = normalizeInput(userInput);

  for (const entry of memoryIndex) {
    for (const keyword of entry.keywords) {
      const nk = normalizeInput(keyword);

      // Level 1: 包含匹配
      if (normalized.includes(nk) || nk.includes(normalized)) {
        console.log(`🎯 精确匹配: "${userInput}" -> "${entry.displayName}" (关键词: "${keyword}")`);
        return loadFullTemplate(entry.templateKey, 1.0);
      }

      // Level 2: 编辑距离模糊匹配
      const distance = levenshteinDistance(normalized, nk);
      const ratio =
        Math.min(normalized.length, nk.length) / Math.max(normalized.length, nk.length);
      if (distance <= 2 && ratio >= 0.6) {
        console.log(`🎯 模糊匹配: "${userInput}" -> "${entry.displayName}" (关键词: "${keyword}", 距离: ${distance})`);
        return loadFullTemplate(entry.templateKey, 0.8);
      }
    }
  }

  console.log(`❌ 未命中模板: "${userInput}"`);
  return null;
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
