import gql from 'graphql-tag'

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @maxArrayLen(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(value: Int! @maxArrayLen(min: 5, max: 10)): Int!
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
}

export default { typeDefs, resolvers }
