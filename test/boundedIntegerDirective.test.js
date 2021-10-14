const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { boundedIntegerDirective } = require('../src/directives')

const {
  simple,
  renamedDirective,
  nestedValues,
  customInputTypes,
  mutation,
} = require('./helpers/schema/boundedIntegerDirective')
const createApolloServer = require('./helpers/apollo')

const mkTest = ({ schema, directiveOpts }) => ({ description, query, variables = {}, result, error }) => {
  describe(description, function () {
    let context = {}
    before(async function () {
      const api = createApolloServer({
        ...schema,
        directives: [boundedIntegerDirective(directiveOpts)],
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
        expect(context.error).to.equal(undefined)
        expect(context.result).to.deep.equal(result)
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

describe('boundedIntegerDirective', function () {
  mkSimpleTest({
    description: 'scalar inline argument no limits',
    query: `
      query {
        echo_unlimited(value: 100)
      }
    `,
    result: {
      echo_unlimited: 100,
    },
  })

  mkSimpleTest({
    description: 'scalar inline argument ok (min value)',
    query: `
      query {
        echo(value: 5)
      }
    `,
    result: {
      echo: 5,
    },
  })

  mkSimpleTest({
    description: 'scalar inline argument ok (max value)',
    query: `
      query {
        echo(value: 10)
      }
    `,
    result: {
      echo: 10,
    },
  })

  mkSimpleTest({
    description: 'scalar inline argument ok (intermediate value)',
    query: `
      query {
        echo(value: 6)
      }
    `,
    result: {
      echo: 6,
    },
  })

  mkSimpleTest({
    description: 'scalar inline arguments too high',
    query: `
      query {
        echo(value: 11)
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 11 is greater than 10`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkSimpleTest({
    description: 'scalar inline arguments too low',
    query: `
      query {
        echo(value: 4)
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 4 is less than 5`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkSimpleTest({
    description: 'scalar variable arguments ok',
    query: `
      query($value: Int!) {
        echo(value: $value)
      }
    `,
    variables: {
      value: 6,
    },
    result: {
      echo: 6,
    },
  })

  mkSimpleTest({
    description: 'scalar variable arguments too high',
    query: `
      query($value: Int!) {
        echo(value: $value)
      }
    `,
    variables: {
      value: 11,
    },
    error: [
      {
        message: `Invalid value for argument value. 11 is greater than 10`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkRenamedDirectiveTest({
    description: 'renamed directive scalar inline arguments ok',
    query: `
      query {
        echo(value: 6)
      }
    `,
    result: {
      echo: 6,
    },
  })

  mkRenamedDirectiveTest({
    description: 'renamed directive scalar inline arguments too high',
    query: `
      query {
        echo(value: 11)
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 11 is greater than 10`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar inline arguments ok',
    query: `
      query {
        echo(initial: 6) {
          value
          more(value: 3)
        }
      }
    `,
    result: {
      echo: {
        value: 6,
        more: 9,
      },
    },
  })

  mkNestedTest({
    description: 'nested scalar inline arguments too high',
    query: `
      query {
        echo(initial: 6) {
          value
          more(value: 5)
        }
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 5 is greater than 4`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar inline arguments with fragment ok',
    query: `
      query {
        echo(initial: 6) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(value: 3)
      }
    `,
    result: {
      echo: {
        value: 6,
        more: 9,
      },
    },
  })

  mkNestedTest({
    description: 'nested scalar inline arguments with fragment too low',
    query: `
      query {
        echo(initial: 6) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(value: 0)
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 0 is less than 1`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkNestedTest({
    description: 'nested scalar variable arguments with fragment ok',
    query: `
      query($value: Int!) {
        echo(initial: 6) {
          value
          ...echoFields
        }
      }

      fragment echoFields on Echo {
        more(value: $value)
      }
    `,
    variables: {
      value: 3,
    },
    result: {
      echo: {
        value: 6,
        more: 9,
      },
    },
  })

  mkCustomInputTest({
    description: 'custom input inline arguments ok',
    query: `
      query {
        echo(input: {
          value: 6
        })
      }
    `,
    result: {
      echo: 6,
    },
  })

  mkCustomInputTest({
    description: 'custom input inline arguments too low',
    query: `
      query {
        echo(input: {
          value: 4
        })
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 4 is less than 5`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })

  mkMutationTest({
    description: 'scalar inline arguments to mutation ok',
    query: `
      mutation {
        echo(value: 3)
      }
    `,
    result: {
      echo: 3,
    },
  })

  mkMutationTest({
    description: 'scalar inline arguments to mutation too high',
    query: `
      mutation {
        echo(value: 5)
      }
    `,
    error: [
      {
        message: `Invalid value for argument value. 5 is greater than 4`,
        extensions: { code: 'BAD_USER_INPUT' },
      },
    ],
  })
})
