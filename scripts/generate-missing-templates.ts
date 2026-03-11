// scripts/generate-missing-templates.ts
/**
 * 生成缺失的模板
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateCompleteTemplate } from '../lib/template-generator';
import * as fs from 'fs';

const MISSING_TEMPLATES = [
  {
    templateKey: 'reconnaissance-drone',
    displayName: '军用级微型侦察无人机',
    category: '大国重器',
    keywords: ['drone', '无人机', '侦察无人机', 'reconnaissance drone']
  },
  {
    templateKey: 'gaming-chair',
    displayName: '电竞级人体工学椅',
    category: '生活黑科技',
    keywords: ['gaming chair', '电竞椅', '人体工学椅', 'ergonomic chair']
  },
  {
    templateKey: 'smart-mattress',
    displayName: '智能仿生睡眠床垫',
    category: '生活黑科技',
    keywords: ['smart mattress', '智能床垫', '睡眠床垫', 'sleep mattress']
  }
];

async function main() {
  console.log('🚀 开始生成缺失的模板...\n');

  const outputDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < MISSING_TEMPLATES.length; i++) {
    const config = MISSING_TEMPLATES[i];
    console.log(`\n[${i + 1}/${MISSING_TEMPLATES.length}] 生成: ${config.displayName}`);
    console.log(`  分类: ${config.category}`);

    try {
      const template = await generateCompleteTemplate(config);

      const outputPath = path.join(outputDir, `${config.templateKey}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf-8');

      console.log(`  ✅ 成功保存到: ${config.templateKey}.json`);
      successCount++;

      // 添加延迟避免 API 限流
      if (i < MISSING_TEMPLATES.length - 1) {
        console.log('  ⏳ 等待 3 秒...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`  ❌ 失败:`, error);
      failCount++;
    }
  }

  console.log(`\n\n📊 生成统计:`);
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log(`  📁 输出目录: ${outputDir}`);

  console.log(`\n💡 下一步: 运行 "npm run db:seed" 将模板加载到数据库`);
}

main().catch(console.error);
