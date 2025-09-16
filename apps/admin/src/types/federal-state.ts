export type FederalState = {
  id: string;
  teacherPriceLimit: number;
  studentPriceLimit: number;
  createdAt: string;
  updatedAt: string;
  mandatoryCertificationTeacher: boolean;
  chatStorageTime: number;
  supportContacts: string[];
  trainingLink: string;
  telliName: string;
  studentAccess: boolean;
  enableCharacter: boolean;
  enableSharedChats: boolean;
  enableCustomGpt: boolean;
};
