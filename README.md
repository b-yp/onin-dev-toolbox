<p align="center">
  <img src="./icon.svg" width="128" height="128" alt="Onin Dev Toolbox Logo">
</p>

<h1 align="center">Onin Dev Toolbox</h1>

<p align="center">
  一个为 Onin 平台打造的高效开发者工具箱插件
</p>

---

## 🛠️ 核心功能

目前插件内置了以下十款面向开发者的常用工具：

- 📝 **JSON 格式化**：支持 JSON 字符串的对齐、美化以及在线校验，让数据结构一目了然。
- ⏰ **时间戳转换**：支持 Unix 时间戳与标准日期格式之间的双向即时转换，支持毫秒级处理。
- 🔤 **Base64 转换**：提供文本与 Base64 编码的互转功能，支持标准与 URL 安全模式（URL Safe）。
- 🌐 **URL 编解码**：快速对 URL 进行编解码处理，支持 Component 与 URI 两种模式。
- 🔑 **JWT 解码**：快速解析和解构 JWT 令牌的 Header 与 Payload 载荷，智能展示时间戳字段及过期状态。
- 🔒 **哈希计算器**：支持实时计算 MD5、SHA-1、SHA-256、SHA-512 等哈希值，支持大文件分块读取及进度展示。
- 🔤 **大小写转换**：支持小驼峰、大驼峰、下划线蛇形、中划线等 8 种文本命名风格一键互转。
- 🆔 **UUID 生成器**：一键生成标准 v4 格式 UUID，支持批量生成、大小写切换及连字符控制。
- 🔍 **正则测试**：实时调试及验证 JavaScript 正则表达式，高亮显示匹配内容，内置防零宽死循环防御。
- ⚖️ **文本对比差异**：对比两段文本或代码的差异，支持双栏（Split）对齐与单栏（Inline）视图，具备实时字符级细粒度高亮及同步滚动。

## 🚀 快速开始

### 开发环境

```bash
pnpm install
pnpm dev
```

### 运行单元测试

项目集成了 Vitest 框架对核心逻辑进行测试验证：

```bash
pnpm test
```

### 生产构建

```bash
pnpm build
```

### 插件打包

运行以下命令生成可分发的 `plugin.zip`：

```bash
pnpm pack:plugin
```

## 📦 打包包含内容

打包后的 `plugin.zip` 将自动包含以下核心文件：

- `manifest.json`：插件元数据。
- `icon.svg`：插件图标。
- `dist/`：构建后的前端及后台逻辑。

---

<p align="center">
  Built with ❤️ for the Onin Plugin Ecosystem
</p>
