import { DesignConfiguration } from '@ui/types/design-configuration';

export const reductionBreakpoint = 'sm';

export function constructRootLayoutStyle({
  designConfiguration,
}: {
  designConfiguration: DesignConfiguration;
}) {
  return {
    '--primary': designConfiguration?.primaryColor,
    '--primary-foreground': designConfiguration?.primaryTextColor,
    '--secondary': designConfiguration?.secondaryColor,
    '--secondary-foreground': designConfiguration?.secondaryTextColor,
  } as React.CSSProperties;
}
