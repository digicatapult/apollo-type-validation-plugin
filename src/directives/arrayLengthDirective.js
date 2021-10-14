const { getDirectiveValues, GraphQLInt, GraphQLNonNull } = require('graphql')
const { GraphQLDirective } = require('graphql/type/directives')
const { DirectiveLocation } = require('graphql/language/directiveLocation')

const { UserInputError } = require('apollo-server-core')

module.exports = function mkArrayLengthDirective(options) {
  const mergedOptions = {
    name: 'maxArrayLength',
    ...(options || {}),
  }

  const directive = new GraphQLDirective({
    name: mergedOptions.name,
    description: 'Define a maximum array length',
    locations: [DirectiveLocation.INPUT_FIELD_DEFINITION, DirectiveLocation.ARGUMENT_DEFINITION],
    args: {
      length: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The maximum length for the field',
      },
    },
  })

  const arrayLengthDirective = (field, value) => {
    // Ignore if astNode is undefined or if the value is not a list
    // The type check will be handled elsewhere
    if (!field.astNode || !Array.isArray(value)) {
      return
    } else {
      const directiveValue = getDirectiveValues(directive, field.astNode)

      // Ignore if no directive set
      if (!directiveValue) {
        return
      } else {
        // length check
        if (value.length > directiveValue.length) {
          throw new UserInputError(
            `Invalid array length for argument ${field.name}. Supplied ${value.length} items, maximum allowed is ${directiveValue.length}`
          )
        }
      }
    }
  }

  return arrayLengthDirective
}
