# 使用 Node.js 18 镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 7860

# 设置环境变量
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "start"]
