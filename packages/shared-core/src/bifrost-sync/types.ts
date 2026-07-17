export type BifrostProvider = 'azure' | 'openai' | 'vertex' | 'ionos';

export type BifrostSecret =
  | string
  | {
      value: string;
      env_var?: string;
      from_env?: boolean;
    };

export type BifrostKey = {
  id?: string;
  name: string;
  value: BifrostSecret;
  models: string[];
  weight: number;
  aliases?: Record<string, string>;
  azure_key_config?: {
    endpoint: BifrostSecret;
  };
  vertex_key_config?: {
    project_id: BifrostSecret;
    region: BifrostSecret;
    auth_credentials?: BifrostSecret;
  };
  enabled?: boolean;
};

export type BifrostProviderConfig = {
  provider: BifrostProvider;
  network_config?: {
    base_url?: string;
  };
  custom_provider_config?: {
    base_provider_type: 'openai';
    allowed_requests: {
      list_models: boolean;
      chat_completion: boolean;
      chat_completion_stream: boolean;
      embedding: boolean;
      image_generation: boolean;
    };
  };
  keys: BifrostKey[];
};

export type BifrostProviderResponse = Omit<BifrostProviderConfig, 'provider' | 'keys'> & {
  name?: BifrostProvider;
  concurrency_and_buffer_size?: {
    concurrency?: number;
    buffer_size?: number;
  };
  proxy_config?: Record<string, unknown>;
  send_back_raw_request?: boolean;
  send_back_raw_response?: boolean;
  store_raw_request_response?: boolean;
};

export type BifrostProviderModel = {
  provider: string;
  name: string;
  setting: {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    projectId?: string;
    location?: string;
    authCredentials?: unknown;
  };
  additionalParameters?: Record<string, unknown>;
  supportedImageFormats?: string[];
  isDeleted?: boolean;
};
