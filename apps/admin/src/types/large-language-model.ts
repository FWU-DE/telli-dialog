export type LargeLanguageModel = {
  id: string;
  provider: string;
  name: string;
  displayName: string;
  description: string;
  setting: string;
  priceMetadata: string;
  organizationId: string;
  createdAt: Date;
  supportedImageFormats: string;
  additionalParameters: string;
  isNew: boolean;
  isDeleted: boolean;
};
