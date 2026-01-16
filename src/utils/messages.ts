import type { Template } from '../types.js'
import { logInfo, logSuccess, logGray, logCyan } from './logger.js'

export function printCreatingInfo(
  projectName: string,
  template: Template,
): void {
  logCyan('\n✓ 正在创建项目：')
  logGray(`  - 名称：${projectName}`)
  logGray(`  - 模板：${template.name}`)
  logGray(`  - 类型：${template.type === 'pc' ? 'PC 端' : '移动端'}\n`)
}

export function printSuccess(): void {
  logSuccess('✓ 项目创建成功！\n')
}

export function printNextSteps(
  projectName: string,
  template: string,
): void {
  logCyan('后续步骤：\n')
  logGray(`  1. cd ${projectName}`)
  logGray(`  2. pnpm install`)

  if (template === 'shy-vben-vue') {
    logGray(`  3. pnpm dev\n`)
  } else if (template === 'shy-unibest') {
    logGray(`  3. pnpm dev:h5\n`)
  }

  logCyan('开始编码吧！🚀\n')
}

export function printTemplatesList(templates: Template[]): void {
  logCyan('\n可用模板：\n')
  templates.forEach((template) => {
    console.log(`  • ${template.name}`)
    console.log(`    ${template.description}`)
    console.log(`    类型：${template.type === 'pc' ? 'PC 端' : '移动端'}\n`)
  })
}

function logCyan(message: string): void {
  logInfo(message)
}
