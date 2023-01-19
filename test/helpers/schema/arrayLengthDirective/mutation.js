import gql from 'graphql-tag'

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(values: [Int!]! @maxArrayLength(length: 5)): [Int!]!
  }

  type Mutation {
    echo(values: [Int!]! @maxArrayLength(length: 4)): [Int!]!
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
  },
  Mutation: {
    echo: {
      resolve: (_, args) => {
        return args.values
      },
    },
  },
}

export default { typeDefs, resolvers }
