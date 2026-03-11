// scripts/generate-drone-template.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateCompleteTemplate } from '../lib/template-generator';
import * as fs from 'fs';

async function main() {
  console.log('🚀 生成军用级微型侦察无人机模板...\n');

  const config = {
    templateKey: 'reconnaissance-drone',
    displayName: '军用级微型侦察无人机',
    category: '大国重器',
    keywords: ['drone', '无人机', '侦察无人机', 'reconnaissance drone']
  };

  try {
    const template = await generateCompleteTemplate(config);

    const outputDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
    const outputPath = path.join(outputDir, `${config.templateKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf-8');

    console.log(`✅ 成功保存到: ${config.templateKey}.json`);
    console.log(`\n💡 下一步: 运行 "npm run db:seed" 将模板加载到数据库`);
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();
