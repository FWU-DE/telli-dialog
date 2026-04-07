import { DesignConfiguration } from '@ui/types/design-configuration';

export const reductionBreakpoint = 'sm';

export function constructRootLayoutStyle({
  designConfiguration,
}: {
  designConfiguration: DesignConfiguration;
}) {
  return {
    '--primary': designConfiguration?.primaryColor,
    '--primary-text': designConfiguration?.primaryTextColor,
    '--secondary': designConfiguration?.secondaryColor,
    '--secondary-dark': designConfiguration?.secondaryDarkColor,
    '--secondary-text': designConfiguration?.secondaryTextColor,
  } as React.CSSProperties;
}
