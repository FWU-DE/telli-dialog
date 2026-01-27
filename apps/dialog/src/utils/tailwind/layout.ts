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
    '--secondary-light': designConfiguration?.secondaryLightColor,
    '--primary-hover': designConfiguration?.primaryHoverColor,
    '--primary-hover-text': designConfiguration?.primaryHoverTextColor,
    '--chat-message-background': designConfiguration?.chatMessageBackgroundColor,
    '--button-primary-text': designConfiguration?.buttonPrimaryTextColor,
  } as React.CSSProperties;
}
