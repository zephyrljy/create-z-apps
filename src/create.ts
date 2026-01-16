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
  } else {
    // 验证指定的模板是否存在
    if (!validateTemplate(template)) {
      logError(`Invalid template: ${template}`)
      const validTemplates = ['shy-vben-vue', 'shy-unibest']
      logInfo(`Available templates: ${validTemplates.join(', ')}`)
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
    logError('Missing required parameters')
    process.exit(1)
    return
  }

  const targetDir = path.resolve(process.cwd(), projectName)
  const templateDir = path.join(__dirname, '../templates', template)

  // 验证模板目录
  if (!(await fs.pathExists(templateDir))) {
    logError(`Template not found: ${template}`)
    logInfo(`Template directory: ${templateDir}`)
    process.exit(1)
  }

  // 检查目录是否已存在
  if (await directoryExists(targetDir)) {
    logError(`Directory ${projectName} already exists!`)
    process.exit(1)
  }

  // 创建项目
  try {
    const selectedTemplate = getTemplate(template)

    if (!selectedTemplate) {
      logError(`Template configuration not found: ${template}`)
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
    logError('Error creating project:')
    console.error(error)
    process.exit(1)
  }
}
