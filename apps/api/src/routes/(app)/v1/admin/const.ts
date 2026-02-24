import { handler as v1_admin_model_getAllHandler } from "./organizations/$organizationId/models/get";
import { handler as v1_admin_model_postHandler } from "./organizations/$organizationId/models/post";
import { handler as v1_admin_model_getByIdHandler } from "./organizations/$organizationId/models/$id/get";
import { handler as v1_admin_model_patchByIdHandler } from "./organizations/$organizationId/models/$id/patch";
import { handler as v1_admin_model_deleteByIdHandler } from "./organizations/$organizationId/models/$id/delete";
import { handler as v1_admin_organizations_$organizationId_report_getHandler } from "./organizations/$organizationId/report/get";
import { handler as v1_admin_organizations_getHandler } from "./organizations/get";
import { handler as v1_admin_organizations_$organizationId_getHandler } from "./organizations/$organizationId/get";
import { handler as v1_admin_organizations_$organizationId_projects_getHandler } from "./organizations/$organizationId/projects/get";
import { handler as v1_admin_organizations_$organizationId_projects_postHandler } from "./organizations/$organizationId/projects/post";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_getHandler } from "./organizations/$organizationId/projects/$projectId/get";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_putHandler } from "./organizations/$organizationId/projects/$projectId/put";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_getHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/get";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_postHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/post";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_getHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/$apiKeyId/get";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_patchHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/$apiKeyId/patch";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_deleteHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/$apiKeyId/delete";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_model_mappings_getHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/$apiKeyId/model-mappings/get";
import { handler as v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_model_mappings_putHandler } from "./organizations/$organizationId/projects/$projectId/api-keys/$apiKeyId/model-mappings/put";

import { RouteHandlerDefinition } from "@/handlers";

export const adminRouteHandlerDefinitions: Array<RouteHandlerDefinition> = [
  {
    path: "/v1/admin/organizations",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_projects_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects",
    method: "POST",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_projects_postHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId",
    method: "GET",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId",
    method: "PUT",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_putHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys",
    method: "GET",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/report/:year",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_organizations_$organizationId_report_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models",
    method: "POST",
    schema: { hide: true },
    handler: v1_admin_model_postHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_model_getAllHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "GET",
    schema: { hide: true },
    handler: v1_admin_model_getByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "PATCH",
    schema: { hide: true },
    handler: v1_admin_model_patchByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/models/:id",
    method: "DELETE",
    schema: { hide: true },
    handler: v1_admin_model_deleteByIdHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys",
    method: "POST",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_postHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId",
    method: "GET",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId",
    method: "PATCH",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_patchHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId",
    method: "DELETE",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_deleteHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId/model-mappings",
    method: "GET",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_model_mappings_getHandler,
  },
  {
    path: "/v1/admin/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId/model-mappings",
    method: "PUT",
    schema: { hide: true },
    handler:
      v1_admin_organizations_$organizationId_projects_$projectId_apiKeys_$apiKeyId_model_mappings_putHandler,
  },
];
