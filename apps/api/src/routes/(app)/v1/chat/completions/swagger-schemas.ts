import { SWAGGER_DEFAULT_RESPONSES_SCHEMA } from "@/swagger/const";

// NOTE: This schema is for documentation purposes only
// Actual validation is handled by Zod schemas in the route handlers
export const completionRequestSchemaSwagger = {
  response: {
    200: {
      type: "object",
      description: "Default response",
      properties: {
        id: { type: "string" },
        object: { type: "string", default: "chat.completion" },
        created: { type: "number" },
        model: { type: "string" },
        choices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              message: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["system", "user", "assistant", "developer"],
                  },
                  content: { type: "string" },
                },
                // required: ["role", "content"],
              },
              finish_reason: { type: "string" },
            },
            // required: ["index", "message", "finish_reason"],
          },
        },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "number" },
            completion_tokens: { type: "number" },
            total_tokens: { type: "number" },
          },
          // required: ["prompt_tokens", "completion_tokens", "total_tokens"],
        },
      },
      // required: ["id", "object", "created", "model", "choices"],
    },
    ...SWAGGER_DEFAULT_RESPONSES_SCHEMA,
  },
  body: {
    type: "object",
    properties: {
      model: { type: "string" },
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["system", "user", "assistant", "developer"],
            },
            content: {
              oneOf: [
                {
                  type: "string",
                  description: "Text content (legacy format)",
                },
                {
                  type: "array",
                  description:
                    "Array of content parts (supports text and images)",
                  items: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["text"] },
                          text: { type: "string" },
                        },
                        required: ["type", "text"],
                        description: "Text content part",
                      },
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["image_url"] },
                          image_url: {
                            type: "object",
                            properties: {
                              url: {
                                type: "string",
                                description:
                                  "URL of the image or base64 encoded image data (data:image/jpeg;base64,...)",
                              },
                              detail: {
                                type: "string",
                                enum: ["auto", "low", "high"],
                                description:
                                  "Image detail level for processing",
                              },
                            },
                            required: ["url"],
                          },
                        },
                        required: ["type", "image_url"],
                        description: "Image content part",
                      },
                    ],
                  },
                },
              ],
            },
          },
          required: ["role", "content"],
        },
      },
      max_tokens: { type: "number", nullable: true },
      temperature: { type: "number", default: 1 },
      stream: { type: "boolean" },
    },
    required: ["model", "messages"],
    "x-examples": {
      text: {
        summary: "Text",
        description: "Chat completion containing only text",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: "What is the capital of France?",
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
          stream: false,
        },
      },
      imageUrl: {
        summary: "Image analysis with URL",
        description: "Chat completion with image URL",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What do you see in this image?",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://fastly.picsum.photos/id/689/200/300.jpg?hmac=vg64_CHvD_VwWyxzKJAAAZswOJG8_8xEdMcP9BHgLJM",
                    detail: "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
          stream: false,
        },
      },
      imageBase64: {
        summary: "Image analysis with base64",
        description: "Chat completion with base64 encoded image",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this chart and provide insights about the data trends.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/...[truncated for example]",
                    detail: "auto",
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
          stream: false,
        },
      },
      multipleImages: {
        summary: "Multiple images",
        description: "Chat completion with multiple images",
        value: {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Compare these two images and tell me the differences.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://example.com/image1.jpg",
                    detail: "high",
                  },
                },
                {
                  type: "image_url",
                  image_url: {
                    url: "https://example.com/image2.jpg",
                    detail: "high",
                  },
                },
              ],
            },
          ],
          max_tokens: 400,
          temperature: 0.5,
          stream: false,
        },
      },
    },
  },
  summary: "Chat completion",
  description:
    "proxy for openai compatible chat completion the standard is not fully implemented. Supports text input and image input. Image input is not supported for all models. If a model does not support image input, the request will fail with a generic 400 error. See examples for usage. example1 generic text usage, exampe 2-4 image usage. Usage is metered by the api key and the associated project. If the budget is exceeds the limit, the request will fail with a 429 error. o3-mini is a reasoning model and does not support max_tokens and temperature due to azure limitations.",
  security: [{ bearerAuth: [] }],
};
