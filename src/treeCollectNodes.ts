import { isPlainObject } from 'lodash'
import { cascadeExec, test } from '@orioro/cascade'

/**
 * @typedef {Object} NodeCollectorContext
 * @property {string} path
 * @property {NodeCollector[]} resolvers
 */
export type NodeCollectorContext = {
  path?: string,
  resolvers: NodeCollector[],
  [key: string]: any
}

export type Node = {
  path: string,
  [key: string]: any
}

export type NodeCollectorCriteria = (
  value:any,
  context:NodeCollectorContext
) => boolean

export type NodeCollectorResolver = (
  value:any,
  context:NodeCollectorContext
) => Node[]

/**
 * Utility function to build dot (`.`) notation paths.
 * Specifically prevents generating paths that start with a `.`.
 * 
 * @function pathJoin
 * @param {string} [base='']
 * @param {string | number} next
 * @returns {string} path
 */
export const pathJoin = (
  base:string = '',
  next:(string | number)
) => (
  base === ''
    ? `${next}`
    : `${base}.${next}`
)

/**
 * `[NodeCollectorCriteria, NodeCollectorResolver] | [NodeCollectorResolver]`
 * 
 * @typedef {[NodeCollectorCriteria, NodeCollectorResolver] | [NodeCollectorResolver]} NodeCollector
 */
export type NodeCollector = (
  [NodeCollectorCriteria, NodeCollectorResolver] |
  [NodeCollectorResolver]
)

export const arrayNodeCollector = (
  deepFirst:boolean = false
):NodeCollector => ([
  value => Array.isArray(value),
  (value:any[], context:NodeCollectorContext):Node[] => (
    value.reduce((acc, item, index) => {
      return [
        ...acc,
        ...treeCollectNodes(item, {
          ...context,
          path: pathJoin(context.path, index)
        })
      ]
    }, [{
      path: context.path,
      value
    }])
  )
])

export const objectNodeCollector = (
  deepFirst:boolean = false
):NodeCollector => ([
  value => isPlainObject(value),
  (value:{ [key: string]: any }, context:NodeCollectorContext):Node[] => (
    Object.keys(value).reduce((acc, key) => {
      return [
        ...acc,
        ...treeCollectNodes(value[key], {
          ...context,
          path: pathJoin(context.path, key)
        })
      ]
    }, [{
      path: context.path,
      value
    } as Node])
  )
])

export const defaultNodeCollector = (
  getNodeContextData = context => ({ path: context.path })
):NodeCollector => ([
  (value:any, context:NodeCollectorContext):Node[] => ([{
    ...getNodeContextData(context),
    value
  }])
])

const NODE_RESOLVER_CONTEXT_DEFAULTS = {
  path: ''
}

/**
 * @function treeCollectNodes
 * @param {Object | Array} tree
 * @param {NodeCollectorContext} context
 * @returns {Node[]}
 */
export const treeCollectNodes = (
  value:({ [key: string]:any } | any[]),
  context:NodeCollectorContext
):Node[] => {
  context = {
    ...NODE_RESOLVER_CONTEXT_DEFAULTS,
    ...context
  }

  return cascadeExec(test, context.resolvers, value, context)
}
