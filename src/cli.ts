import { Command } from 'commander'
import { createProject } from './create.js'
import { TEMPLATES } from './config/templates.js'
import { printTemplatesList } from './utils/messages.js'

export function createCli(): Command {
  const program = new Command()

  program
    .name('create-shy')
    .description('Create a new project with a template')
    .version('1.0.0')
    .argument('[project-name]', 'Name of the project')
    .option('-t, --template <template>', 'Template to use (shy-vben-vue | shy-unibest)')
    .action(async (projectName, options) => {
      await createProject({
        projectName,
        template: options.template,
      })
    })

  // 添加 list 命令列出所有可用模板
  program
    .command('list')
    .description('List all available templates')
    .action(() => {
      printTemplatesList(TEMPLATES)
    })

  return program
}
