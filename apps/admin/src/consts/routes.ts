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
    federalStates: '/federal-states',
    federalStateDetails: (federalStateId: string) => `/federal-states/${federalStateId}`,
    vouchers: (federalStateId: string) => `/federal-states/${federalStateId}/vouchers`,
    voucherNew: (federalStateId: string) => `/federal-states/${federalStateId}/vouchers/new`,
  },
};
