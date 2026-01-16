# create-z-apps 技术解析文档

## 目录

1. [pnpm create 原理深度解析](#pnpm-create-原理深度解析)
2. [create-z-apps 二进制执行逻辑](#create-z-apps-二进制执行逻辑)
3. [TypeScript 构建系统解析](#typescript-构建系统解析)
4. [完整执行流程图](#完整执行流程图)
5. [模板系统架构](#模板系统架构)
6. [与主流方案对比](#与主流方案对比)
7. [开发调试指南](#开发调试指南)
8. [常见问题排查](#常见问题排查)

---

## pnpm create 原理深度解析

### 1. 什么是 pnpm create

`pnpm create` 是 pnpm 包管理器提供的项目脚手架命令，用于快速创建新项目。

```bash
# 语法
pnpm create <package-name> [项目参数]

# 示例
pnpm create vite
pnpm create react-app my-app
pnpm create z-apps my-project
```

### 2. pnpm create 的等价关系

`pnpm create` 实际上是 `pnpm init` 的别名，两者完全等价：

```bash
pnpm create z-apps    # 等价于
pnpm init z-apps      # 等价于
pnpm dlx create-z-apps # 等价于
pnpm create z-apps
```

### 3. 核心执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│  用户执行: pnpm create z-apps my-project                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 包名转换                                                │
│  "z-apps" → "create-z-apps"                                     │
│  规则: 如果包名不以 create- 开头，自动添加前缀                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 包解析与下载                                            │
│  - 从 npm registry 查询 create-z-apps 包                        │
│  - 临时下载到全局缓存 (不安装到 node_modules)                   │
│  - 使用 pnpm dlx 机制执行                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 定位二进制入口                                          │
│  读取 package.json 的 bin 字段:                                 │
│  {                                                              │
│    "bin": {                                                     │
│      "create-z-apps": "./dist/index.cjs"                       │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 执行二进制文件                                          │
│  node ./dist/index.cjs my-project                               │
│  - 传入剩余参数 (my-project)                                    │
│  - 在临时环境执行                                               │
│  - 执行完成后清理临时文件                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: 项目创建完成                                            │
│  my-project/ 目录已创建，包含模板内容                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4. pnpm dlx 工作原理

`pnpm create` 底层使用 `pnpm dlx` (download and execute)：

```
pnpm dlx create-z-apps my-project

↓ 等价于

1. 临时安装 create-z-apps 到全局缓存
   ~/.pnpm-store/v3/files/...

2. 执行包的 bin 命令
   node [缓存路径]/create-z-apps/dist/index.cjs my-project

3. 执行完成后，保留缓存以便复用
```

**与 npx 的对比：**

| 特性     | pnpm dlx               | npx            |
| -------- | ---------------------- | -------------- |
| 包存储   | 使用 pnpm 内容寻址存储 | 使用 npm 缓存  |
| 速度     | 更快（硬链接去重）     | 相对较慢       |
| 内存占用 | 更低                   | 较高           |
| 包清理   | 手动清理               | 自动清理过期包 |

### 5. 包名命名约定

为了让你的包支持 `pnpm create`，必须遵循命名约定：

```
create-z-apps     → pnpm create z-apps ✓
create-vite       → pnpm create vite ✓
create-react-app  → pnpm create react-app ✓

z-tool            → pnpm create z-tool   ✗ (不会自动添加前缀)
@org/create-foo   → pnpm create @org/foo ✓
```

---

## create-z-apps 二进制执行逻辑

### 1. package.json bin 配置解析

```json
{
  "name": "create-z-apps",
  "type": "module",
  "bin": {
    "create-z-apps": "./dist/index.cjs"
  }
}
```

**bin 字段的含义：**

- **key** (`create-z-apps`): 命令名称，全局安装后可以通过 `create-z-apps` 直接调用
- **value** (`./dist/index.cjs`): 实际执行的编译后文件路径（CommonJS 格式）

**为什么输出是 CommonJS 而源码是 ESM？**

Node.js 的 bin 执行需要 CommonJS 格式以保证最大兼容性。项目使用 tsup 将 TypeScript (ESM) 编译为 CommonJS。

### 2. Shebang 机制

```javascript
#!/usr/bin/env node
```

**这行代码的作用：**

```
#!/usr/bin/env node
│  │           │
│  │           └── 使用系统 PATH 中的 node 解释器
│  └── shebang 开头标记，告诉系统这是可执行脚本
└── 系统程序的绝对路径（通过 env 查找）
```

**在 tsup 中通过 banner 添加：**

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  banner: {
    js: '#!/usr/bin/env node',  // 编译时自动添加到输出文件顶部
  },
})
```

**为什么用 `#!/usr/bin/env node` 而不是 `#!/usr/bin/node`？**

```bash
# ❌ 硬编码路径 - 不同系统 node 路径可能不同
#!/usr/bin/node

# ✅ 使用 env 查找 - 跨平台兼容
#!/usr/bin/env node
```

**执行过程：**

```bash
# 当用户在终端执行
$ create-z-apps my-project

# 系统实际执行
$ /usr/bin/env node ./dist/index.cjs my-project

# npm 全局安装时会创建包装脚本 (Linux/Mac)
$ /usr/local/bin/create-z-apps → node /path/to/create-z-apps/dist/index.cjs

# Windows 会创建 .cmd 批处理文件
$ create-z-apps.cmd → "%_node%" "%~dp0\..\create-z-apps\dist\index.cjs" %*
```

### 3. 入口文件 (src/index.ts) 执行流程

```typescript
import { createCli } from './cli.js'

const cli = createCli()
cli.parse()
```

**流程图 - 程序启动：**

```
┌─────────────────────────────────────────────────────────────┐
│  命令行输入                                                  │
├─────────────────────────────────────────────────────────────┤
│  $ create-z-apps my-app    → 启动程序                       │
│  $ create-z-apps           → 启动交互式询问                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  src/index.ts - 程序入口                                    │
│  - 导入 createCli 函数                                      │
│  - 创建 CLI 实例                                            │
│  - 调用 parse() 解析命令行参数                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  src/cli.ts - Commander.js 配置                            │
│  - 定义命令、选项、参数                                     │
│  - 注册 action 回调                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  src/create.ts - 项目创建核心逻辑                          │
│  - 交互式询问                                              │
│  - 模板复制                                                │
│  - 变量替换                                                │
└─────────────────────────────────────────────────────────────┘
```

### 4. Commander.js 命令解析

```typescript
// src/cli.ts
export function createCli(): Command {
  const program = new Command();

  program
    .name("create-z-apps")
    .description("Create a new project with a template")
    .version("1.0.0")
    .argument("[project-name]", "Name of the project")
    .option("-t, --template <template>", "Template to use")
    .action(async (projectName, options) => {
      await createProject({
        projectName,
        template: options.template,
      });
    });

  // list 子命令
  program
    .command("list")
    .description("List all available templates")
    .action(() => {
      printTemplatesList(TEMPLATES);
    });

  return program;
}
```

**命令解析流程：**

```
┌────────────────────────────────────────────────────────────┐
│  用户输入命令                                              │
├────────────────────────────────────────────────────────────┤
│  $ create-z-apps my-app -t shy-vben-vue                   │
│  $ create-z-apps list                                     │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Commander.js 解析                                         │
│  - 识别主命令或子命令                                      │
│  - 解析位置参数 (projectName)                             │
│  - 解析选项 (--template)                                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  路由到对应的 action 函数                                  │
│  - 主命令 → createProject()                               │
│  - list 子命令 → printTemplatesList()                     │
└────────────────────────────────────────────────────────────┘
```

### 5. 交互式询问逻辑 (Inquirer)

```typescript
// src/create.ts
const prompt = (inquirer as any).default?.prompt || inquirer.prompt

export async function createProject(options: CreateOptions = {}): Promise<void> {
  let { projectName, template } = options
  const questions: inquirer.QuestionCollection[] = []

  // 如果没有提供项目名称，询问项目名称
  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: 'my-shy-project',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Project name is required'
        }
        return true
      },
    })
  }

  // 如果没有指定模板，询问选择模板
  if (!template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { name: 'shy-vben-vue - PC 端项目模板 (基于 Vue 3 + Vite + TypeScript)', value: 'shy-vben-vue' },
        { name: 'shy-unibest - 移动端项目模板 (基于 UniApp + Vue 3)', value: 'shy-unibest' },
      ],
    })
  }

  // 执行询问
  if (questions.length > 0) {
    const answers = await prompt(questions)
    if (!projectName) projectName = answers.projectName
    if (!template) template = answers.template
  }
}
```

**Inquirer 兼容性处理：**

```typescript
// Inquirer v9 是 ESM only，需要特殊处理
const prompt = (inquirer as any).default?.prompt || inquirer.prompt
```

**交互界面示例：**

```
? What is your project name? my-awesome-project
? Select a template:
  shy-vben-vue - PC 端项目模板 (基于 Vue 3 + Vite + TypeScript)
❯ shy-unibest - 移动端项目模板 (基于 UniApp + Vue 3)
```

### 6. 路径解析与模板复制

```typescript
// src/create.ts
const targetDir = path.resolve(process.cwd(), projectName)
// process.cwd() = 当前工作目录
// 例如: /home/user/projects + my-app → /home/user/projects/my-app

const templateDir = path.join(__dirname, '../templates', template)
// __dirname = dist/index.cjs 所在目录 (编译后)
// 例如: /path/to/create-z-apps/dist/../templates/shy-vben-vue
//       → /path/to/create-z-apps/templates/shy-vben-vue
```

**路径解析示意图：**

```
当前目录: /home/user/dev/
执行命令: create-z-apps my-app -t shy-vben-vue

┌─────────────────────────────────────────────────────────────┐
│  path.resolve(process.cwd(), projectName)                   │
├─────────────────────────────────────────────────────────────┤
│  process.cwd()          → /home/user/dev                   │
│  projectName            → my-app                           │
│  path.resolve()         → /home/user/dev/my-app            │
│  (targetDir)                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  path.join(__dirname, '../templates', template)             │
├─────────────────────────────────────────────────────────────┤
│  __dirname              → /path/to/create-z-apps/dist      │
│  '../templates'         → 向上一级再进入 templates          │
│  template               → shy-vben-vue                     │
│  path.join()           → /path/to/create-z-apps/templates/ │
│                         │   shy-vben-vue                   │
│  (templateDir)                                            │
└─────────────────────────────────────────────────────────────┘
```

### 7. 目录检查与文件操作

```typescript
// src/utils/file.ts
export async function copyTemplate(
  templateDir: string,
  targetDir: string,
): Promise<void> {
  await fs.copy(templateDir, targetDir)
}

export async function updatePackageJson(
  targetDir: string,
  projectName: string,
): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json')

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath)
    packageJson.name = projectName
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }
}

export async function updateReadme(
  targetDir: string,
  projectName: string,
  template: Template,
): Promise<void> {
  const readmePath = path.join(targetDir, 'README.md')

  if (await fs.pathExists(readmePath)) {
    let readmeContent = await fs.readFile(readmePath, 'utf-8')
    readmeContent = readmeContent.replace(/{{PROJECT_NAME}}/g, projectName)
    readmeContent = readmeContent.replace(/{{TEMPLATE_NAME}}/g, template.name)
    await fs.writeFile(readmePath, readmeContent)
  }
}
```

**复制流程图：**

```
templates/shy-vben-vue/    my-app/
├── package.json      →    ├── package.json
├── README.md         →    ├── README.md
└── src/              →    └── src/
    └── main.ts            └── main.ts

┌─────────────────────────────────────────────────────────────┐
│  fs.copy(templateDir, targetDir)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 递归读取 template/ 目录结构                        │
│  ['package.json', 'README.md', 'src/']                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 在目标位置创建目录                                 │
│  mkdir -p my-app/src                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 复制文件内容                                       │
│  cp templates/.../package.json my-app/package.json         │
│  cp templates/.../README.md my-app/README.md               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 变量替换                                           │
│  - package.json.name → my-app                              │
│  - README.md {{PROJECT_NAME}} → my-app                     │
└─────────────────────────────────────────────────────────────┘
```

### 8. 终端输出与颜色

```typescript
// src/utils/logger.ts
import chalk from 'chalk'

export function logInfo(message: string): void {
  console.log(chalk.cyan(message))
}

export function logSuccess(message: string): void {
  console.log(chalk.green(message))
}

export function logError(message: string): void {
  console.error(chalk.red(message))
}

export function logGray(message: string): void {
  console.log(chalk.gray(message))
}

export function logYellow(message: string): void {
  console.log(chalk.yellow(message))
}

export function logBold(message: string): void {
  console.log(chalk.bold(message))
}
```

**Chalk 颜色映射：**

```
chalk.cyan()   → \x1b[36m...  青色 (进度信息)
chalk.green()  → \x1b[32m...  绿色 (成功信息)
chalk.red()    → \x1b[31m...  红色 (错误信息)
chalk.yellow() → \x1b[33m...  黄色 (警告信息)
chalk.gray()   → \x1b[90m...  灰色 (次要信息)
chalk.bold()   → \x1b[1m...   粗体 (标题)
```

---

## TypeScript 构建系统解析

### 1. 项目结构

```
create-z-apps/
├── src/
│   ├── index.ts           # 程序入口
│   ├── cli.ts             # CLI 配置
│   ├── create.ts          # 项目创建逻辑
│   ├── types.ts           # 类型定义
│   ├── config/
│   │   └── templates.ts   # 模板配置
│   └── utils/
│       ├── logger.ts      # 日志工具
│       ├── file.ts        # 文件操作
│       └── messages.ts    # 提示信息
├── templates/             # 项目模板
│   ├── shy-vben-vue/
│   └── shy-unibest/
├── dist/                  # 编译输出 (自动生成)
│   ├── index.cjs
│   └── index.d.ts
├── tsup.config.ts         # tsup 配置
├── tsconfig.json          # TypeScript 配置
└── package.json
```

### 2. tsup 配置解析

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],      // 入口文件
  format: ['cjs'],              // 输出格式：CommonJS
  dts: true,                    // 生成类型声明文件
  clean: true,                  // 清理输出目录
  banner: {
    js: '#!/usr/bin/env node',  // 添加 shebang
  },
  outDir: 'dist',               // 输出目录
})
```

**配置说明：**

| 选项      | 值                   | 说明                                    |
| --------- | -------------------- | --------------------------------------- |
| entry     | ['src/index.ts']     | 入口文件列表                            |
| format    | ['cjs']              | 输出 CommonJS 格式（Node.js bin 兼容）  |
| dts       | true                 | 生成 .d.ts 类型声明文件                 |
| clean     | true                 | 每次构建前清理 dist 目录                |
| banner.js | '#!/usr/bin/env node'| 在输出文件顶部添加 shebang              |
| outDir    | 'dist'               | 输出目录                                |

### 3. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 4. 构建流程

```
┌─────────────────────────────────────────────────────────────┐
│  源码 (TypeScript - ESM)                                    │
├─────────────────────────────────────────────────────────────┤
│  src/index.ts                                               │
│  src/cli.ts                                                 │
│  src/create.ts                                              │
│  ...                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ pnpm run build (tsup)
                         │
┌─────────────────────────────────────────────────────────────┐
│  tsup 编译过程                                              │
│  - 使用 esbuild 进行快速转译                                │
│  - TypeScript 类型检查                                      │
│  - ESM → CJS 转换                                           │
│  - 添加 shebang banner                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  编译输出 (CommonJS)                                        │
├─────────────────────────────────────────────────────────────┤
│  dist/index.cjs        ← 可执行文件 (带 shebang)           │
│  dist/index.d.ts        ← 类型声明                          │
└─────────────────────────────────────────────────────────────┘
```

### 5. package.json 构建配置

```json
{
  "type": "module",
  "bin": {
    "create-z-apps": "./dist/index.cjs"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsup",
    "build:watch": "tsup --watch",
    "prepublishOnly": "pnpm build"
  },
  "files": [
    "dist",
    "templates"
  ]
}
```

**说明：**

- `type: "module"`: 源码使用 ESM 格式
- `bin: "./dist/index.cjs"`: 输出 CJS 格式给 Node.js 执行
- `dev: "tsx"`: 使用 tsx 直接运行 TypeScript（开发时）
- `prepublishOnly`: 发布前自动构建
- `files`: 只发布 dist 和 templates 目录

---

## 完整执行流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│  $ pnpm create z-apps my-app -t shy-vben-vue                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    pnpm create 阶段                             │
│  1. 包名转换: z-apps → create-z-apps                            │
│  2. 包查找: 查询 npm registry                                   │
│  3. 包下载: pnpm dlx 临时安装                                   │
│  4. 读取 package.json bin 字段                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  系统执行二进制文件                              │
│  $ node [缓存路径]/create-z-apps/dist/index.cjs my-app         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           dist/index.cjs - Shebang 解析                        │
│  #!/usr/bin/env node → 启动 Node.js 解释器                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           src/index.ts - 程序入口                               │
│  - 导入 createCli                                              │
│  - 创建 CLI 实例                                               │
│  - 调用 cli.parse()                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            src/cli.ts - Commander.js 解析                      │
│  - 解析命令参数: projectName = 'my-app'                        │
│  - 解析选项: template = 'shy-vben-vue'                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         src/create.ts - createProject()                        │
│  - 检查参数完整性                                              │
│  - 如果缺失，启动 Inquirer 交互式询问                          │
│  - 验证模板是否存在                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    路径解析                                     │
│  targetDir    = /home/user/dev/my-app                          │
│  templateDir  = /path/to/create-z-apps/templates/shy-vben-vue │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  目录冲突检查                                   │
│  fs.pathExists(targetDir) → 如果存在则退出                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              src/utils/file.ts - 复制模板                      │
│  - copyTemplate() 递归复制                                     │
│  - updatePackageJson() 替换项目名称                            │
│  - updateReadme() 替换 README 变量                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            src/utils/logger.ts - 输出结果                       │
│  - logInfo() 创建进度                                          │
│  - logSuccess() 成功信息                                       │
│  - printNextSteps() 后续步骤提示                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 模板系统架构

### 1. 模板配置结构

```typescript
// src/types.ts
export interface Template {
  name: string        // 模板名称
  value: string       // 模板标识符
  description: string // 模板描述
  type: string        // 模板类型 (pc | mobile)
}
```

```typescript
// src/config/templates.ts
export const TEMPLATES: Template[] = [
  {
    name: 'shy-vben-vue',
    value: 'shy-vben-vue',
    description: 'PC 端项目模板 (基于 Vue 3 + Vite + TypeScript)',
    type: 'pc',
  },
  {
    name: 'shy-unibest',
    value: 'shy-unibest',
    description: '移动端项目模板 (基于 UniApp + Vue 3)',
    type: 'mobile',
  },
]
```

### 2. 模板目录结构

```
templates/
├── shy-vben-vue/              # PC 端模板
│   ├── package.json
│   ├── README.md
│   ├── src/
│   ├── public/
│   └── ...
└── shy-unibest/               # 移动端模板
    ├── package.json
    ├── README.md
    ├── src/
    ├── pages/
    └── ...
```

### 3. 模板变量替换

**package.json 变量：**

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0"
}
```

替换后：

```json
{
  "name": "my-app",
  "version": "1.0.0"
}
```

**README.md 变量：**

```markdown
# {{PROJECT_NAME}}

This project was created with {{TEMPLATE_NAME}} template.
```

替换后：

```markdown
# my-app

This project was created with shy-vben-vue template.
```

### 4. 添加新模板

```typescript
// 1. 在 templates/ 目录添加新模板
templates/my-new-template/

// 2. 在 src/config/templates.ts 注册
export const TEMPLATES: Template[] = [
  // ... 现有模板
  {
    name: 'my-new-template',
    value: 'my-new-template',
    description: '我的新模板描述',
    type: 'pc', // 或 'mobile'
  },
]
```

---

## 与主流方案对比

### npm vs pnpm vs yarn

| 特性     | npx create-vite | pnpm create vite | yarn create vite |
| -------- | --------------- | ---------------- | ---------------- |
| 底层命令 | npx             | pnpm dlx         | yarn dlx         |
| 包存储   | npm cache       | pnpm store       | yarn cache       |
| 去重能力 | ❌              | ✅ 硬链接去重    | ✅               |
| 速度     | 慢              | 最快             | 中等             |
| 内存占用 | 高              | 最低             | 中等             |

### 二进制文件位置

```bash
# npm 全局安装
npm install -g create-z-apps

# 二进制链接位置
Linux/Mac:  /usr/local/bin/create-z-apps
Windows:    C:\Users\<user>\AppData\Roaming\npm\create-z-apps.cmd

# 实际文件位置
Linux/Mac:  /usr/local/lib/node_modules/create-z-apps/dist/index.cjs
Windows:    C:\Users\<user>\AppData\Roaming\npm\node_modules\create-z-apps\dist\index.cjs

# pnpm 全局安装
pnpm add -g create-z-apps

# 二进制链接位置
Linux/Mac:  ~/.local/share/pnpm/global/.bin/create-z-apps
Windows:    C:\Users\<user>\AppData\Local\pnpm\create-z-apps.cmd

# 实际文件位置
Linux/Mac:  ~/.local/share/pnpm/global/5/node_modules/create-z-apps/dist/index.cjs
```

### Linux/Mac 软链接机制

```bash
$ ls -la /usr/local/bin/create-z-apps
lrwxr-xr-x  1 user  admin  52 Jan 15 10:00 create-z-apps -> ../lib/node_modules/create-z-apps/dist/index.cjs

$ head -1 /usr/local/lib/node_modules/create-z-apps/dist/index.cjs
#!/usr/bin/env node
```

### Windows .cmd 包装脚本

```cmd
@ECHO off
SETLOCAL
SET "_NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%_NODE_EXE%" (
  SET "_NODE_EXE=node"
)

SET "_NODE_EXE_DIR=%~dp0"
SET "_CREATE_Z_APPS_CJS=%~dp0\node_modules\create-z-apps\dist\index.cjs"

"%_NODE_EXE%" "%_CREATE_Z_APPS_CJS%" %*
```

---

## 开发调试指南

### 1. 本地开发调试

```bash
# 克隆项目
git clone <repo-url>
cd create-z-apps

# 安装依赖
pnpm install

# 方式 1: 使用 tsx 直接运行（推荐用于开发）
pnpm dev my-test-project

# 方式 2: 构建后直接运行
pnpm build
node dist/index.cjs my-test-project

# 方式 3: npm link（全局链接测试）
pnpm build
pnpm link --global
create-z-apps my-test-project
```

### 2. 构建调试

```bash
# 单次构建
pnpm build

# 监听模式构建（开发时自动重新编译）
pnpm build:watch

# 查看构建输出
ls -la dist/
# dist/
# ├── index.cjs   # 可执行文件
# └── index.d.ts  # 类型声明
```

### 3. 测试模板

```bash
# 测试指定模板
pnpm dev my-test -t shy-vben-vue
pnpm dev my-test -t shy-unibest

# 查看可用模板列表
pnpm dev list
```

### 4. 查看详细执行信息

```bash
# 使用 Node.js 调试模式
NODE_DEBUG=* pnpm dev my-test

# 使用 tsx 的调试模式
tsx --inspect src/index.ts my-test
```

### 5. 验证 package.json 配置

```bash
# 查看 bin 字段
cat package.json | grep -A 3 '"bin"'

# 查看文件列表配置
cat package.json | grep -A 5 '"files"'

# 验证 shebang
head -1 dist/index.cjs
# 应该输出: #!/usr/bin/env node
```

---

## 常见问题排查

### 问题 1: 找不到模板

```
Error: Template not found: shy-vben-vue
Template directory: /path/to/create-z-apps/templates/shy-vben-vue
```

**原因：** 模板目录不存在或路径错误

**解决方案：**

```bash
# 1. 检查模板目录是否存在
ls templates/
# 应该看到: shy-vben-vue/  shy-unibest/

# 2. 检查编译后的 dist 目录中的路径
node -e "console.log(path.join(__dirname, '../templates/shy-vben-vue'))"

# 3. 确保在发布时包含了 templates 目录
cat package.json | grep "files"
# 应该包含: "dist", "templates"
```

### 问题 2: shebang 不生效

```
bash: ./dist/index.cjs: Permission denied
```

**原因：** 文件没有执行权限

**解决方案：**

```bash
# 添加执行权限
chmod +x dist/index.cjs

# 验证 shebang
head -1 dist/index.cjs
# 应该输出: #!/usr/bin/env node

# 手动测试
./dist/index.cjs my-test
```

### 问题 3: Inquirer 兼容性问题

```
TypeError: inquirer.prompt is not a function
```

**原因：** Inquirer v9 是 ESM only，需要特殊处理

**解决方案：** 已在代码中处理

```typescript
// src/create.ts
const prompt = (inquirer as any).default?.prompt || inquirer.prompt
```

### 问题 4: 构建后无法运行

```
Error: Cannot find module './cli.js'
```

**原因：** ESM → CJS 转换问题或导入路径问题

**解决方案：**

```bash
# 1. 清理并重新构建
rm -rf dist/
pnpm build

# 2. 检查导入路径使用 .js 扩展名
# ✓ 正确: import { createCli } from './cli.js'
# ✗ 错误: import { createCli } from './cli'

# 3. 检查 tsconfig.json 的 module 配置
cat tsconfig.json | grep "module"
# 应该是: "module": "ESNext"
```

### 问题 5: 模板变量未替换

**原因：** 模板文件中没有使用占位符或替换逻辑有误

**解决方案：**

```bash
# 1. 检查模板文件
cat templates/shy-vben-vue/package.json
# 应该有: "name": "my-shy-project" 或其他默认值

cat templates/shy-vben-vue/README.md
# 可以使用: {{PROJECT_NAME}}, {{TEMPLATE_NAME}}

# 2. 检查替换逻辑
# src/utils/file.ts
export async function updatePackageJson(targetDir: string, projectName: string) {
  const packageJson = await fs.readJson(packageJsonPath)
  packageJson.name = projectName  // 确保这里正确赋值
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
}
```

### 问题 6: 目录已存在错误

```
Error: Directory my-app already exists!
```

**原因：** 目标目录已存在

**解决方案：**

```bash
# 1. 删除现有目录
rm -rf my-app

# 2. 或使用不同的项目名
create-z-apps my-new-app

# 3. 或修改代码添加覆盖选项（如需要）
```

---

## 总结

**pnpm create 核心机制：**

1. 包名自动添加 `create-` 前缀
2. 使用 `pnpm dlx` 临时下载并执行
3. 读取 `package.json` 的 `bin` 字段
4. 执行对应的编译后 JavaScript 文件

**create-z-apps 执行流程：**

1. Shebang 声明 Node.js 执行
2. TypeScript 源码通过 tsup 编译为 CommonJS
3. Commander.js 解析命令行参数
4. Inquirer 提供交互式输入
5. 模板系统支持多模板选择
6. fs-extra 复制模板文件
7. 变量替换和输出结果

**关键技术点：**

- Unix Shebang 机制
- npm bin 字段规范
- TypeScript + tsup 构建系统
- ESM 源码 → CJS 输出转换
- Commander.js 参数解析
- Inquirer v9 ESM 兼容性处理
- Chalk 终端颜色输出
- fs-extra 文件操作增强
- 模板配置与变量替换系统
