import robotDog from './templates/robot-dog.json';

/**
 * 所有可用模板数据
 */
export const templates = [robotDog] as const;

/**
 * 将模板数据写入 Prisma 数据库（upsert）
 * 在主项目的 prisma/seed.ts 中调用此函数
 *
 * @param prisma - 主项目传入的 PrismaClient 实例
 */
export async function seedTemplates(prisma: any): Promise<void> {
  console.log(`\n📦 [breakitdown-templates] 开始写入 ${templates.length} 个模板...\n`);

  for (const template of templates) {
    const existing = await prisma.templateSession.findUnique({
      where: { templateKey: template.templateKey },
    });

    if (existing) {
      await prisma.templateSession.update({
        where: { templateKey: template.templateKey },
        data: template as any,
      });
      console.log(`  🔄 更新: ${template.displayName}`);
    } else {
      await prisma.templateSession.create({ data: template as any });
      console.log(`  ✅ 创建: ${template.displayName}`);
    }
  }

  console.log('\n🎉 [breakitdown-templates] 模板写入完成！\n');
}
