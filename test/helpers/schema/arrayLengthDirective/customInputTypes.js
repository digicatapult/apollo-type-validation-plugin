const { gql } = require('apollo-server-express')

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo_one(value: EchoInput): [Int!]
    echo(values: [EchoInput]! @maxArrayLength(length: 4)): [Int!]!
  }

  input EchoInput {
    value: Int!
    values: [Int!]! @maxArrayLength(length: 2)
  }
`

// Apollo resolvers
const resolvers = {
  Query: {
    echo: {
      resolve: (_, args) => {
        return args.values
          .filter((v) => !!v)
          .reduce((acc, { value, values }) => {
            return [...acc, value, ...values]
          }, [])
      },
    },
    echo_one: {
      resolve: (_, args) => {
        return args.value ? [args.value.value, ...args.value.values] : null
      },
    },
  },
}

module.exports = { typeDefs, resolvers }
