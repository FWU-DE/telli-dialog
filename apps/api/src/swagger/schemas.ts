export const completionSchema = {
  body: {
    type: "object",
    properties: {
      model: { type: "string" },
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["system", "user", "assistant"] },
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
      max_tokens: { type: "number", default: 257 },
      temperature: { type: "number", default: 0.7 },
      stream: { type: "boolean", default: false },
    },
    required: ["model", "messages", "temperature"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        object: { type: "string" },
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
                  role: { type: "string" },
                  content: { type: "string" },
                },
                required: ["role", "content"],
              },
              finish_reason: { type: "string" },
            },
            required: ["index", "message", "finish_reason"],
          },
        },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "number" },
            total_tokens: { type: "number" },
            completion_tokens: { type: "number" },
          },
          required: ["prompt_tokens", "total_tokens", "completion_tokens"],
        },
      },
      required: ["id", "object", "created", "model", "choices", "usage"],
    },
  },
};

export const healthSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "OK" },
      },
      required: ["status"],
    },
  },
};
