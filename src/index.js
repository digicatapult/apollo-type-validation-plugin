const directives = require('./directives')
const { separateOperations, isListType, isNonNullType, isInputObjectType } = require('graphql')

const { getArgumentValues } = require('graphql/execution/values')

const { TypeInfo, visit, visitWithTypeInfo } = require('graphql')

const plugin = ({ schema, directives }) => {
  const unwrapArray = ({ type, values }) => {
    // type: [[Int!]]! values: [[1,2], null, [3,4,5]] => type: Int values: [1,2,3,4,5]

    values = [values] // nest values one more so it matches the desired degree of nesting
    while (isListType(type) || isNonNullType(type)) {
      // if we have a list of values and an array input we need to reduce the list down
      if (isListType(type)) {
        values = values.reduce((acc, vals) => [...acc, ...vals], [])
      }
      // then update with the new base type
      type = type.ofType
    }

    // filter undefined/null values. Other checks will ensure nullables match up
    values = values.filter((v) => (v !== undefined) & (v !== null))

    return { type, values }
  }

  // traverses the fields of an input argument or field
  const traverseField = ({ field, value }) => {
    // evaluate each directive
    directives.forEach((directive) => directive(field, value))

    if (value === null || value === undefined) {
      return
    } else {
      const argumentType = isNonNullType(field.type) ? field.type.ofType : field.type

      // if the argument type after removing nullable is an input object we need to traverse the fields
      // of that object
      if (isInputObjectType(argumentType)) {
        const fields = Object.values(argumentType.getFields())
        fields.forEach((field) => {
          const fieldValue = value[field.name]
          traverseField({ field, value: fieldValue })
        })
        // if the argument type is a list we need to deal with that as well by mapping over the possible values
      } else if (isListType(argumentType) && Array.isArray(value)) {
        // array types can be nested in a field so we need to peel the onion of list and nullable types back
        const { type: baseType, values } = unwrapArray({ type: argumentType, values: value })

        // now we have the base type of the (potentially nested) array if is an object
        // loop over the fields and then apply a traversal for each value
        if (isInputObjectType(baseType)) {
          const fields = Object.values(baseType.getFields())
          values.forEach((value) => {
            fields.forEach((field) => {
              const fieldValue = value[field.name]
              traverseField({ field, value: fieldValue })
            })
          })
        }
      }
    }
  }

  // traverses the arguments of a query
  const traverseArguments = ({ schema, variables, query }) => {
    const typeInfo = new TypeInfo(schema)

    const argumentsStack = []
    const visitor = {
      Field: {
        enter: (node) => {
          const parent = typeInfo.getParentType()
          const fields = parent.getFields()
          const field = fields[node.name.value]

          if (field) {
            const args = getArgumentValues(field, node, variables)
            argumentsStack.push(args)
          }
        },
        leave: (node) => {
          const parent = typeInfo.getParentType()
          const fields = parent.getFields()
          const field = fields[node.name.value]

          if (field) {
            argumentsStack.pop()
          }
        },
      },
      Argument: () => {
        const argument = typeInfo.getArgument()
        const allValues = argumentsStack[argumentsStack.length - 1]
        const value = allValues[argument.name]

        traverseField({
          field: argument,
          value,
        })
      },
    }

    visit(query, visitWithTypeInfo(typeInfo, visitor))
  }

  return {
    requestDidStart: () => ({
      didResolveOperation({ request, document }) {
        traverseArguments({
          schema,
          query: request.operationName ? separateOperations(document)[request.operationName] : document,
          variables: request.variables,
        })
      },
    }),
  }
}

module.exports = {
  directives,
  plugin,
}
