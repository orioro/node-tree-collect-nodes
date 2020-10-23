import { isPlainObject } from 'lodash'
import { cascadeExec, test } from '@orioro/cascade'

export const arrayNodeResolver = (deepFirst = false) => ([
  value => Array.isArray(value),
  (value:any[], context) => (
    value.reduce((acc, item, index) => {
      return [
        ...acc,
        ...treeSourceNodes(item, {
          ...context,
          path: `${context.path}.${index}`
        })
      ]
    }, [{
      path: context.path,
      value
    }])
  )
])

export const objectNodeResolver = (deepFirst = false) => ([
  value => isPlainObject(value),
  (value, context) => (
    Object.keys(value).reduce((acc, key) => {
      return [
        ...acc,
        ...treeSourceNodes(value[key], {
          ...context,
          path: `${context.path}.${key}`
        })
      ]
    }, [{
      path: context.path,
      value
    }])
  )
])

export const defaultNodeResolver = (
  getNodeContextData = context => ({ path: context.path })
) => ([
  (value, context) => ([{
    ...getNodeContextData(context),
    value
  }])
])

export const treeSourceNodes = (
  value,
  context
) => cascadeExec(test, context.resolvers, value, context)
