// scripts/generate-keyboard-template.ts
/**
 * 生成【客制化机械键盘】模板
 * 运行: npx tsx scripts/generate-keyboard-template.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateCompleteTemplate } from '../lib/template-generator';
import * as fs from 'fs';

async function main() {
  console.log('🎹 开始生成【客制化机械键盘】模板...\n');

  try {
    const template = await generateCompleteTemplate({
      templateKey: 'mechanical-keyboard',
      displayName: '客制化机械键盘',
      category: '极客定制',
      keywords: [
        'mechanical keyboard',
        '机械键盘',
        '客制化键盘',
        '定制键盘',
        'custom keyboard',
        'keycap',
        '键帽'
      ]
    });

    // 保存到 JSON 文件
    const outputDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'mechanical-keyboard.json');
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf-8');

    console.log(`\n✅ 模板生成成功！`);
    console.log(`📁 保存位置: ${outputPath}`);
    console.log(`\n模板信息:`);
    console.log(`  - 名称: ${template.displayName}`);
    console.log(`  - 分类: ${template.category}`);
    console.log(`  - 关键词: ${JSON.parse(template.keywords).join(', ')}`);
    console.log(`  - 拆解树节点数: ${countNodes(template.treeData)}`);
    console.log(`  - 智能体报告数: ${Object.keys(template.agentReports).length}`);

  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

function countNodes(tree: any): number {
  if (!tree) return 0;
  let count = 1;
  if (tree.children && Array.isArray(tree.children)) {
    for (const child of tree.children) {
      count += countNodes(child);
    }
  }
  return count;
}

main();
