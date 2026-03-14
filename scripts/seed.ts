/**
 * 独立 seed 脚本
 * 用法（在主项目根目录下）：
 *   DATABASE_URL="file:./prisma/dev.db" tsx node_modules/breakitdown-templates/scripts/seed.ts
 *
 * 或直接在本包目录下（需配置 DATABASE_URL）：
 *   DATABASE_URL="file:../BreakItDown/prisma/dev.db" npm run seed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 尝试加载主项目的 .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { seedTemplates } from '../index';

const prisma = new PrismaClient();

seedTemplates(prisma)
  .catch((e) => {
    console.error('💥 写入失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
