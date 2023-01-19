// boilerplate apollo-graphql-express

import express from 'express'
import createApolloServer from './apollo.js'
import { expressMiddleware } from '@apollo/server/express4'
import cors from 'cors'

const port = 3000

async function startServer() {
  const server = createApolloServer()
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

  app.listen({ port }, (err) => {
    if (err) {
      console.error('Error starting app:', err)
      throw err
    } else {
      console.log(`🚀 Server ready at http://localhost:${port}/graphql`)
    }
  })
}

startServer()
