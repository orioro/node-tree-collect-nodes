import { isPlainObject } from 'lodash'
import { cascadeExec, test } from '@orioro/cascade'

export type NodeResolverContext = {
  path: string,
  [key: string]: any
}

export type Node = {
  path: string,
  [key: string]: any
}

export const arrayNodeResolver = (deepFirst = false) => ([
  value => Array.isArray(value),
  (value:any[], context:NodeResolverContext):Node[] => (
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
  (value:{ [key: string]: any }, context:NodeResolverContext):Node[] => (
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
  (value:any, context:NodeResolverContext):Node[] => ([{
    ...getNodeContextData(context),
    value
  }])
])

export const treeSourceNodes = (
  value,
  context
):Node[] => cascadeExec(test, context.resolvers, value, context)
