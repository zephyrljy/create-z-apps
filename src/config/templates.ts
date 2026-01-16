import type { Template } from '../types.js'

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

export function getTemplate(value: string): Template | undefined {
  return TEMPLATES.find(t => t.value === value)
}

export function validateTemplate(value: string): boolean {
  return TEMPLATES.some(t => t.value === value)
}

export function getTemplateValues(): string[] {
  return TEMPLATES.map(t => t.value)
}
