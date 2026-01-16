# create-z-apps

[English](./README.md) | [简体中文](./README.zh-CN.md)

> A simple CLI tool to scaffold new projects with templates.

## Features

- Interactive project creation
- Multiple template support (PC & Mobile)
- TypeScript support
- Modern tooling (Vite, Vue 3, etc.)

## Installation

```bash
# Using npm
npm install -g create-z-apps

# Using pnpm
pnpm add -g create-z-apps

# Using yarn
yarn global add create-z-apps
```

## Usage

### Interactive Mode

```bash
# Start interactive mode
create-z-apps

# Or using npx
npx create-z-apps
```

### Command Line Arguments

```bash
# Create a project with interactive template selection
create-z-apps my-project

# Create a project with specific template
create-z-apps my-project -t shy-vben-vue
create-z-apps my-project --template shy-unibest
```

### List Available Templates

```bash
create-z-apps list
```

## Available Templates

### PC Template

**shy-vben-vue** - PC project template

- Vue 3 + TypeScript + Vite
- Element Plus UI Framework
- Pinia State Management
- Vue Router
- Axios HTTP Client
- ESLint + Prettier

### Mobile Template

**shy-unibest** - Mobile project template

- UniApp + Vue 3 + TypeScript
- Support for H5 and WeChat Mini Program
- Pinia State Management
- Cross-platform support

## Examples

### Create a PC Project

```bash
create-z-apps my-pc-app -t shy-vben-vue

cd my-pc-app
pnpm install
pnpm dev
```

### Create a Mobile Project

```bash
create-z-apps my-mobile-app -t shy-unibest

cd my-mobile-app
pnpm install
pnpm dev:h5        # H5 development
pnpm dev:mp-weixin # WeChat Mini Program development
```

## Development

```bash
# Clone the repository
git clone https://github.com/zephyrljy/create-z-apps.git

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Link for local testing
npm link

# Test the CLI
create-z-apps test-project

# List templates
create-z-apps list
```

## Project Structure

```
create-z-apps/
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
│   ├── shy-vben-vue/         # PC template
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── shy-unibest/          # Mobile template
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
