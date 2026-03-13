/**
 * 服务器启动时自动检测并入库模板
 * 由 instrumentation.ts 调用，仅在数据库无模板时执行
 */
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/db';

type ContentDimension = 'mechanical' | 'electronic' | 'chemical' | 'process';
const VALID_DIMENSIONS: ContentDimension[] = ['mechanical', 'electronic', 'chemical', 'process'];

interface ValidationError { field: string; message: string; }

function validateKeywords(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string') { errors.push({ field: 'keywords', message: '必须是 JSON 字符串' }); return; }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) errors.push({ field: 'keywords', message: '解析后必须是非空数组' });
    else if (parsed.some((k) => typeof k !== 'string')) errors.push({ field: 'keywords', message: '数组中每个元素必须是字符串' });
  } catch { errors.push({ field: 'keywords', message: `JSON 解析失败: ${value}` }); }
}

function validateDimensions(value: unknown, errors: ValidationError[]): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') { errors.push({ field: 'dimensions', message: '必须是 JSON 字符串' }); return; }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) { errors.push({ field: 'dimensions', message: '解析后必须是数组' }); return; }
    const invalid = parsed.filter((d) => !VALID_DIMENSIONS.includes(d));
    if (invalid.length > 0) errors.push({ field: 'dimensions', message: `包含无效维度值: [${invalid.join(', ')}]` });
  } catch { errors.push({ field: 'dimensions', message: `JSON 解析失败: ${value}` }); }
}

function validateIdentificationResult(value: unknown, errors: ValidationError[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push({ field: 'identificationResult', message: '必须是对象' }); return; }
  const obj = value as Record<string, unknown>;
  for (const required of ['name', 'category', 'brief_description', 'icon']) {
    if (typeof obj[required] !== 'string' || !(obj[required] as string).trim())
      errors.push({ field: `identificationResult.${required}`, message: '必须是非空字符串' });
  }
}

function validateTreeNode(node: unknown, nodePath: string, errors: ValidationError[], isRoot = false): void {
  if (!node || typeof node !== 'object' || Array.isArray(node)) { errors.push({ field: nodePath, message: '节点必须是对象' }); return; }
  const n = node as Record<string, unknown>;
  if (typeof n.name !== 'string' || !n.name.trim()) errors.push({ field: `${nodePath}.name`, message: '必须是非空字符串' });
  if (!isRoot && typeof n.is_raw_material !== 'boolean') errors.push({ field: `${nodePath}.is_raw_material`, message: '必须是布尔值' });
  if (n.children !== undefined && n.children !== null) {
    if (!Array.isArray(n.children)) errors.push({ field: `${nodePath}.children`, message: '如果存在，必须是数组' });
    else (n.children as unknown[]).forEach((child, i) => validateTreeNode(child, `${nodePath}.children[${i}]`, errors));
  }
}

function validateTemplate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [{ field: 'root', message: '根节点必须是 JSON 对象' }];
  const d = data as Record<string, unknown>;
  for (const field of ['templateKey', 'displayName', 'category']) {
    if (typeof d[field] !== 'string' || !(d[field] as string).trim()) errors.push({ field, message: '必须是非空字符串' });
  }
  validateKeywords(d.keywords, errors);
  validateDimensions(d.dimensions, errors);
  validateIdentificationResult(d.identificationResult, errors);
  if (!d.treeData || typeof d.treeData !== 'object' || Array.isArray(d.treeData)) {
    errors.push({ field: 'treeData', message: '必须是对象' });
  } else {
    const tree = d.treeData as Record<string, unknown>;
    if (!tree.root) errors.push({ field: 'treeData.root', message: '必须包含 root 节点' });
    else validateTreeNode(tree.root, 'treeData.root', errors, true);
  }
  if (!d.agentReports || typeof d.agentReports !== 'object' || Array.isArray(d.agentReports)) {
    errors.push({ field: 'agentReports', message: '必须是对象' });
  } else if (Object.keys(d.agentReports as object).length < 7) {
    errors.push({ field: 'agentReports', message: `需要 7 份智能体报告，当前只有 ${Object.keys(d.agentReports as object).length} 份` });
  }
  return errors;
}

export async function autoSeedTemplates(): Promise<void> {
  try {
    const count = await prisma.templateSession.count();
    if (count > 0) {
      console.log(`[auto-seed] 已有 ${count} 个模板，跳过入库`);
      return;
    }

    const templatesDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
    if (!fs.existsSync(templatesDir)) {
      console.warn('[auto-seed] 模板目录不存在，跳过:', templatesDir);
      return;
    }

    const jsonFiles = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
    console.log(`[auto-seed] 数据库无模板，开始自动入库 ${jsonFiles.length} 个文件...`);

    let created = 0, failed = 0;
    for (const file of jsonFiles) {
      try {
        const raw = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        const data = JSON.parse(raw);
        const errors = validateTemplate(data);
        if (errors.length > 0) { console.warn(`[auto-seed] ${file} 校验失败:`, errors); failed++; continue; }
        const d = data as Record<string, unknown>;
        if (!d.dimensions) d.dimensions = '["mechanical"]';
        await prisma.templateSession.upsert({
          where: { templateKey: d.templateKey as string },
          update: d as any,
          create: d as any,
        });
        created++;
      } catch (e) {
        console.error(`[auto-seed] ${file} 入库失败:`, (e as Error).message);
        failed++;
      }
    }
    console.log(`[auto-seed] 完成：新建 ${created}，失败 ${failed}`);
  } catch (e) {
    console.error('[auto-seed] 自动入库异常:', e);
  }
}
