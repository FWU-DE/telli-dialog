import { env } from '../env';

export function isDevelopment(): boolean {
  return env.nodeEnv === 'development';
}
