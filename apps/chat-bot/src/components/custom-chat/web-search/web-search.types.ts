import type { Control, FieldValues } from 'react-hook-form';
import type { WebSearchScope } from '@shared/db/schema';

export type WebSearchFields = {
  isWebSearchEnabled: boolean;
  webSearchScope?: WebSearchScope;
  webSearchIncludedDomains?: string[];
};

export type WebSearchProps<TFieldValues extends FieldValues = FieldValues> =
  | {
      readonly: true;
      control?: never;
      onCheckedChange?: never;
      onChange?: never;
      showScopeOptions?: boolean;
    }
  | {
      readonly?: false;
      control: Control<TFieldValues & WebSearchFields>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions?: false;
    }
  | {
      readonly?: false;
      control: Control<TFieldValues & WebSearchFields>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions: true;
    };

export type WebSearchEditableProps<TFieldValues extends FieldValues = FieldValues> = Exclude<
  WebSearchProps<TFieldValues>,
  { readonly: true }
>;
