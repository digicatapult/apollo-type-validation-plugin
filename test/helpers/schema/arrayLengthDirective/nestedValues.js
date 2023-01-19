import gql from 'graphql-tag'

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(initial: [Int!]! @maxArrayLength(length: 4)): [Echo!]!
  }

  type Echo {
    value: Int!
    more(values: [Int!]! @maxArrayLength(length: 2)): [Int!]!
  }
`

// Apollo resolvers
const resolvers = {
  Query: {
    echo: {
      resolve: (_, args) => {
        return args.initial
      },
    },
  },
  Echo: {
    value: (val) => val,
    more: (val, args) => [val, ...args.values],
  },
}

export default { typeDefs, resolvers }
