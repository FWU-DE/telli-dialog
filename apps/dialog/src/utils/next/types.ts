export type PageContext = {
  params: Promise<unknown>;
  searchParams: Promise<unknown>;
};

export type chatRoutes = 'characters' | 'custom' | 'shared-chats';
