import { safeParse } from '@/lib/utils'

import { WorkflowItem } from './type'

export function taskToApiFormatter(task: WorkflowItem) {
  const { key, type, subType } = task
  const chain = safeParse(task.formValueStr, {})
  if (chain.data) {
    chain.datasets = chain.data.datasets || []
    delete chain.data
  }
  return {
    key: `${type}-${key}`,
    chain_type: subType,
    ...chain,
  }
}
