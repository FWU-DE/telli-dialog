// PRICES are in cent * 10 to not have any comma values
// prices are given per 1 Million tokens

import { DesignConfiguration } from './types';

export const TOKEN_AMOUNT_PER_PRICE = 1_000_000;
export const CENT_MULTIPLIER = 10;
export const PRICE_AND_CENT_MULTIPLIER = TOKEN_AMOUNT_PER_PRICE * CENT_MULTIPLIER;
export const HELP_MODE_GPT_ID = 'e0c2f4a0-9a11-4271-bf3f-e3b368299e5f';

export const DEFAULT_DESIGN_CONFIGURATION: DesignConfiguration = {
  primaryColor: 'rgba(70, 33, 126, 1)', // vidis-purple
  primaryTextColor: 'rgba(70, 33, 126, 1)', // primary-text
  secondaryColor: 'rgba(108, 233, 215, 1)', // vidis-hover-green
  secondaryTextColor: 'rgba(238, 238, 238, 1)', // secondary-text
  secondaryDarkColor: 'rgba(68, 209, 189, 1)', // secondary-dark
  primaryHoverColor: 'rgba(226, 251, 247, 1)', // primary with slight opacity for hover
  primaryHoverTextColor: 'rgba(70, 33, 126, 1)', // primary with slight opacity for hover
  chatMessageBackgroundColor: 'rgba(245, 245, 245, 1)', // chat-message-background
  buttonPrimaryTextColor: 'rgba(255, 255, 255, 1)', // button-primary-text
  secondaryLightColor: 'rgba(226, 251, 247, 1)', // secondary-light
};
