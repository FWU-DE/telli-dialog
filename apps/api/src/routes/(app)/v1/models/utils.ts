import { LlmModel } from "@telli/api-database";

type ObscuredLlmModel = Omit<LlmModel, "setting" | "organizationId">;

export function obscureModels(models: LlmModel[]): ObscuredLlmModel[] {
  return models.map((model) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { setting, organizationId, ...rest } = model;
    return rest;
  });
}
