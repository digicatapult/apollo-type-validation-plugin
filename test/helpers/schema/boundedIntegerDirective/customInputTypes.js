const { gql } = require('apollo-server-express')

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @boundedInteger(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(input: EchoInput): Int!
  }

  input EchoInput {
    value: Int! @boundedInteger(min: 5, max: 10)
  }
`

// Apollo resolvers
const resolvers = {
  Query: {
    echo: {
      resolve: (_, args) => {
        return args.input.value
      },
    },
  },
}

module.exports = { typeDefs, resolvers }
