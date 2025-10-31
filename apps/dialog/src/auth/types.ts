import { type User } from '@shared/db/types';
import { type SchoolModel, type UserSchoolRole } from '@shared/db/schema';
import { ObscuredFederalState } from './utils';

type UserSchoolProps = SchoolModel & {
  userRole: UserSchoolRole;
};

export type UserAndContext = User & {
  school: UserSchoolProps;
  federalState: ObscuredFederalState;
  hasApiKeyAssigned: boolean;
};
