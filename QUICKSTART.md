# 🚀 快速启动指南

## 当前状态

✅ 系统架构已完成
✅ 第一个模板已生成（客制化机械键盘）
🔄 批量生成脚本正在后台运行（预计 10-15 分钟）

## 立即可用的功能

### 1. 测试现有模板

```bash
# 启动开发服务器
npm run dev

# 访问测试页面
# http://localhost:8000/test-template.html
```

测试关键词：
- "机械键盘" ✅
- "mechanical keyboard" ✅
- "客制化键盘" ✅

### 2. 监控生成进度

```bash
# 查看当前进度
npx tsx scripts/check-templates.ts

# 实时监控（每 5 秒刷新）
npx tsx scripts/watch-progress.ts
```

### 3. 查看后台任务输出

```bash
# 查看批量生成脚本的实时输出
cat C:\Users\25066\AppData\Local\Temp\claude\c--Users-25066-Desktop---\tasks\bau7716ef.output
```

## 等待生成完成后

### 1. 加载所有模板到数据库

```bash
npm run db:seed
```

### 2. 测试所有模板

访问 http://localhost:8000/test-template.html，测试以下关键词：

**【大国重器】**
- "空间计算头显" / "AR头显"
- "火箭发动机"
- "机器狗"
- "无人机"
- "船舶推进器"

**【极客定制】**
- "机械键盘"
- "咖啡机"
- "微单相机"
- "碳纤维自行车"
- "降噪耳机"

**【生活黑科技】**
- "智能床垫"
- "无叶吹风机"
- "宠物喂食器"
- "电竞椅"
- "滑雪护目镜"

**【绿色新消费】**
- "培育钻石"
- "人造肉"
- "环保跑鞋"
- "盲盒"
- "智能婴儿车"

## 常用命令

```bash
# 检查进度
npx tsx scripts/check-templates.ts

# 测试拦截器
npx tsx scripts/test-template-interceptor.ts

# 重新加载模板
npm run db:seed

# 查看数据库
npx prisma studio

# 启动开发服务器
npm run dev
```

## 文件位置

- 📁 模板数据: `prisma/seeds/templates/*.json`
- 📄 系统文档: `TEMPLATE_SYSTEM.md`
- 🧪 测试页面: `public/test-template.html`
- 🔧 拦截器: `lib/template-interceptor.ts`
- 🎯 API 集成: `app/api/identify-text/route.ts`

## 故障排查

### 如果生成失败

1. 检查 API KEY 是否正确：
```bash
cat .env.local | grep AI_API_KEY
```

2. 手动生成单个模板：
```bash
npx tsx scripts/generate-keyboard-template.ts
```

3. 查看错误日志：
```bash
cat C:\Users\25066\AppData\Local\Temp\claude\c--Users-25066-Desktop---\tasks\bau7716ef.output
```

### 如果拦截器不工作

1. 确保模板已加载到数据库：
```bash
npm run db:seed
```

2. 测试拦截器：
```bash
npx tsx scripts/test-template-interceptor.ts
```

3. 检查关键词匹配：
   - 查看 `prisma/seeds/templates/*.json` 中的 `keywords` 字段
   - 确保用户输入包含关键词

## 下一步优化

1. **添加更多关键词**：编辑 JSON 文件中的 `keywords` 数组
2. **调整匹配算法**：修改 `lib/template-interceptor.ts`
3. **优化模板数据**：编辑 JSON 文件，重新运行 `npm run db:seed`
4. **添加新模板**：创建新的 JSON 文件，运行 seed 脚本

## 路演准备清单

- [ ] 所有 20 个模板生成完成
- [ ] 模板已加载到数据库
- [ ] 测试所有关键词匹配
- [ ] 检查拦截器延迟效果（1-1.5秒）
- [ ] 验证前端展示效果
- [ ] 准备演示脚本
