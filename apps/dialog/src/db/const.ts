// PRICES are in cent * 10 to not have any comma values
// prices are given per 1 Million tokens.

import { DesignConfiguration } from '@ui/types/design-configuration';

export const TOKEN_AMOUNT_PER_PRICE = 1_000_000;
export const CENT_MULTIPLIER = 10;
export const PRICE_AND_CENT_MULTIPLIER = TOKEN_AMOUNT_PER_PRICE * CENT_MULTIPLIER;

export const DEFAULT_DESIGN_CONFIGURATION: DesignConfiguration = {
  primaryColor: 'rgba(70, 33, 125, 1)', // primary
  primaryTextColor: 'rgba(255, 255, 255, 1)', // primary-foreground
  secondaryColor: 'rgba(109, 233, 214, 1)', // secondary
  secondaryTextColor: 'rgba(0, 0, 0, 1)', // secondary-foreground
};
