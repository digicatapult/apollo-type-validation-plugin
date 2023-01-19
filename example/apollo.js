import { ApolloServer } from '@apollo/server'
import gql from 'graphql-tag'
import { makeExecutableSchema } from '@graphql-tools/schema'

import src from '../src/index.js'
const {
  plugin: typeValidationPlugin,
  directives: { arrayLengthDirective },
} = src

// Apollo type-defs SDL
const typeDefs = gql`
  # directive definition used by arrayLengthDirective
  directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

  type Query {
    echo(values: [Int!]! @maxArrayLength(length: 5)): [Echo!]!
  }

  type Echo {
    value: Int!
    times(number: [Int!]! @maxArrayLength(length: 2)): [Int!]!
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
  Echo: {
    value: (val) => val,
    times: (val, args) => {
      return args.number.map((arg) => arg * val)
    },
  },
}

// build the schema to pass to both apollo and
const schema = makeExecutableSchema({ typeDefs, resolvers })
function createApolloServer() {
  const server = new ApolloServer({
    schema,
    // build a plugin that performs type validation using the arrayLengthDirective
    plugins: [typeValidationPlugin({ schema, directives: [arrayLengthDirective()] })],
    allowBatchedHttpRequests: true,
  })

  return server
}

export default createApolloServer
