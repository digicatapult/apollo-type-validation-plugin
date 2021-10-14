const { gql } = require('apollo-server-express')

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @boundedInteger(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(value: Int! @boundedInteger(min: 5, max: 10)): Int!
  }

  type Mutation {
    echo(value: Int! @boundedInteger(min: 1, max: 4)): Int!
  }
`

// Apollo resolvers
const resolvers = {
  Query: {
    echo: {
      resolve: (_, args) => {
        return args.value
      },
    },
  },
  Mutation: {
    echo: {
      resolve: (_, args) => {
        return args.value
      },
    },
  },
}

module.exports = { typeDefs, resolvers }
