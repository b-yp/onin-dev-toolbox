<p align="center">
  <img src="./icon.svg" width="128" height="128" alt="Onin Dev Toolbox Logo">
</p>

<h1 align="center">Onin Dev Toolbox</h1>

<p align="center">
  一个为 Onin 平台打造的高效开发者工具箱插件
</p>

---

## 🛠️ 核心功能

目前插件内置了以下三款面向开发者的常用工具：

- 📝 **JSON 格式化**：支持 JSON 字符串的对齐、美化以及在线校验，让数据结构一目了然。
- ⏰ **时间戳转换**：支持 Unix 时间戳与标准日期格式之间的双向即时转换，支持毫秒级处理。
- 🔤 **Base64 转换**：提供文本与 Base64 编码的互转功能，满足日常开发中常见的数据处理需求。


## 🚀 快速开始

### 开发环境

```bash
pnpm install
pnpm dev
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
