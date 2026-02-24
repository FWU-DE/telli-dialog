import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

export const embeddingRequestSwaggerSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        object: { type: "string", default: "embedding" },
        embedding: { type: "array", items: { type: "number" } },
        model: { type: "string" },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "number" },
            total_tokens: { type: "number" },
          },
        },
      },
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  body: {
    type: "object",
    properties: {
      model: { type: "string" },
      input: { type: "array", items: { type: "string" } },
    },
    required: ["model", "input"],
  },
  security: [{ bearerAuth: [] }],
  summary: "Create embeddings for the given model and input of size 1024",
  description:
    "create embeddings for the given model and input. Supports batch-embedding. The input is an array of strings, type string as input is not supported. The embeddings are returned as an array of numbers the size is ALWAYS 1024. The embeddings are metered by the api key and the associated project. If the budget is exceeds the limit, the request will fail with a 429 error.",
};
