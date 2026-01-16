# {{PROJECT_NAME}}

A mobile project created with [create-shy]({{TEMPLATE_NAME}}) template.

## Features

- UniApp + Vue 3 + TypeScript
- Support H5 and WeChat Mini Program
- Pinia State Management
- Vite Build Tool

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Development for H5
pnpm dev:h5

# Development for WeChat Mini Program
pnpm dev:mp-weixin

# Build for H5 production
pnpm build:h5

# Build for WeChat Mini Program production
pnpm build:mp-weixin
\`\`\`

## Project Structure

\`\`\`
src/
├── pages/       # Pages
│   └── index/   # Index page
├── static/      # Static assets
├── stores/      # Pinia stores
├── App.vue      # App root component
├── main.ts      # Entry point
└── pages.json   # Pages configuration
\`\`\`

## Platforms

- H5
- WeChat Mini Program (微信小程序)
- ...

## License

MIT
