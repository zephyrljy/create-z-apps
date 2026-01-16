# create-shy 技术解析文档

## 目录

1. [pnpm create 原理深度解析](#pnpm-create-原理深度解析)
2. [create-shy 二进制执行逻辑](#create-shy-二进制执行逻辑)
3. [完整执行流程图](#完整执行流程图)
4. [与主流方案对比](#与主流方案对比)

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
pnpm create shy my-project
```

### 2. pnpm create 的等价关系

`pnpm create` 实际上是 `pnpm init` 的别名，两者完全等价：

```bash
pnpm create vite     # 等价于
pnpm init vite       # 等价于
pnpm dlx create-vite # 等价于
pnpm create vite
```

### 3. 核心执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│  用户执行: pnpm create shy my-project                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 包名转换                                                │
│  "shy" → "create-shy"                                           │
│  规则: 如果包名不以 create- 开头，自动添加前缀                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 包解析与下载                                            │
│  - 从 npm registry 查询 create-shy 包                           │
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
│      "create-shy": "./bin/cli.js"                              │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 执行二进制文件                                          │
│  node ./bin/cli.js my-project                                   │
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
pnpm dlx create-shy my-project

↓ 等价于

1. 临时安装 create-shy 到全局缓存
   ~/.pnpm-store/v3/files/...

2. 执行包的 bin 命令
   node [缓存路径]/create-shy/bin/cli.js my-project

3. 执行完成后，保留缓存以便复用
```

**与 npx 的对比：**

| 特性     | pnpm dlx               | npx            |
| -------- | ---------------------- | -------------- |
| 包存储   | 使用 pnpm 内容寻址存储 | 使用 npm 缓存  |
| 速度     | 更快（去重存储）       | 相对较慢       |
| 内存占用 | 更低                   | 较高           |
| 包清理   | 手动清理               | 自动清理过期包 |

### 5. 包名命名约定

为了让你的包支持 `pnpm create`，必须遵循命名约定：

```
create-shy        → pnpm create shy ✓
create-vite       → pnpm create vite ✓
create-react-app  → pnpm create react-app ✓

shy-tool          → pnpm create shy-tool  ✗ (不会自动添加前缀)
@org/create-foo   → pnpm create @org/foo ✓
```

---

## create-shy 二进制执行逻辑

### 1. package.json bin 配置解析

```json
{
  "name": "create-shy",
  "bin": {
    "create-shy": "./bin/cli.js"
  }
}
```

**bin 字段的含义：**

- **key** (`create-shy`): 命令名称，全局安装后可以通过 `create-shy` 直接调用
- **value** (`./bin/cli.js`): 实际执行的脚本文件路径

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
$ create-shy my-project

# 系统实际执行
$ /usr/bin/env node ./bin/cli.js my-project

# npm 全局安装时会创建包装脚本 (Linux/Mac)
$ /usr/local/bin/create-shy → node /path/to/create-shy/bin/cli.js

# Windows 会创建 .cmd 批处理文件
$ create-shy.cmd → "%_node%" "%~dp0\..\create-shy\bin\cli.js" %*
```

### 3. bin/cli.js 详细执行流程

```javascript
#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// ==================== 参数解析阶段 ====================
program
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project')
  .action(async (projectName) => {
    // projectName 从命令行参数获取
    // 例如: create-shy my-app → projectName = 'my-app'
    // 例如: create-shy → projectName = undefined
```

**流程图 - 参数解析：**

```
┌─────────────────────────────────────────────────────────────┐
│  命令行输入                                                  │
├─────────────────────────────────────────────────────────────┤
│  $ create-shy my-app    → projectName = 'my-app'            │
│  $ create-shy           → projectName = undefined           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Commander.js 解析                                          │
│  - 使用 minimist 库解析参数                                 │
│  - 将参数传递给 action 回调                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  进入项目名称验证阶段                                       │
└─────────────────────────────────────────────────────────────┘
```

### 4. 交互式询问逻辑

```javascript
// ==================== 交互式询问阶段 ====================
if (!projectName) {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is your project name?",
      default: "my-shy-project",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Project name is required";
        }
        return true;
      },
    },
  ]);
  projectName = answers.projectName;
}
```

**Inquirer 工作原理：**

```
┌────────────────────────────────────────────────────────────┐
│  用户执行: create-shy (无参数)                              │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  Inquirer.prompt() 启动                                    │
│  - 捕获 stdin (标准输入)                                   │
│  - 监听用户键盘事件                                        │
│  - 提供 readline 界面                                      │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  交互界面显示                                              │
│  ? What is your project name? my-shy-project_              │
│  │                                                          │
│  │ - 支持上下箭头选择历史                                  │
│  │ - 支持 Tab 自动补全                                     │
│  │ - 支持 Enter 确认                                       │
│  │ - 支持 Ctrl+C 取消                                      │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  用户输入验证                                              │
│  validate 函数在每次输入时触发                             │
│  - 返回 true: 验证通过，继续                               │
│  - 返回 false 或字符串: 显示错误信息，阻塞输入             │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  返回答案对象                                              │
│  answers = { projectName: '用户输入的名称' }               │
└────────────────────────────────────────────────────────────┘
```

### 5. 路径解析与模板复制

```javascript
// ==================== 路径解析阶段 ====================
const targetDir = path.resolve(process.cwd(), projectName);
// process.cwd() = 当前工作目录
// 例如: /home/user/projects + my-app → /home/user/projects/my-app

const templateDir = path.join(__dirname, "../template");
// __dirname = bin/cli.js 所在目录
// 例如: /usr/local/lib/node_modules/create-shy/bin/../template
//       → /usr/local/lib/node_modules/create-shy/template
```

**路径解析示意图：**

```
当前目录: /home/user/dev/
执行命令: create-shy my-app

┌─────────────────────────────────────────────────────────────┐
│  path.resolve(process.cwd(), projectName)                   │
├─────────────────────────────────────────────────────────────┤
│  process.cwd()          → /home/user/dev                   │
│  projectName            → my-app                           │
│  path.resolve()         → /home/user/dev/my-app            │
│  (targetDir)                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  path.join(__dirname, '../template')                       │
├─────────────────────────────────────────────────────────────┤
│  __dirname              → /path/to/create-shy/bin          │
│  '../template'          → 向上一级再进入 template          │
│  path.join()           → /path/to/create-shy/template      │
│  (templateDir)                                            │
└─────────────────────────────────────────────────────────────┘
```

### 6. 目录检查与复制

```javascript
// ==================== 目录检查阶段 ====================
if (await fs.pathExists(targetDir)) {
  console.log(chalk.red(`Directory ${projectName} already exists!`));
  process.exit(1);
}
```

**fs-extra.copy() 内部实现：**

```javascript
// fs-extra 的 copy 方法简化实现
async function copy(src, dest) {
  // 1. 检查源目录是否存在
  const srcStat = await fs.stat(src);

  // 2. 递归创建目标目录
  await fs.mkdir(dest, { recursive: true });

  // 3. 读取源目录内容
  const entries = await fs.readdir(src);

  // 4. 遍历并复制每个文件/目录
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      // 递归复制子目录
      await copy(srcPath, destPath);
    } else {
      // 复制文件
      await fs.copyFile(srcPath, destPath);
    }
  }
}
```

**复制流程图：**

```
template/                my-app/
├── package.json   →     ├── package.json
├── index.js       →     ├── index.js
└── src/           →     └── src/
    └── app.js              └── app.js

┌─────────────────────────────────────────────────────────────┐
│  fs-extra.copy(templateDir, targetDir)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 读取 template/ 目录结构                            │
│  ['package.json', 'index.js', 'src/']                      │
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
│  cp template/package.json my-app/package.json              │
│  cp template/index.js my-app/index.js                      │
│  cp template/src/app.js my-app/src/app.js                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 保留文件权限和元数据                               │
│  - 读写权限                                                │
│  - 执行权限                                                │
│  - 修改时间                                                │
└─────────────────────────────────────────────────────────────┘
```

### 7. 模板变量替换

```javascript
// ==================== 变量替换阶段 ====================
const packageJsonPath = path.join(targetDir, "package.json");
if (await fs.pathExists(packageJsonPath)) {
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = projectName; // 替换项目名称
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}
```

**变量替换过程：**

```
原始 template/package.json:
{
  "name": "my-shy-project",
  "version": "1.0.0"
}

用户输入: my-awesome-app

↓ 替换后 my-app/package.json:

{
  "name": "my-awesome-app",  ← 已替换
  "version": "1.0.0"
}
```

### 8. 终端输出与颜色

```javascript
const chalk = require("chalk");

console.log(chalk.cyan(`\nCreating project ${projectName}...`));
console.log(chalk.green("\n✓ Project created successfully!\n"));
console.log(chalk.red("Error creating project:"), error);
```

**Chalk 颜色映射：**

```
chalk.cyan()   → \x1b[36m...  青色 (进度信息)
chalk.green()  → \x1b[32m...  绿色 (成功信息)
chalk.red()    → \x1b[31m...  红色 (错误信息)
chalk.yellow() → \x1b[33m...  黄色 (警告信息)
chalk.gray()   → \x1b[90m...  灰色 (次要信息)
```

**ANSI 转义码：**

```
格式: \x1b[<代码>m

\x1b[36mCreating...\x1b[0m
│      │           │
│      │           └── 重置颜色
│      └── 青色前景色
└── ESC 字符 (0x1B)
```

---

## 完整执行流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│  $ pnpm create shy my-app                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    pnpm create 阶段                             │
│  1. 包名转换: shy → create-shy                                  │
│  2. 包查找: 查询 npm registry                                   │
│  3. 包下载: pnpm dlx 临时安装                                   │
│  4. 读取 package.json bin 字段                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  系统执行二进制文件                              │
│  $ node [缓存路径]/create-shy/bin/cli.js my-app                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              bin/cli.js - Shebang 解析                          │
│  #!/usr/bin/env node → 启动 Node.js 解释器                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Commander.js - 参数解析                              │
│  argument('[project-name]') → 'my-app'                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Inquirer - 交互式询问 (可选)                       │
│  如果 projectName 为空，询问用户输入                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    路径解析                                     │
│  targetDir    = /home/user/dev/my-app                          │
│  templateDir  = /path/to/create-shy/template                   │
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
│                fs-extra.copy() 复制模板                         │
│  递归复制 template/ → targetDir/                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                变量替换 (可选)                                  │
│  替换 package.json 中的 name 字段                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chalk 输出结果                               │
│  ✓ Project created successfully!                              │
│  Next steps: cd my-app && npm install                         │
└─────────────────────────────────────────────────────────────────┘
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
npm install -g create-shy

# 二进制链接位置
Linux/Mac:  /usr/local/bin/create-shy
Windows:    C:\Users\<user>\AppData\Roaming\npm\create-shy.cmd

# 实际文件位置
Linux/Mac:  /usr/local/lib/node_modules/create-shy/bin/cli.js
Windows:    C:\Users\<user>\AppData\Roaming\npm\node_modules\create-shy\bin\cli.js

# pnpm 全局安装
pnpm add -g create-shy

# 二进制链接位置
Linux/Mac:  ~/.local/share/pnpm/global/.bin/create-shy
Windows:    C:\Users\<user>\AppData\Local\pnpm\create-shy.cmd

# 实际文件位置
Linux/Mac:  ~/.local/share/pnpm/global/5/node_modules/create-shy/bin/cli.js
```

### Linux/Mac 软链接机制

```bash
$ ls -la /usr/local/bin/create-shy
lrwxr-xr-x  1 user  admin  52 Jan 15 10:00 create-shy -> ../lib/node_modules/create-shy/bin/cli.js

$ cat /usr/local/lib/node_modules/create-shy/bin/cli.js
#!/usr/bin/env node
const { program } = require('commander');
...
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
SET "_CREATE_SHY_CLI_JS=%~dp0\node_modules\create-shy\bin\cli.js"

"%_NODE_EXE%" "%_CREATE_SHY_CLI_JS%" %*
```

---

## 调试技巧

### 1. 查看实际执行的命令

```bash
# pnpm debug 模式
pnpm create shy my-app --verbose

# 查看 dlx 临时安装位置
pnpm store path
```

### 2. 本地开发调试

```bash
# 在 create-shy 项目目录
cd create-shy

# 方式 1: npm link (推荐)
npm link
create-shy test-project

# 方式 2: 直接执行
node bin/cli.js test-project

# 方式 3: pnpm link (更接近真实场景)
pnpm link --global
create-shy test-project
```

### 3. 查看包的 bin 映射

```bash
npm view create-shy bin
# 输出:
# {
#   "create-shy": "./bin/cli.js"
# }

# 或查看 package.json
cat node_modules/create-shy/package.json | grep -A 3 '"bin"'
```

---

## 总结

**pnpm create 核心机制：**

1. 包名自动添加 `create-` 前缀
2. 使用 `pnpm dlx` 临时下载并执行
3. 读取 `package.json` 的 `bin` 字段
4. 执行对应的 JavaScript 文件

**create-shy 执行流程：**

1. Shebang 声明 Node.js 执行
2. Commander.js 解析命令行参数
3. Inquirer 提供交互式输入
4. fs-extra 复制模板文件
5. 变量替换和输出结果

**关键技术点：**

- Unix Shebang 机制
- npm bin 字段规范
- Commander.js 参数解析
- Chalk 终端颜色输出
- fs-extra 文件操作增强
