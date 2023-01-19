import { ApolloServer } from '@apollo/server'
import express from 'express'
import { expressMiddleware } from '@apollo/server/express4'
import request from 'supertest'
import cors from 'cors'

import { makeExecutableSchema } from '@graphql-tools/schema'

import src from '../../src/index.js'

const { plugin: typeValidationPlugin } = src

// build the schema to pass to both apollo and
async function createApolloServer({ typeDefs, resolvers, directives }) {
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const server = new ApolloServer({
    schema,
    // build a plugin to get the complexity of a query before running the resolvers
    // allows us to set a max complexity per query, or meter rate-limiting by complexity
    plugins: [typeValidationPlugin({ schema, directives })],
    allowBatchedHttpRequests: true,
  })

  const app = express()
  await server.start()
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  )
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

export default createApolloServer
