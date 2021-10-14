const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { arrayLengthDirective } = require('../src/directives')

const {
  simple,
  renamedDirective,
  nestedValues,
  customInputTypes,
  mutation,
} = require('./helpers/schema/arrayLengthDirective')
const createApolloServer = require('./helpers/apollo')

const mkTest = ({ schema, directiveOpts }) => ({ description, query, variables = {}, result, error }) => {
  describe(description, function () {
    let context = {}
    before(async function () {
      const api = createApolloServer({
        ...schema,
        directives: [arrayLengthDirective(directiveOpts)],
      })

      try {
        context.result =
          (await api.query({
            query,
            variables,
          })) || true
      } catch (err) {
        context.error = err || true
      }
    })

    if (result) {
      it('should succeed', function () {
        expect(context.result).to.deep.equal(result)
        expect(context.error).to.equal(undefined)
      })
    } else {
      it('should fail', function () {
        expect(context.result).to.equal(undefined)
        expect(context.error).to.deep.equal(error)
      })
    }
  })
}

const mkSimpleTest = mkTest({ schema: simple })
const mkRenamedDirectiveTest = mkTest({ schema: renamedDirective, directiveOpts: { name: 'maxArrayLen' } })
const mkNestedTest = mkTest({ schema: nestedValues })
const mkCustomInputTest = mkTest({ schema: customInputTypes })
const mkMutationTest = mkTest({ schema: mutation })

describe('arrayLengthDirectiveTest', function () {
  mkSimpleTest({
    description: 'scalar inline arguments no limit',
    query: `
      query {
        echo_unlimited(values: [1,2,3,4,5,6,7,8,9,10])
      }
    `,
    result: {
      echo_unlimited: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  })

  mkSimpleTest({
    description: 'scalar inline arguments ok',
    query: `
      query {
        echo(values: [1,2,3,4,5])
      }
    `,
    result: {
      echo: [1, 2, 3, 4, 5],
    },
  })

  mkSimpleTest({
    description: 'scalar inline arguments too many',
    query: `
      query {
        echo(values: [1,2,3,4,5,6])
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 6 items, maximum allowed is 5',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkSimpleTest({
    description: 'scalar variable arguments ok',
    query: `
      query($values: [Int!]!) {
        echo(values: $values)
      }
    `,
    variables: {
      values: [1, 2, 3, 4, 5],
    },
    result: {
      echo: [1, 2, 3, 4, 5],
    },
  })

  mkSimpleTest({
    description: 'scalar variable arguments too many',
    query: `
      query($values: [Int!]!) {
        echo(values: $values)
      }
    `,
    variables: {
      values: [1, 2, 3, 4, 5, 6],
    },
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 6 items, maximum allowed is 5',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkRenamedDirectiveTest({
    description: 'scalar inline arguments ok',
    query: `
      query {
        echo(values: [1,2,3,4,5])
      }
    `,
    result: {
      echo: [1, 2, 3, 4, 5],
    },
  })

  mkRenamedDirectiveTest({
    description: 'scalar inline arguments too many',
    query: `
      query {
        echo(values: [1,2,3,4,5,6])
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 6 items, maximum allowed is 5',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar inline arguments ok',
    query: `
      query {
        echo(initial: [1,2]) {
          value
          more(values: [5,6])
        }
      }
    `,
    result: {
      echo: [
        {
          value: 1,
          more: [1, 5, 6],
        },
        {
          value: 2,
          more: [2, 5, 6],
        },
      ],
    },
  })

  mkNestedTest({
    description: 'nested scalar inline arguments too many',
    query: `
      query {
        echo(initial: [1,2,3,4,5]) {
          value
          more(values: [6,7,8])
        }
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument initial. Supplied 5 items, maximum allowed is 4',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar inline arguments with fragment ok',
    query: `
      query {
        echo(initial: [1,2]) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(values: [5,6])
      }
    `,
    result: {
      echo: [
        {
          value: 1,
          more: [1, 5, 6],
        },
        {
          value: 2,
          more: [2, 5, 6],
        },
      ],
    },
  })

  mkNestedTest({
    description: 'nested scalar inline arguments with fragment too many',
    query: `
      query {
        echo(initial: [1,2]) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(values: [5,6,7])
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 3 items, maximum allowed is 2',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar variable arguments with fragment ok',
    query: `
      query($values: [Int!]!) {
        echo(initial: [1,2]) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(values: $values)
      }
    `,
    variables: {
      values: [5, 6],
    },
    result: {
      echo: [
        {
          value: 1,
          more: [1, 5, 6],
        },
        {
          value: 2,
          more: [2, 5, 6],
        },
      ],
    },
  })

  mkCustomInputTest({
    description: 'custom input inline argument ok',
    query: `
      query {
        echo_one(value: {
          value: 1,
          values: [2,3]
        })
      }
    `,
    result: {
      echo_one: [1, 2, 3],
    },
  })

  mkCustomInputTest({
    description: 'custom input inline arguments list ok',
    query: `
      query {
        echo(values: [{
          value: 1,
          values: [2,3]
        }, {
          value: 4,
          values: [5,6]
        }])
      }
    `,
    result: {
      echo: [1, 2, 3, 4, 5, 6],
    },
  })

  // TODO: fixme
  mkCustomInputTest({
    description: 'custom input multiple inline arguments ok',
    query: `
      query {
        echo_one(value: {
          value: 1,
          values: [2,3]
        })
        echo(values: [{
          value: 1,
          values: [2,3]
        }, {
          value: 4,
          values: [5,6]
        }])
      }
    `,
    result: {
      echo: [1, 2, 3, 4, 5, 6],
      echo_one: [1, 2, 3],
    },
  })

  mkCustomInputTest({
    description: 'custom input inline arguments list too many',
    query: `
      query {
        echo(values: [{
          value: 1,
          values: [2,3]
        }, {
          value: 4,
          values: [5,6,7]
        }])
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 3 items, maximum allowed is 2',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkCustomInputTest({
    description: 'custom input inline arguments list with nulls',
    query: `
      query {
        echo(values: [{
          value: 1,
          values: [2,3]
        }, null, {
          value: 4,
          values: [5,6]
        }])
      }
    `,
    result: {
      echo: [1, 2, 3, 4, 5, 6],
    },
  })

  mkCustomInputTest({
    description: 'custom input inline arguments null custom input field',
    query: `
      query {
        echo_one(value: null)
      }
    `,
    result: {
      echo_one: null,
    },
  })

  mkMutationTest({
    description: 'scalar inline arguments to mutation ok',
    query: `
      mutation {
        echo(values: [1,2,3,4])
      }
    `,
    result: {
      echo: [1, 2, 3, 4],
    },
  })

  mkMutationTest({
    description: 'scalar inline arguments to mutation too many',
    query: `
      mutation {
        echo(values: [1,2,3,4,5])
      }
    `,
    error: [
      {
        message: 'Invalid array length for argument values. Supplied 5 items, maximum allowed is 4',
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  // TODO: subscriptions

  describe('multiple operations', function () {
    let context = {}
    before(async function () {
      const server = createApolloServer({
        ...customInputTypes,
        directives: [arrayLengthDirective()],
      })

      let req = server.api.post('/graphql')
      req = req.set('Content-Type', 'application/json').send([
        {
          operationName: 'query1',
          query: `
              query query1 {
                echo(values: [{
                  value: 1,
                  values: [2,3]
                }, {
                  value: 4,
                  values: [5,6]
                }])
              }
            `,
          variables: {},
        },
        {
          operationName: 'query2',
          query: `
              query query2 {
                echo(values: [{
                  value: 7,
                  values: [8,9]
                }, {
                  value: 10,
                  values: [11,12]
                }])
              }
            `,
          variables: {},
        },
      ])
      const res = await req

      context.result = res.body || 0
    })

    it('should succeed', function () {
      expect(context.result.length).to.equal(2)
      const result1 = context.result[0]
      const result2 = context.result[1]
      expect(result1.data).to.deep.equal({
        echo: [1, 2, 3, 4, 5, 6],
      })
      expect(result2.data).to.deep.equal({
        echo: [7, 8, 9, 10, 11, 12],
      })

      expect(result1.errors).to.equal(undefined)
      expect(result2.errors).to.equal(undefined)
    })
  })

  describe('multiple operations single error', function () {
    let context = {}
    before(async function () {
      const server = createApolloServer({
        ...customInputTypes,
        directives: [arrayLengthDirective()],
      })

      let req = server.api.post('/graphql')
      req = req.set('Content-Type', 'application/json').send([
        {
          operationName: 'query1',
          query: `
              query query1 {
                echo(values: [{
                  value: 1,
                  values: [2,3]
                }, {
                  value: 4,
                  values: [5,6]
                }])
              }
            `,
          variables: {},
        },
        {
          operationName: 'query2',
          query: `
            query query2 {
              echo(values: [{
                value: 1,
                values: [2,3]
              }, {
                value: 4,
                values: [5,6,7]
              }])
            }
          `,
          variables: {},
        },
      ])
      const res = await req

      context.result = res.body || 0
    })

    it('should succeed', function () {
      expect(context.result.length).to.equal(2)
      const result1 = context.result[0]
      const result2 = context.result[1]
      expect(result1.data).to.deep.equal({
        echo: [1, 2, 3, 4, 5, 6],
      })
      expect(result2.data).to.equal(undefined)

      expect(result1.errors).to.equal(undefined)
      expect(result2.errors).to.deep.equal([
        {
          message: 'Invalid array length for argument values. Supplied 3 items, maximum allowed is 2',
          extensions: { code: 'BAD_USER_INPUT' },
        },
      ])
    })
  })

  mkSimpleTest({
    description: 'Introspection query test',
    query: `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
          }
        }
      }
    `,
    result: {
      __schema: {
        queryType: {
          name: 'Query',
        },
      },
    },
  })
})
