/**
 * Next.js Instrumentation Hook
 * 服务器启动时自动检测数据库，若无模板则自动入库
 * 文档: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { autoSeedTemplates } = await import('./lib/auto-seed');
    await autoSeedTemplates();
  }
}
