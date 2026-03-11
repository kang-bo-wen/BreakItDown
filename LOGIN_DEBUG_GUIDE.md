# 🔐 登录问题诊断指南

## 问题描述
用户报告无法登录系统。

## 可能的原因

### 1. 账号不存在
**症状**: 提示"邮箱或密码错误"
**解决方案**:
- 先注册一个新账号
- 访问：http://localhost:3000/register

### 2. 密码错误
**症状**: 提示"邮箱或密码错误"
**解决方案**:
- 确认密码至少 8 个字符
- 重新注册一个测试账号

### 3. 数据库连接问题
**症状**: 页面加载很慢或超时
**解决方案**:
- 检查 `.env.local` 中的 `DATABASE_URL`
- 确保数据库服务正在运行
- 运行 `npx prisma db push` 确保数据库结构正确

### 4. next-auth 配置问题
**症状**: API 返回 500 错误
**解决方案**:
- 检查 `.env.local` 中的 `NEXTAUTH_SECRET`
- 检查 `NEXTAUTH_URL=http://localhost:3000`

## 快速测试步骤

### 方法 1: 手动测试（推荐）

1. **访问注册页面**
   ```
   http://localhost:3000/register
   ```

2. **注册一个新账号**
   - 邮箱：test@example.com
   - 密码：testpassword123（至少8个字符）
   - 名称：Test User

3. **注册成功后会自动登录并跳转到 setup 页面**

4. **如果需要测试登录，先登出（如果有登出按钮）**

5. **访问登录页面**
   ```
   http://localhost:3000/login
   ```

6. **使用刚才注册的账号登录**

### 方法 2: 使用 Playwright 测试

```bash
cd "c:\Users\25066\Desktop\备份\BreakItDown"

# 运行登录测试（会自动注册并登录）
npx playwright test tests/login-debug.spec.ts --headed --timeout=60000

# 或使用 UI 模式
npx playwright test tests/login-debug.spec.ts --ui
```

### 方法 3: 检查数据库

```bash
# 查看数据库中的用户
npx prisma studio
```

这会打开一个 Web 界面，你可以查看数据库中的所有用户。

## 检查环境配置

### 1. 检查 .env.local 文件

```bash
cat .env.local
```

确保包含以下配置：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 2. 检查数据库

```bash
# 查看数据库文件是否存在
ls -lh prisma/dev.db

# 如果不存在，运行迁移
npx prisma migrate dev

# 或推送数据库结构
npx prisma db push
```

### 3. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## 常见错误和解决方案

### 错误 1: "邮箱或密码错误"
**原因**: 账号不存在或密码不正确
**解决**: 重新注册一个账号

### 错误 2: 页面一直加载
**原因**: 数据库连接慢或 API 响应慢
**解决**:
- 检查数据库连接
- 查看浏览器控制台的错误信息
- 查看服务器终端的错误日志

### 错误 3: "登录失败，请稍后重试"
**原因**: next-auth 配置问题或 API 错误
**解决**:
- 检查 `.env.local` 配置
- 查看服务器终端的错误日志
- 确保 `NEXTAUTH_SECRET` 已设置

### 错误 4: 登录后没有跳转
**原因**: 认证状态未正确设置
**解决**:
- 清除浏览器缓存和 Cookie
- 重启开发服务器
- 检查 next-auth 配置

## 调试命令

### 查看服务器日志
开发服务器的终端会显示所有 API 请求和错误。

### 查看浏览器控制台
按 F12 打开开发者工具，查看：
- Console 标签：JavaScript 错误
- Network 标签：API 请求状态
- Application 标签：Cookie 和 Session

### 使用 Playwright Inspector
```bash
npx playwright test tests/login-debug.spec.ts --debug
```

这会打开一个调试界面，你可以：
- 单步执行测试
- 查看页面状态
- 检查元素选择器

## 需要提供的信息

如果问题仍然存在，请提供：

1. **错误消息**
   - 页面上显示的错误
   - 浏览器控制台的错误
   - 服务器终端的错误

2. **操作步骤**
   - 你是如何尝试登录的
   - 使用的邮箱和密码格式

3. **环境信息**
   - 是否能成功注册
   - 数据库文件是否存在
   - `.env.local` 配置是否正确

4. **截图**
   - 登录页面的截图
   - 错误消息的截图

---

**快速解决方案**：
1. 访问 http://localhost:3000/register
2. 注册一个新账号
3. 注册成功后会自动登录
4. 如果需要测试登录，使用刚注册的账号

如果还有问题，请告诉我具体的错误消息！
