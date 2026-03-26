export function navigateWithoutRefresh(path: string) {
  window.history.replaceState({ ...window.history.state }, '', path);
}
