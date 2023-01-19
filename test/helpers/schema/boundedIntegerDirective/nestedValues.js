import gql from 'graphql-tag'

// Apollo type-defs SDL
const typeDefs = gql`
  # complexity directive definition used by directiveEstimator
  directive @boundedInteger(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(initial: Int! @boundedInteger(min: 5, max: 10)): Echo!
  }

  type Echo {
    value: Int!
    more(value: Int! @boundedInteger(min: 1, max: 4)): Int!
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
    more: (val, args) => val + args.value,
  },
}

export default { typeDefs, resolvers }
