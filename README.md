# Apollo type validation plugin

A library for performing directive based validations against input values passed in a GraphQL query.

## Usage

The library can be used to instantiate an Apollo server plugin which can be configured to perform the required validation checks. For example:

```js
const { ApolloServer } = require('apollo-server')
const {
  plugin: typeValidationPlugin,
  directives: { arrayLengthDirective },
} = require('@digicatapult/apollo-type-validation-plugin')

const typeDefs = ...
const resolvers = ...

const server = new ApolloServer({
    schema,
    // build a plugin to get the complexity of a query before running the resolvers
    // allows us to set a max complexity per query, or meter rate-limiting by complexity
    plugins: [typeValidationPlugin({ schema, directives: [arrayLengthDirective()] })],
})
```

A worked example using the `arrayLengthDirective` can be found [here](./example).

## Supported Directives

The following directives are currently supported:

### `maxArrayLength`

A directive used to limit the maximum size of an input array that can be passed as part of an argument. For example:

```graphql
# directive definition used by arrayLengthDirective
directive @maxArrayLength(length: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

type Query {
  echo(values: [Int!]! @maxArrayLength(length: 5)): [Echo!]!
}

type Echo {
  value: Int!
  times(number: [Int!]! @maxArrayLength(length: 2)): [Int!]!
}
```

In this schema the maximum number of elements that can be validly passed as `values` to the field `echo` is 5 whilst the maximum number that can be passed to `number` on the field `times` is 2.

### `boundedInteger`

A directive used to bound the value of an integer that can be passed as an argument. For example:

```graphql
# directive definition used by boundedIntegerDirective
directive @boundedInteger(min: Int!, max: Int!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

type Query {
  echo(input: Int! @boundedInteger(min: 5, max: 10)): Echo!
}

type Echo {
  value: Int!
}
```

In this schema the value that can be validly passed as `input` to the field `echo` must be greater than or equal to 5 and less than or equal to 10.
