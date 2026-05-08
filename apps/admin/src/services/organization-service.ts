import { dbGetAllOrganizations } from '@ais-chat/api-database';

export async function getOrganizations() {
  return dbGetAllOrganizations();
}
