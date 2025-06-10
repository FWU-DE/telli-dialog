import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

const templateCharactersIdentifier = [
  'Rosa Parks Civil rights',
  'George W. Bush 43. Präsident',
  'Anne Frank Intelligentes jü',
  'Johann Wolfgang von Goethe',
  'Frau Goß Schulinterne',
  'Polizeioberkommissarin Julia',
];

