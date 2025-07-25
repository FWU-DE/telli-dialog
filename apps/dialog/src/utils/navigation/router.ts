export function navigateWithoutRefresh(path: string) {
  window.history.replaceState(null, '', path);
}
