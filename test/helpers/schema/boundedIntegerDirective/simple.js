import gql from 'graphql-tag'

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @boundedInteger(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(value: Int! @boundedInteger(min: 5, max: 10)): Int!
    echo_unlimited(value: Int!): Int!
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
    echo_unlimited: {
      resolve: (_, args) => {
        return args.value
      },
    },
  },
}

export default { typeDefs, resolvers }
