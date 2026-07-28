export type LargeLanguageModel = {
  id: string;
  provider: string;
  name: string;
  displayName: string;
  description: string;
  setting: object;
  priceMetadata: object;
  organizationId: string;
  createdAt: Date;
  supportedImageFormats: string[];
  additionalParameters: object;
  isNew: boolean;
  isDeleted: boolean;
};

export type CreateLargeLanguageModel = {
  name: string;
  displayName: string;
  provider: string;
  description?: string;
  setting?: string;
  priceMetadata?: string;
  supportedImageFormats?: string;
  additionalParameters?: string;
  isNew: boolean;
  isDeleted: boolean;
};

export type UpdateLargeLanguageModel = {
  name: string;
  displayName: string;
  provider: string;
  description?: string;
  setting?: string;
  priceMetadata?: string;
  supportedImageFormats?: string;
  additionalParameters?: string;
  isNew: boolean;
  isDeleted: boolean;
};
