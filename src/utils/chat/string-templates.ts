// Type-safe version with a more explicit placeholder syntax
function fillTemplate<T extends Record<string, any>>(template: string, values: T): string {
  return template.replace(/\${(\w+)}/g, (_, key) => {
    return key in values ? String(values[key]) : `\${${key}}`;
  });
}

// Create a reusable template function
function createTemplate(templateString: string) {
  return <T extends Record<string, any>>(values: T): string => {
    return fillTemplate(templateString, values);
  };
}
