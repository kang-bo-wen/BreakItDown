// prisma/seed.ts
/**
 * 傻瓜式模板自动入库脚本
 * 用法: npm run db:seed
 *
 * 运营人员只需把 JSON 文件放入 prisma/seeds/templates/，运行此脚本即可。
 * 脚本会严格校验格式，错误文件会打印详细日志并跳过，不影响其他文件入库。
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// ── 类型定义 ──────────────────────────────────────────────────────────────────

type ContentDimension = 'mechanical' | 'electronic' | 'chemical' | 'process';
const VALID_DIMENSIONS: ContentDimension[] = ['mechanical', 'electronic', 'chemical', 'process'];

interface ValidationError {
  field: string;
  message: string;
}

// ── 校验器 ────────────────────────────────────────────────────────────────────

function validateKeywords(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string') {
    errors.push({ field: 'keywords', message: '必须是 JSON 字符串，如 "[\"关键词1\",\"关键词2\"]"' });
    return;
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      errors.push({ field: 'keywords', message: '解析后必须是非空数组' });
    } else if (parsed.some((k) => typeof k !== 'string')) {
      errors.push({ field: 'keywords', message: '数组中每个元素必须是字符串' });
    }
  } catch {
    errors.push({ field: 'keywords', message: `JSON 解析失败，请检查格式: ${value}` });
  }
}

function validateDimensions(value: unknown, errors: ValidationError[]): void {
  // dimensions 是新增字段，允许缺失（会用默认值）
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    errors.push({ field: 'dimensions', message: '必须是 JSON 字符串，如 "[\"mechanical\",\"electronic\"]"' });
    return;
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      errors.push({ field: 'dimensions', message: '解析后必须是数组' });
      return;
    }
    const invalid = parsed.filter((d) => !VALID_DIMENSIONS.includes(d));
    if (invalid.length > 0) {
      errors.push({
        field: 'dimensions',
        message: `包含无效维度值: [${invalid.join(', ')}]，合法值为: ${VALID_DIMENSIONS.join(' | ')}`,
      });
    }
  } catch {
    errors.push({ field: 'dimensions', message: `JSON 解析失败: ${value}` });
  }
}

function validateIdentificationResult(value: unknown, errors: ValidationError[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push({ field: 'identificationResult', message: '必须是对象' });
    return;
  }
  const obj = value as Record<string, unknown>;
  for (const required of ['name', 'category', 'brief_description', 'icon']) {
    if (typeof obj[required] !== 'string' || !(obj[required] as string).trim()) {
      errors.push({ field: `identificationResult.${required}`, message: '必须是非空字符串' });
    }
  }
}

function validateTreeNode(node: unknown, path: string, errors: ValidationError[], isRoot = false): void {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    errors.push({ field: path, message: '节点必须是对象' });
    return;
  }
  const n = node as Record<string, unknown>;
  if (typeof n.name !== 'string' || !n.name.trim()) {
    errors.push({ field: `${path}.name`, message: '必须是非空字符串' });
  }
  // root 节点本身是产品，不要求 is_raw_material
  if (!isRoot && typeof n.is_raw_material !== 'boolean') {
    errors.push({ field: `${path}.is_raw_material`, message: '必须是布尔值 true/false' });
  }
  // children 缺失时宽容处理：叶子节点可以没有 children 字段
  if (n.children !== undefined && n.children !== null) {
    if (!Array.isArray(n.children)) {
      errors.push({ field: `${path}.children`, message: '如果存在，必须是数组' });
    } else {
      (n.children as unknown[]).forEach((child, i) =>
        validateTreeNode(child, `${path}.children[${i}]`, errors)
      );
    }
  }
}

function validateTreeData(value: unknown, errors: ValidationError[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push({ field: 'treeData', message: '必须是对象' });
    return;
  }
  const tree = value as Record<string, unknown>;
  if (!tree.root) {
    errors.push({ field: 'treeData.root', message: '必须包含 root 节点' });
    return;
  }
  validateTreeNode(tree.root, 'treeData.root', errors, true);
}

function validateAgentReports(value: unknown, errors: ValidationError[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push({ field: 'agentReports', message: '必须是对象' });
    return;
  }
  const reports = value as Record<string, unknown>;
  const keys = Object.keys(reports);
  if (keys.length < 7) {
    errors.push({
      field: 'agentReports',
      message: `需要 7 份智能体报告，当前只有 ${keys.length} 份 (${keys.join(', ')})`,
    });
  }
}

/**
 * 完整校验一个模板文件的数据结构
 * 返回错误列表，空数组表示校验通过
 */
function validateTemplate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ field: 'root', message: '文件根节点必须是 JSON 对象' }];
  }

  const d = data as Record<string, unknown>;

  // 必填字符串字段
  for (const field of ['templateKey', 'displayName', 'category']) {
    if (typeof d[field] !== 'string' || !(d[field] as string).trim()) {
      errors.push({ field, message: '必须是非空字符串' });
    }
  }

  validateKeywords(d.keywords, errors);
  validateDimensions(d.dimensions, errors);
  validateIdentificationResult(d.identificationResult, errors);
  validateTreeData(d.treeData, errors);
  validateAgentReports(d.agentReports, errors);

  return errors;
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  const templatesDir = path.join(__dirname, 'seeds', 'templates');

  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ 模板目录不存在: ${templatesDir}`);
    console.error('   请创建该目录并放入 JSON 模板文件后重试。');
    process.exit(1);
  }

  const allFiles = fs.readdirSync(templatesDir);
  const jsonFiles = allFiles.filter((f) => f.endsWith('.json') && !f.startsWith('_'));

  console.log(`\n🌱 开始模板入库 — 发现 ${jsonFiles.length} 个文件\n`);
  console.log('─'.repeat(60));

  const stats = { created: 0, updated: 0, skipped: 0, failed: 0 };

  for (const file of jsonFiles) {
    const filePath = path.join(templatesDir, file);
    process.stdout.write(`📄 ${file} ... `);

    // 1. 读取文件
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.log('❌ 读取失败');
      console.error(`   原因: ${(e as Error).message}\n`);
      stats.failed++;
      continue;
    }

    // 2. JSON 解析
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.log('❌ JSON 格式错误');
      console.error(`   原因: ${(e as Error).message}`);
      console.error('   请用 https://jsonlint.com 检查文件格式\n');
      stats.failed++;
      continue;
    }

    // 3. Schema 校验
    const errors = validateTemplate(data);
    if (errors.length > 0) {
      console.log(`❌ Schema 校验失败 (${errors.length} 个错误)`);
      errors.forEach((err) => console.error(`   • [${err.field}] ${err.message}`));
      console.error('');
      stats.failed++;
      continue;
    }

    // 4. 入库（upsert）
    const d = data as Record<string, unknown>;
    const templateKey = d.templateKey as string;

    // dimensions 缺失时补默认值
    if (!d.dimensions) {
      d.dimensions = '["mechanical"]';
    }

    try {
      const existing = await prisma.templateSession.findUnique({ where: { templateKey } });

      if (existing) {
        await prisma.templateSession.update({
          where: { templateKey },
          data: d as any,
        });
        console.log(`✅ 更新 (${d.displayName})`);
        stats.updated++;
      } else {
        await prisma.templateSession.create({ data: d as any });
        console.log(`✅ 创建 (${d.displayName})`);
        stats.created++;
      }
    } catch (e) {
      console.log('❌ 数据库写入失败');
      console.error(`   原因: ${(e as Error).message}\n`);
      stats.failed++;
    }
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 入库结果:`);
  console.log(`   ✅ 新建: ${stats.created}  |  🔄 更新: ${stats.updated}  |  ❌ 失败: ${stats.failed}`);

  if (stats.failed > 0) {
    console.log(`\n⚠️  有 ${stats.failed} 个文件入库失败，请根据上方日志修正后重新运行。`);
    process.exit(1);
  } else {
    console.log('\n🎉 全部完成！\n');
  }
}

main()
  .catch((e) => {
    console.error('\n💥 脚本异常退出:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
