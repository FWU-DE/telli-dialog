export type ImageAttachment = {
  type: 'image';
  mimeType?: string;
  url: string;
  id: string;
  conversationMessageId?: string;
};
