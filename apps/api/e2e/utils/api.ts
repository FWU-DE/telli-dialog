const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is required. Set it in apps/api/.env.local');
}

export const authorizationHeader = {
  Authorization: `Bearer ${API_KEY}`,
};

export const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3002';
