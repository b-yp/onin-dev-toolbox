# Stage 1: Build
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制依赖定义
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建 Web 模式的静态资源
RUN pnpm run build:web

# Stage 2: Serve (Nginx)
FROM nginx:alpine

# 将构建好的静态文件复制到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 覆盖 Nginx 默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
