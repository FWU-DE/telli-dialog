export const ROUTES = {
  home: '/',
  api: {
    apiKeys: (organizationId: string, projectId: string) =>
      `/organizations/${organizationId}/projects/${projectId}/api-keys`,
    apiKeyModelMappings: (organizationId: string, projectId: string, apiKeyId: string) =>
      `/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/model-mappings`,
    models: (organizationId: string) => `/organizations/${organizationId}/models`,
    organizations: '/organizations',
    organizationDetails: (organizationId: string) => `/organizations/${organizationId}`,
    projects: (organizationId: string) => `/organizations/${organizationId}/projects`,
  },
  dialog: {
    apiKey: (federalStateId: string) => `/telli-dialog/federal-states/${federalStateId}/api-key`,
    page: '/telli-dialog',
    federalStates: `/telli-dialog/federal-states`,
    federalStateDetails: (federalStateId: string) =>
      `/telli-dialog/federal-states/${federalStateId}`,
    templates: '/telli-dialog/templates',
    vouchers: (federalStateId: string) => `/telli-dialog/federal-states/${federalStateId}/vouchers`,
    voucherNew: (federalStateId: string) =>
      `/telli-dialog/federal-states/${federalStateId}/vouchers/new`,
  },
};
