// patch.test.ts
import assert from "node:assert";
import buildApp from "@/app";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  test,
  describe,
} from "vitest";
import { FastifyInstance } from "fastify";
import {
  dbCreateOrganization,
  dbDeleteOrganizationById,
  dbCreateLlmModel,
  dbDeleteLlmModelById,
} from "@telli/api-database";
import { env } from "@/env";
import {
  MODEL_ID,
  NON_EXISTING_MODEL_ID,
  ORGANIZATION_ID,
  testModel,
  testOrganziation,
} from "@test/testData";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await dbCreateOrganization(testOrganziation);
});

afterAll(async () => {
  await dbDeleteOrganizationById(ORGANIZATION_ID);
  await app.close();
});

beforeEach(async () => {
  await dbCreateLlmModel(testModel);
});

afterEach(async () => {
  await dbDeleteLlmModelById(MODEL_ID);
});

describe("PATCH LLM", () => {
  test("should update model and return 200", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models/${MODEL_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Updated name",
        displayName: "Updated display name",
        description: "Updated description",
        provider: "another provider",
        priceMetadata: {
          type: "image",
          promptTokenPrice: 2,
          completionTokenPrice: 2,
        },
        setting: {
          apiKey: "sk-updated",
          baseUrl: "https://api.another.com/v1",
          provider: "another",
        },
        isNew: false,
        isDeleted: true,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.strictEqual(body.name, "Updated name");
    assert.strictEqual(body.displayName, "Updated display name");
    assert.strictEqual(body.description, "Updated description");
    assert.strictEqual(body.provider, "another provider");
    assert.strictEqual(body.priceMetadata.type, "image");
    assert.strictEqual(body.priceMetadata.promptTokenPrice, 2);
    assert.strictEqual(body.priceMetadata.completionTokenPrice, 2);
    assert.strictEqual(body.setting.apiKey, "sk-updated");
    assert.strictEqual(body.setting.baseUrl, "https://api.another.com/v1");
    assert.strictEqual(body.setting.provider, "another");
    assert.strictEqual(body.isNew, false);
    assert.strictEqual(body.isDeleted, true);
  });

  test("should return 400 for malformed model id", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models/999`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {},
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for missing body", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models/${MODEL_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 400 for Zod validation error", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models/${MODEL_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: 123, // wrong type
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.ok(response.json().error);
  });

  test("should return 404 for non-existent model", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/v1/admin/organizations/${ORGANIZATION_ID}/models/${NON_EXISTING_MODEL_ID}`,
      headers: { authorization: "Bearer " + env.apiKey },
      payload: {
        name: "Doesnt matter",
      },
    });

    assert.equal(response.statusCode, 404);
    assert.ok(response.json().error);
  });
});
