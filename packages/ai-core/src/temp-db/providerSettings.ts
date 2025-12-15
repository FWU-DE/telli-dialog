export type LlmModelProviderSettings = {
    provider: "google";
    projectId: string;
    location: string;
} | {
    provider: "azure" | "ionos" | "openai";
    apiKey: string;
    baseUrl: string;
}
