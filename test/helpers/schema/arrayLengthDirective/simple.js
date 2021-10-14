const { gql } = require('apollo-server-express')

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(values: [Int!]! @maxArrayLength(length: 5)): [Int!]!
    echo_unlimited(values: [Int!]!): [Int!]!
  }
`

// Apollo resolvers
const resolvers = {
  Query: {
    echo: {
      resolve: (_, args) => {
        return args.values
      },
    },
    echo_unlimited: {
      resolve: (_, args) => {
        return args.values
      },
    },
  },
}

module.exports = { typeDefs, resolvers }
