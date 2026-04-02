import { env } from '@/env';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify/types/instance';

export async function initSwagger(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: `${env.apiName} API Documentation`,
        description: `${env.apiName} API Swagger Documentation.`,
        version: '0.1.0',
      },
      servers: [
        {
          url: env.apiBaseUrl,
          description: env.apiName,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      externalDocs: {
        url: env.apiBaseUrl,
        description: 'Find more info here',
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      // docExpansion: "none",
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecification: (swaggerObject) => {
      // load OpenApi document from relative location to prevent CSP issues
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      swaggerObject.servers[0].url = '/';
      return swaggerObject;
    },
  });
}
