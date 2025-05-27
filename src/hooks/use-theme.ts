import { useTheme as useThemeContext } from '@/components/providers/theme-provider';

export function useTheme() {
  const { designConfiguration } = useThemeContext();

  const getCSSVariable = (property: keyof typeof designConfiguration) => {
    const cssVariableMap = {
      primaryColor: '--primary',
      primaryTextColor: '--primary-text',
      secondaryColor: '--secondary',
      secondaryTextColor: '--secondary-text',
      secondaryDarkColor: '--secondary-dark',
      secondaryLightColor: '--secondary-light',
      primaryHoverColor: '--primary-hover',
      primaryHoverTextColor: '--primary-hover-text',
      chatMessageBackgroundColor: '--chat-message-background',
      buttonPrimaryTextColor: '--button-primary-text',
    };

    return cssVariableMap[property] || property;
  };

  const getThemeValue = (property: keyof typeof designConfiguration) => {
    return designConfiguration[property];
  };

  return {
    designConfiguration,
    getCSSVariable,
    getThemeValue,
    theme: {
      primary: designConfiguration.primaryColor,
      primaryText: designConfiguration.primaryTextColor,
      secondary: designConfiguration.secondaryColor,
      secondaryText: designConfiguration.secondaryTextColor,
      secondaryDark: designConfiguration.secondaryDarkColor,
      secondaryLight: designConfiguration.secondaryLightColor,
      primaryHover: designConfiguration.primaryHoverColor,
      primaryHoverText: designConfiguration.primaryHoverTextColor,
      chatMessageBackground: designConfiguration.chatMessageBackgroundColor,
      buttonPrimaryText: designConfiguration.buttonPrimaryTextColor,
    },
  };
}
