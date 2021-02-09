import {
  arrayNodeResolver,
  objectNodeResolver,
  defaultNodeResolver,
  treeSourceNodes,
  pathJoin
} from './treeSourceNodes'

import { isPlainObject } from 'lodash'

describe('treeSourceNodes(value, resolvers)', () => {
	test('', () => {
    const value = {
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

    const nodes = treeSourceNodes(value, {
      resolvers: [
        arrayNodeResolver(),
        objectNodeResolver(),
        defaultNodeResolver()
      ]
    })

    expect(nodes).toEqual([
      { path: '', value: value },
      { path: 'key0', value: value.key0 },
      { path: 'key1', value: value.key1 },
      { path: 'key2', value: value.key2 },
      { path: 'key2.0', value: value.key2[0] },
      { path: 'key2.0.key20', value: value.key2[0].key20 },
      { path: 'key2.0.key21', value: value.key2[0].key21 },
      { path: 'key2.0.key22', value: value.key2[0].key22 },
      { path: 'key3', value: value.key3 },
      { path: 'key3.key30', value: value.key3.key30 },
      { path: 'key3.key30.key300', value: value.key3.key30.key300 },
      { path: 'key3.key30.key301', value: value.key3.key30.key301 },
      { path: 'key3.key30.key301.0', value: value.key3.key30.key301[0] },
      { path: 'key3.key30.key301.1', value: value.key3.key30.key301[1] },
    ])
	})

  test('custom structure', () => {
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

    const MAP_TYPE_RESOLVER = [
      (value) => (
        isPlainObject(value) &&
        value.type === 'map' &&
        isPlainObject(value.properties)
      ),
      (value, context) => {

        const schemaPath = context.schemaPath || ''

        return Object.keys(value.properties).reduce((acc, key) => ([
          ...acc,
          ...treeSourceNodes(value.properties[key], {
            ...context,
            schemaPath: pathJoin(schemaPath, `properties.${key}`),
            path: pathJoin(context.path, key)
          })
        ]), [{
          value,
          schemaPath,
          path: context.path
        }])
      }
    ]

    const schemas = treeSourceNodes(schema, {
      resolvers: [
        MAP_TYPE_RESOLVER,
        defaultNodeResolver(context => ({
          path: context.path,
          schemaPath: context.schemaPath,
        }))
      ],
      schemaPath: ''
    })

    expect(schemas).toEqual([
      {
        path: '',
        schemaPath: '',
        value: schema
      },
      {
        path: 'key0',
        schemaPath: 'properties.key0',
        value: schema.properties.key0
      },
      {
        path: 'key1',
        schemaPath: 'properties.key1',
        value: schema.properties.key1
      },
      {
        path: 'key1.key10',
        schemaPath: 'properties.key1.properties.key10',
        value: schema.properties.key1.properties.key10
      },
      {
        path: 'key1.key10.key100',
        schemaPath: 'properties.key1.properties.key10.properties.key100',
        value: schema.properties.key1.properties.key10.properties.key100
      },
      {
        path: 'key1.key10.key101',
        schemaPath: 'properties.key1.properties.key10.properties.key101',
        value: schema.properties.key1.properties.key10.properties.key101
      },
      {
        path: 'key2',
        schemaPath: 'properties.key2',
        value: schema.properties.key2
      },
    ])
  })
})
