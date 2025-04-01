import { type User } from '@/db/types';
import { type SchoolModel, type UserSchoolRole } from '@/db/schema';
import { ObscuredFederalState } from './utils';

type UserSchoolProps = SchoolModel & {
  userRole: UserSchoolRole;
};

export type UserAndContext = User & {
  school: UserSchoolProps;
  federalState: ObscuredFederalState;
};

export type AvailableStaticContentFiles = "usage-disclaimer-de" | "other"