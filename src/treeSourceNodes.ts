import { isPlainObject } from 'lodash'
import { cascadeExec, test } from '@orioro/cascade'

export type NodeResolverContext = {
  path: string,
  resolvers: NodeResolver[],
  [key: string]: any
}

export type Node = {
  path: string,
  [key: string]: any
}

export type NodeResolverCriteria = (
  value:any,
  context:NodeResolverContext
) => boolean

export type NodeResolverResolver = (
  value:any,
  context:NodeResolverContext
) => Node[]

export type NodeResolver = (
  [NodeResolverCriteria, NodeResolverResolver] |
  [NodeResolverResolver]
)

export const arrayNodeResolver = (
  deepFirst:boolean = false
):NodeResolver => ([
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

export const objectNodeResolver = (
  deepFirst:boolean = false
):NodeResolver => ([
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
):NodeResolver => ([
  (value:any, context:NodeResolverContext):Node[] => ([{
    ...getNodeContextData(context),
    value
  }])
])

export const treeSourceNodes = (
  value:({ [key: string]:any } | any[]),
  context:NodeResolverContext
):Node[] => cascadeExec(test, context.resolvers, value, context)
