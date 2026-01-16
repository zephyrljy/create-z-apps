import path from 'node:path'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import type { Template } from './types.js'
import { getTemplate, validateTemplate } from './config/templates.js'
import { copyTemplate, updatePackageJson, updateReadme, directoryExists } from './utils/file.js'
import { logError, logInfo } from './utils/logger.js'
import { printCreatingInfo, printSuccess, printNextSteps } from './utils/messages.js'

// 获取 inquirer.prompt 的兼容性函数
const prompt = (inquirer as any).default?.prompt || inquirer.prompt

export interface CreateOptions {
  projectName?: string
  template?: string
}

export async function createProject(options: CreateOptions = {}): Promise<void> {
  let { projectName, template } = options
  const questions: inquirer.QuestionCollection[] = []

  // 如果没有提供项目名称，询问项目名称
  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: '请输入项目名称：',
      default: 'my-app',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return '项目名称不能为空'
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
      message: '请选择模板：',
      choices: [
        { name: 'shy-vben-vue - PC 端项目模板 (基于 Vue 3 + Vite + TypeScript)', value: 'shy-vben-vue' },
        { name: 'shy-unibest - 移动端项目模板 (基于 UniApp + Vue 3)', value: 'shy-unibest' },
      ],
    })
  } else {
    // 验证指定的模板是否存在
    if (!validateTemplate(template)) {
      logError(`无效的模板：${template}`)
      const validTemplates = ['shy-vben-vue', 'shy-unibest']
      logInfo(`可用模板：${validTemplates.join(', ')}`)
      process.exit(1)
    }
  }

  // 如果有需要询问的问题，执行询问
  if (questions.length > 0) {
    const answers = await prompt(questions)
    if (!projectName) projectName = answers.projectName
    if (!template) template = answers.template
  }

  // 确保 projectName 和 template 已定义
  if (!projectName || !template) {
    logError('缺少必要参数')
    process.exit(1)
    return
  }

  const targetDir = path.resolve(process.cwd(), projectName)
  const templateDir = path.join(__dirname, '../templates', template)

  // 验证模板目录
  if (!(await fs.pathExists(templateDir))) {
    logError(`模板不存在：${template}`)
    logInfo(`模板目录：${templateDir}`)
    process.exit(1)
  }

  // 检查目录是否已存在
  if (await directoryExists(targetDir)) {
    logError(`目录 ${projectName} 已存在！`)
    process.exit(1)
  }

  // 创建项目
  try {
    const selectedTemplate = getTemplate(template)

    if (!selectedTemplate) {
      logError(`未找到模板配置：${template}`)
      process.exit(1)
    }

    printCreatingInfo(projectName, selectedTemplate)

    // 复制模板文件到目标目录
    await copyTemplate(templateDir, targetDir)

    // 替换 package.json 中的项目名称
    await updatePackageJson(targetDir, projectName)

    // 替换 README.md 中的项目名称（如果存在）
    await updateReadme(targetDir, projectName, selectedTemplate)

    printSuccess()
    printNextSteps(projectName, template)
  } catch (error) {
    logError('创建项目时出错：')
    console.error(error)
    process.exit(1)
  }
}
