import { isPlainObject } from 'lodash'
import { cascadeExec, test } from '@orioro/cascade'

/**
 * @typedef {Object} NodeResolverContext
 * @property {string} path
 * @property {NodeResolver[]} resolvers
 */
export type NodeResolverContext = {
  path?: string,
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

/**
 * `[NodeResolverCriteria, NodeResolverResolver] | [NodeResolverResolver]`
 * 
 * @typedef {[NodeResolverCriteria, NodeResolverResolver] | [NodeResolverResolver]} NodeResolver
 */
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
    } as Node])
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

const NODE_RESOLVER_CONTEXT_DEFAULTS = {
  path: ''
}

/**
 * @function treeSourceNodes
 * @param {Object | Array} tree
 * @param {NodeResolverContext} context
 * @returns {Node[]}
 */
export const treeSourceNodes = (
  value:({ [key: string]:any } | any[]),
  context:NodeResolverContext
):Node[] => {
  context = {
    ...NODE_RESOLVER_CONTEXT_DEFAULTS,
    ...context
  }

  return cascadeExec(test, context.resolvers, value, context)
}
