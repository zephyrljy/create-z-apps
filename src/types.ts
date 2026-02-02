export interface Template {
  name: string
  value: string
  description: string
  type: 'pc' | 'mobile'
  repository?: string
}

export interface CreateOptions {
  projectName: string
  template: string
}

export interface PromptAnswers {
  projectName: string
  template: string
}
