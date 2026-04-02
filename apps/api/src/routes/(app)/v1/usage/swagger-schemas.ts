import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from '@/swagger/const';

export const usageRequestSwaggerSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        remainingLimitInCent: { type: 'number' },
        limitInCent: { type: 'number' },
      },
      // required: ["remainingLimitInCent", "limitInCent"],
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  security: [{ bearerAuth: [] }],
  summary: 'Get the remaining limit for the current api key and project',
  description:
    'get the remaining limit for the current api key and project in cents. The limit is the total amount of money that can be spent on the api key and project. The limit is reset at the beginning of the month.',
};
