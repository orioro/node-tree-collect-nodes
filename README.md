# treeCollectNodes

```
npm install @orioro/tree-collect-nodes
yarn add @orioro/tree-collect-nodes
```

Helps traversing a nested object tree and generate a flat list of nodes. Allows
for custom node traversing through conditionally applied `NodeCollectors`. 

## Purpose

This library was developed in order to allow for custom tree traversing
and node flattening requirements. The idea is to use custom node collectors
to traverse the tree and generate nodes. I think it is loosely inspired on
`glob` patterns for loading files.

One can think of it as a `gulp.src('*/**')` but made for nested object tree
structure nodes instead of files: `treeCollectNodes` generates a flat list of
`Nodes` according to a traversal algorithm defined by `NodeCollectors` so that
further processing can handle a sequential list of nodes (instead of having to
handle tree traversing)

## Flattening a tree structure:
```js
import {
  arrayNodeCollector,
  objectNodeCollector,
  defaultNodeCollector,
  treeCollectNodes
} from '@orioro/tree-collect-nodes'

const tree = {
  key0: 'value0',
  key1: 'value1',
  key2: [
    {
      key20: 'value20',
      key21: 'value21',
      key22: 'value22'
    }
  ],
  key3: {
    key30: {
      key300: 'value300',
      key301: ['value3010', 'value3011']
    }
  }
}

const nodes = treeCollectNodes(tree, {
  collectors: [
    arrayNodeCollector(),
    objectNodeCollector(),
    defaultNodeCollector()
  ],
  path: ''
})

console.log(nodes)
// [
//   { path: '', value: value },
//   { path: '.key0', value: value.key0 },
//   { path: '.key1', value: value.key1 },
//   { path: '.key2', value: value.key2 },
//   { path: '.key2.0', value: value.key2[0] },
//   { path: '.key2.0.key20', value: value.key2[0].key20 },
//   { path: '.key2.0.key21', value: value.key2[0].key21 },
//   { path: '.key2.0.key22', value: value.key2[0].key22 },
//   { path: '.key3', value: value.key3 },
//   { path: '.key3.key30', value: value.key3.key30 },
//   { path: '.key3.key30.key300', value: value.key3.key30.key300 },
//   { path: '.key3.key30.key301', value: value.key3.key30.key301 },
//   { path: '.key3.key30.key301.0', value: value.key3.key30.key301[0] },
//   { path: '.key3.key30.key301.1', value: value.key3.key30.key301[1] },
// ]

```

## Flattening custom tree structure:
```js
/**
 * This object describes the schema for a target input similar to:
 * {
 *   key0: 'Some string',
 *   key1: {
 *     key10: {
 *       key100: 'Some other string',
 *       key101: 10
 *     }
 *   },
 *   key2: 20
 * }
 *
 * For map types (JS Plain objects), the properties are defined
 * in a separate schema property named `properties` so that other
 * schema specifications may be defined at the schema top level,
 * for example `required` or whatever else
 */
const schema = {
  type: 'map',
  properties: {
    key0: {
      type: 'string'
    },
    key1: {
      type: 'map',
      properties: {
        key10: {
          type: 'map',
          properties: {
            key100: { type: 'string' },
            key101: { type: 'number' }
          }
        }
      }
    },
    key2: {
      type: 'number'
    }
  }
}

/**
 * A collector is a tuple composed of 2 items: [criteria, collector]
 * - criteria: a function that receives the `value` to be taken into account
 *   and a `context` object that contains whatever information has been
 *   passed down by previous collectors. One important information available
 *   on the context object is the `path` which informs at which path
 *   the current value is. The criteria function should return a `boolean`
 *   that indicates whether the collector should be applied to the `value`
 * - collector: a function that receives the `value` and the `context`
 *   (exactly the same as the criteria) and returns an `Array` of resolved
 *   nodes to be added to the final list of resolved nodes
 * @type {Array}
 */
const MAP_TYPE_COLLECTOR = [
  /**
   * type NodeCollectorCriteria = (
   *   value:any,
   *   context:NodeCollectorContext
   * ) => boolean
   */
  (value) => (
    isPlainObject(value) &&
    value.type === 'map' &&
    isPlainObject(value.properties)
  ),

  /**
   * type NodeCollectorResolver = (
   *   value:any,
   *   context:NodeCollectorContext
   * ) => Node[]
   */
  (value, context) => {

    const schemaPath = context.schemaPath || ''

    return Object.keys(value.properties).reduce((acc, key) => ([
      ...acc,
      ...treeCollectNodes(value.properties[key], {
        ...context,
        schemaPath: `${schemaPath}.properties.${key}`,
        path: `${context.path}.${key}`
      })
    ]), [{
      value,
      schemaPath,
      path: context.path
    }])
  }
]

/**
 * treeCollectNodes(tree, {
 *   collectors: [...collectors],
 *   path: string,
 *   // other context info
 * })
 */
const flat = treeCollectNodes(schema, {
  collectors: [
    MAP_TYPE_COLLECTOR,
    defaultNodeCollector(context => ({
      path: context.path,
      schemaPath: context.schemaPath,
    }))
  ],
  schemaPath: '',
  path: ''
})

console.log(flat)
// [
//   {
//     value: { type: 'map', properties: [Object] },
//     schemaPath: '',
//     path: ''
//   },
//   {
//     path: '.key0',
//     schemaPath: '.properties.key0',
//     value: { type: 'string' }
//   },
//   {
//     value: { type: 'map', properties: [Object] },
//     schemaPath: '.properties.key1',
//     path: '.key1'
//   },
//   {
//     value: { type: 'map', properties: [Object] },
//     schemaPath: '.properties.key1.properties.key10',
//     path: '.key1.key10'
//   },
//   {
//     path: '.key1.key10.key100',
//     schemaPath: '.properties.key1.properties.key10.properties.key100',
//     value: { type: 'string' }
//   },
//   {
//     path: '.key1.key10.key101',
//     schemaPath: '.properties.key1.properties.key10.properties.key101',
//     value: { type: 'number' }
//   },
//   {
//     path: '.key2',
//     schemaPath: '.properties.key2',
//     value: { type: 'number' }
//   }
// ]
```

# API Docs

- [`NodeCollectorContext`](#nodecollectorcontext)
- [`pathJoin(base, next)`](#pathjoinbase-next)
- [`NodeCollector`](#nodecollector)
- [`treeCollectNodes(tree, context)`](#treecollectnodestree-context)

##### `NodeCollectorContext`

- `path` {string}
- `collectors` {[NodeCollector](#nodecollector)[]}

##### `pathJoin(base, next)`

Utility function to build dot (`.`) notation paths.
Specifically prevents generating paths that start with a `.`.

- `base` {string}
- `next` {string | number}
- Returns: `path` {string} 

##### `NodeCollector`

`[NodeCollectorCriteria, NodeCollectorResolver] | [NodeCollectorResolver]`



##### `treeCollectNodes(tree, context)`

- `tree` {Object | Array}
- `context` {[[NodeCollector](#nodecollector)Context](#nodecollectorcontext)}
- Returns: {Node[]}
