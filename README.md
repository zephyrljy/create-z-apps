# create-shy

A simple CLI tool to scaffold new projects with templates.

## Features

- Interactive project creation
- Multiple template support (PC & Mobile)
- TypeScript support
- Modern tooling (Vite, Vue 3, etc.)

## Installation

```bash
# Using npm
npm install -g create-shy

# Using pnpm
pnpm add -g create-shy

# Using yarn
yarn global add create-shy
```

## Usage

### Interactive Mode

```bash
# Start interactive mode
create-shy

# Or using pnpm
pnpm create shy

# Using npx
npx create-shy
```

### Command Line Arguments

```bash
# Create a project with interactive template selection
create-shy my-project

# Create a project with specific template
create-shy my-project -t shy-vben-vue
create-shy my-project --template shy-unibest
```

### List Available Templates

```bash
create-shy list
```

## Available Templates

### PC 端模板

**shy-vben-vue** - PC 端项目模板

- Vue 3 + TypeScript + Vite
- Element Plus UI Framework
- Pinia State Management
- Vue Router
- Axios HTTP Client
- ESLint + Prettier

### 移动端模板

**shy-unibest** - 移动端项目模板

- UniApp + Vue 3 + TypeScript
- 支持 H5 和微信小程序
- Pinia State Management
- 跨平台支持

## Examples

### Create a PC Project

```bash
create-shy my-pc-app -t shy-vben-vue

cd my-pc-app
pnpm install
pnpm dev
```

### Create a Mobile Project

```bash
create-shy my-mobile-app -t shy-unibest

cd my-mobile-app
pnpm install
pnpm dev:h5        # H5 development
pnpm dev:mp-weixin # WeChat Mini Program development
```

## Development

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Link for local testing
npm link

# Test the CLI
create-shy test-project

# List templates
create-shy list
```

## Project Structure

```
create-shy/
├── src/
│   ├── config/
│   │   └── templates.ts      # Template configurations
│   ├── utils/
│   │   ├── file.ts           # File operations
│   │   ├── logger.ts         # Logging utilities
│   │   └── messages.ts       # User messages
│   ├── cli.ts                # CLI command setup
│   ├── create.ts             # Project creation logic
│   ├── index.ts              # Entry point
│   └── types.ts              # TypeScript types
├── templates/
│   ├── shy-vben-vue/         # PC 端模板
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── shy-unibest/          # 移动端模板
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── dist/                     # Build output
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── TECHNICAL_ANALYSIS.md     # Technical documentation
```

## Technical Details

See [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md) for:

- How `pnpm create` works
- Binary execution logic
- Shebang mechanism
- Template processing
- Complete flow diagrams

## Publishing

```bash
# Build (if needed)
pnpm build

# Publish to npm
npm publish

# Or using pnpm
pnpm publish
```

## License

MIT
