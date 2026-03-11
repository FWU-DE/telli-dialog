import { dbGetAllOrganizations } from '@telli/api-database';

export async function getOrganizations() {
  return dbGetAllOrganizations();
}
