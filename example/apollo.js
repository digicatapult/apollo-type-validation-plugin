const { ApolloServer, gql } = require('apollo-server-express')
const { makeExecutableSchema } = require('graphql-tools')

const {
  plugin: typeValidationPlugin,
  directives: { arrayLengthDirective },
} = require('../src')

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
  })

  return server
}

module.exports = createApolloServer
