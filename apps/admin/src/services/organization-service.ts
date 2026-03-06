import { dbGetAllOrganizations } from '@telli/api-database';

export async function fetchOrganizations() {
  return dbGetAllOrganizations();
}
