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
  app: {
    apiKey: (federalStateId: string) => `/ais-chat-app/federal-states/${federalStateId}/api-key`,
    page: '/ais-chat-app',
    federalStates: `/ais-chat-app/federal-states`,
    federalStateDetails: (federalStateId: string) =>
      `/ais-chat-app/federal-states/${federalStateId}`,
    infoBanners: '/ais-chat-app/info-banners',
    infoBannerNew: '/ais-chat-app/info-banners/new',
    infoBannerDetails: (infoBannerId: string) => `/ais-chat-app/info-banners/${infoBannerId}`,
    toolCallCosts: '/ais-chat-app/tool-call-costs',
    templates: '/ais-chat-app/templates',
    template: (templateType: TemplateTypes, templateId: string) =>
      `/ais-chat-app/templates/${templateType}/${templateId}`,
    vouchers: (federalStateId: string) => `/ais-chat-app/federal-states/${federalStateId}/vouchers`,
    voucherNew: (federalStateId: string) =>
      `/ais-chat-app/federal-states/${federalStateId}/vouchers/new`,
    modelRefresh: '/ais-chat-app/model-refresh',
  },
};
