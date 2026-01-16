import path from 'node:path'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { execSync } from 'node:child_process'
import type { Template } from './types.js'
import { getTemplate, validateTemplate } from './config/templates.js'
import { copyTemplate, updatePackageJson, updateReadme, directoryExists } from './utils/file.js'
import { logError, logInfo } from './utils/logger.js'
import { printCreatingInfo, printSuccess, printNextSteps } from './utils/messages.js'

// 获取 inquirer.prompt 的兼容性函数
const prompt = (inquirer as any).default?.prompt || inquirer.prompt

// GitLab 仓库地址
const GITLAB_REPOSITORY = 'git@43.137.12.133:cbb/framework/ruoyi-basic/shy-admin-vben.git'

// 从 GitLab 克隆模板
async function cloneFromGitLab(targetDir: string, tempDir: string): Promise<void> {
  try {
    logInfo('正在从 GitLab 拉取模板...')
    execSync(`git clone ${GITLAB_REPOSITORY} "${tempDir}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    // 删除 .git 目录
    const gitDir = path.join(tempDir, '.git')
    if (await fs.pathExists(gitDir)) {
      await fs.remove(gitDir)
    }

    // 复制到目标目录
    await fs.copy(tempDir, targetDir)

    // 清理临时目录
    await fs.remove(tempDir)
  } catch (error) {
    logError('从 GitLab 拉取模板失败')
    throw error
  }
}

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

  // 判断是否需要从 GitLab 拉取模板
  const needCloneFromGitLab = template === 'shy-vben-vue'

  // 如果不是从 GitLab 拉取，验证本地模板目录
  let templateDir = ''
  if (!needCloneFromGitLab) {
    templateDir = path.join(__dirname, '../templates', template)
    if (!(await fs.pathExists(templateDir))) {
      logError(`模板不存在：${template}`)
      logInfo(`模板目录：${templateDir}`)
      process.exit(1)
    }
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

    // 根据模板类型选择拉取方式
    if (needCloneFromGitLab) {
      // 从 GitLab 克隆模板
      const tempDir = path.join(process.cwd(), `.temp-${Date.now()}`)
      await cloneFromGitLab(targetDir, tempDir)
    } else {
      // 从本地复制模板
      await copyTemplate(templateDir, targetDir)
    }

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
