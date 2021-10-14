const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const request = require('supertest')

const { makeExecutableSchema } = require('graphql-tools')

const { plugin: typeValidationPlugin } = require('../../src')

// build the schema to pass to both apollo and
function createApolloServer({ typeDefs, resolvers, directives }) {
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const server = new ApolloServer({
    schema,
    // build a plugin to get the complexity of a query before running the resolvers
    // allows us to set a max complexity per query, or meter rate-limiting by complexity
    plugins: [typeValidationPlugin({ schema, directives })],
  })

  const app = express()
  server.applyMiddleware({ app })
  const api = request(app)

  const query = async ({ query, variables }) => {
    let req = api.post('/graphql')
    req = req.set('Content-Type', 'application/json').send({ query, variables })
    const res = await req

    if (res.body.errors) {
      throw res.body.errors
    }

    return res.body.data
  }

  return { api, query }
}

module.exports = createApolloServer
