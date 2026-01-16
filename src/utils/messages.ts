import type { Template } from '../types.js'
import { logInfo, logSuccess, logGray, logCyan } from './logger.js'

export function printCreatingInfo(
  projectName: string,
  template: Template,
): void {
  logCyan('\n✓ Creating project:')
  logGray(`  - Name: ${projectName}`)
  logGray(`  - Template: ${template.name}`)
  logGray(`  - Type: ${template.type === 'pc' ? 'PC 端' : '移动端'}\n`)
}

export function printSuccess(): void {
  logSuccess('✓ Project created successfully!\n')
}

export function printNextSteps(
  projectName: string,
  template: string,
): void {
  logCyan('Next steps:\n')
  logGray(`  1. cd ${projectName}`)
  logGray(`  2. pnpm install`)

  if (template === 'shy-vben-vue') {
    logGray(`  3. pnpm dev\n`)
  } else if (template === 'shy-unibest') {
    logGray(`  3. pnpm dev:h5\n`)
  }

  logCyan('Happy coding! 🚀\n')
}

export function printTemplatesList(templates: Template[]): void {
  logCyan('\nAvailable templates:\n')
  templates.forEach((template) => {
    console.log(`  • ${template.name}`)
    console.log(`    ${template.description}`)
    console.log(`    Type: ${template.type === 'pc' ? 'PC 端' : '移动端'}\n`)
  })
}

function logCyan(message: string): void {
  logInfo(message)
}
