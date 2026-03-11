// prisma/seed.ts
/**
 * 数据库种子脚本
 * 自动加载 templates 目录下的所有模板
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子...\n');

  // 加载模板目录
  const templatesDir = path.join(__dirname, 'seeds', 'templates');

  if (!fs.existsSync(templatesDir)) {
    console.log('⚠️  模板目录不存在，跳过模板加载');
    return;
  }

  const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

  console.log(`📦 发现 ${templateFiles.length} 个模板文件\n`);

  for (const file of templateFiles) {
    const filePath = path.join(templatesDir, file);
    console.log(`📄 加载: ${file}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const templateData = JSON.parse(content);

      // 检查是否已存在
      const existing = await prisma.templateSession.findUnique({
        where: { templateKey: templateData.templateKey }
      });

      if (existing) {
        // 更新现有模板
        await prisma.templateSession.update({
          where: { templateKey: templateData.templateKey },
          data: templateData
        });
        console.log(`   ✅ 更新: ${templateData.displayName}`);
      } else {
        // 创建新模板
        await prisma.templateSession.create({
          data: templateData
        });
        console.log(`   ✅ 创建: ${templateData.displayName}`);
      }
    } catch (error) {
      console.error(`   ❌ 失败: ${file}`, error);
    }
  }

  console.log('\n🎉 种子完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
