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
    '--ring': designConfiguration?.primaryColor,
    '--sidebar-accent': `color-mix(in srgb, ${designConfiguration?.primaryColor} 15%, transparent)`,
    '--sidebar-accent-foreground': designConfiguration?.primaryColor,
    '--sidebar-ring': designConfiguration?.primaryColor,
  } as React.CSSProperties;
}
