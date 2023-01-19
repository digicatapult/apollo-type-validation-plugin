import { getDirectiveValues, GraphQLInt, GraphQLNonNull } from 'graphql'
import { GraphQLDirective } from 'graphql/type/directives.js'
import { DirectiveLocation } from 'graphql/language/directiveLocation.js'
import { ApolloServerErrorCode } from '@apollo/server/errors'
import { GraphQLError } from 'graphql'

export default function mkBoundedIntegerDirective(options) {
  const mergedOptions = {
    name: 'boundedInteger',
    ...(options || {}),
  }

  const directive = new GraphQLDirective({
    name: mergedOptions.name,
    description: 'Define a bounded integer',
    locations: [DirectiveLocation.INPUT_FIELD_DEFINITION, DirectiveLocation.ARGUMENT_DEFINITION],
    args: {
      min: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The minimum value for the field',
      },
      max: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The maximum value for the field',
      },
    },
  })

  const boundedIntegerDirective = (field, value) => {
    // Ignore if astNode is undefined or if the value is not an integer
    // The type check will be handled elsewhere
    if (!field.astNode || !Number.isInteger(value)) {
      return
    } else {
      const directiveValue = getDirectiveValues(directive, field.astNode)

      // Ignore if no directive set
      if (!directiveValue) {
        return
      } else {
        // max check
        if (value > directiveValue.max) {
          throw new GraphQLError(
            `Invalid value for argument ${field.name}. ${value} is greater than ${directiveValue.max}`,
            {
              extensions: {
                code: ApolloServerErrorCode.BAD_USER_INPUT,
              },
            }
          )
        }
        // min check
        if (value < directiveValue.min) {
          throw new GraphQLError(
            `Invalid value for argument ${field.name}. ${value} is less than ${directiveValue.min}`,
            {
              extensions: {
                code: ApolloServerErrorCode.BAD_USER_INPUT,
              },
            }
          )
        }
      }
    }
  }

  return boundedIntegerDirective
}
