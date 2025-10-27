export const ROUTES = {
  home: '/',
  api: {
    models: (organizationId: string) => `/organizations/${organizationId}/models`,
    projects: (organizationId: string) => `/organizations/${organizationId}/projects`,
    organizations: '/organizations',
    organizationDetails: (organizationId: string) => `/organizations/${organizationId}`,
  },
  dialog: {
    federalStates: '/federal-states',
    federalStateDetails: (federalStateId: string) => `/federal-states/${federalStateId}`,
    vouchers: (federalStateId: string) => `/federal-states/${federalStateId}/vouchers`,
    voucherNew: (federalStateId: string) => `/federal-states/${federalStateId}/vouchers/new`,
  },
};
