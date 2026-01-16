import fs from 'fs-extra'
import path from 'node:path'
import type { Template } from '../types.js'

export async function copyTemplate(
  templateDir: string,
  targetDir: string,
): Promise<void> {
  await fs.copy(templateDir, targetDir)
}

export async function updatePackageJson(
  targetDir: string,
  projectName: string,
): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json')

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath)
    packageJson.name = projectName
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }
}

export async function updateReadme(
  targetDir: string,
  projectName: string,
  template: Template,
): Promise<void> {
  const readmePath = path.join(targetDir, 'README.md')

  if (await fs.pathExists(readmePath)) {
    let readmeContent = await fs.readFile(readmePath, 'utf-8')
    readmeContent = readmeContent.replace(/{{PROJECT_NAME}}/g, projectName)
    readmeContent = readmeContent.replace(/{{TEMPLATE_NAME}}/g, template.name)
    await fs.writeFile(readmePath, readmeContent)
  }
}

export async function directoryExists(dirPath: string): Promise<boolean> {
  return fs.pathExists(dirPath)
}
