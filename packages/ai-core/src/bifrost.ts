export function getBifrostModelName(modelName: string): string {
  return modelName.replace(/^anthropic\//, '');
}
