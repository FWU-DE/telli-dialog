import { TemplateTypes } from '@shared/templates/template';

export const ROUTES = {
  home: '/',
  api: {
    apiKeyDetails: (organizationId: string, projectId: string, apiKeyId: string) =>
      `/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`,
    apiKeyNew: (organizationId: string, projectId: string) =>
      `/organizations/${organizationId}/projects/${projectId}/api-keys/new`,
    apiKeyModelMappings: (organizationId: string, projectId: string, apiKeyId: string) =>
      `/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/model-mappings`,
    llms: (organizationId: string) => `/organizations/${organizationId}/llms`,
    llmDetails: (organizationId: string, llmId: string) =>
      `/organizations/${organizationId}/llms/${llmId}`,
    llmNew: (organizationId: string) => `/organizations/${organizationId}/llms/new`,
    models: (organizationId: string) => `/organizations/${organizationId}/models`,
    organizations: '/organizations',
    organizationDetails: (organizationId: string) => `/organizations/${organizationId}`,
    projects: (organizationId: string) => `/organizations/${organizationId}/projects`,
    projectDetails: (organizationId: string, projectId: string) =>
      `/organizations/${organizationId}/projects/${projectId}`,
  },
  dialog: {
    apiKey: (federalStateId: string) => `/telli-dialog/federal-states/${federalStateId}/api-key`,
    page: '/telli-dialog',
    federalStates: `/telli-dialog/federal-states`,
    federalStateDetails: (federalStateId: string) =>
      `/telli-dialog/federal-states/${federalStateId}`,
    templates: '/telli-dialog/templates',
    template: (templateType: TemplateTypes, templateId: string) =>
      `/telli-dialog/templates/${templateType}/${templateId}`,
    vouchers: (federalStateId: string) => `/telli-dialog/federal-states/${federalStateId}/vouchers`,
    voucherNew: (federalStateId: string) =>
      `/telli-dialog/federal-states/${federalStateId}/vouchers/new`,
    modelRefresh: '/telli-dialog/model-refresh',
  },
};
