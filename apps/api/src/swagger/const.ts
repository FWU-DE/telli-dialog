export const SWAGGER_DEFAULT_RESPONSES_SCHEMA = {
  400: {
    type: 'object',
    description: 'Bad request',
    properties: {
      error: { type: 'string' },
    },
    // required: ["error"],
  },
  401: {
    type: 'object',
    description: 'Unauthorized',
    properties: {
      error: { type: 'string' },
    },
    // required: ["error"],
  },
  403: {
    type: 'object',
    description: 'Forbidden',
    properties: {
      error: { type: 'string' },
    },
    // required: ["error"],
  },
  404: {
    type: 'object',
    description: 'Not found',
    properties: {
      error: { type: 'string' },
    },
    // required: ["error"],
  },
  429: {
    type: 'object',
    description: 'Too many requests / Budget limit reached',
    properties: {
      error: { type: 'string' },
    },
    // required: ["error"],
  },
  500: {
    type: 'object',
    description: 'Internal server error',
    properties: {
      error: { type: 'string' },
      details: { type: 'string' },
    },
    // required: ["error"],
  },
};
