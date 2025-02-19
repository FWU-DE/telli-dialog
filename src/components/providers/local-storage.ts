const isClient = typeof window !== 'undefined';

export function saveToLocalStorage(key: string, value: string) {
  if (isClient) {
    localStorage.setItem(key, value);
  }
}

export function readFromLocalStorage(key: string): string | null {
  if (isClient) {
    return localStorage.getItem(key);
  }
  return null;
}
