# create-z-apps

[English](./README.md) | [简体中文](./README.zh-CN.md)

> 一个简单的 CLI 工具，用于使用模板快速搭建新项目。

## 特性

- 交互式项目创建
- 支持多种模板（PC 端和移动端）
- TypeScript 支持
- 现代化工具链（Vite、Vue 3 等）

## 安装

```bash
# 使用 npm
npm install -g create-z-apps

# 使用 pnpm
pnpm add -g create-z-apps

# 使用 yarn
yarn global add create-z-apps
```

## 使用方法

### 交互式模式

```bash
# 启动交互式模式
create-z-apps

# 或使用 npx
npx create-z-apps
```

### 命令行参数

```bash
# 创建项目并交互式选择模板
create-z-apps my-project

# 使用指定模板创建项目
create-z-apps my-project -t shy-vben-vue
create-z-apps my-project --template shy-unibest
```

### 列出可用模板

```bash
create-z-apps list
```

## 可用模板

### PC 端模板

**shy-vben-vue** - PC 端项目模板

- Vue 3 + TypeScript + Vite
- Element Plus UI 框架
- Pinia 状态管理
- Vue Router
- Axios HTTP 客户端
- ESLint + Prettier

### 移动端模板

**shy-unibest** - 移动端项目模板

- UniApp + Vue 3 + TypeScript
- 支持 H5 和微信小程序
- Pinia 状态管理
- 跨平台支持

## 使用示例

### 创建 PC 端项目

```bash
create-z-apps my-pc-app -t shy-vben-vue

cd my-pc-app
pnpm install
pnpm dev
```

### 创建移动端项目

```bash
create-z-apps my-mobile-app -t shy-unibest

cd my-mobile-app
pnpm install
pnpm dev:h5        # H5 开发
pnpm dev:mp-weixin # 微信小程序开发
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/zephyrljy/create-z-apps.git

# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建生产版本
pnpm build

# 本地测试链接
npm link

# 测试 CLI
create-z-apps test-project

# 列出模板
create-z-apps list
```

## 项目结构

```
create-z-apps/
├── src/
│   ├── config/
│   │   └── templates.ts      # 模板配置
│   ├── utils/
│   │   ├── file.ts           # 文件操作
│   │   ├── logger.ts         # 日志工具
│   │   └── messages.ts       # 用户消息
│   ├── cli.ts                # CLI 命令设置
│   ├── create.ts             # 项目创建逻辑
│   ├── index.ts              # 入口文件
│   └── types.ts              # TypeScript 类型定义
├── templates/
│   ├── shy-vben-vue/         # PC 端模板
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── shy-unibest/          # 移动端模板
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── dist/                     # 构建输出
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── TECHNICAL_ANALYSIS.md     # 技术文档
```

## 技术细节

查看 [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md) 了解：

- `pnpm create` 的工作原理
- 二进制执行逻辑
- Shebang 机制
- 模板处理流程
- 完整的流程图

## 发布

```bash
# 构建（如需要）
pnpm build

# 发布到 npm
npm publish

# 或使用 pnpm
pnpm publish
```

## 许可证

MIT
