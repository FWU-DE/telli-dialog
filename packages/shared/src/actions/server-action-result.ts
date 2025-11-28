import { BusinessError } from '@shared/error';

export type ServerActionResult<T> =
  | { success: true; value: T }
  | { success: false; error: BusinessError };
