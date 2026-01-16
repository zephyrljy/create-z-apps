import chalk from 'chalk'

export function logInfo(message: string): void {
  console.log(chalk.cyan(message))
}

export function logSuccess(message: string): void {
  console.log(chalk.green(message))
}

export function logError(message: string): void {
  console.error(chalk.red(message))
}

export function logGray(message: string): void {
  console.log(chalk.gray(message))
}

export function logYellow(message: string): void {
  console.log(chalk.yellow(message))
}

export function logBold(message: string): void {
  console.log(chalk.bold(message))
}
