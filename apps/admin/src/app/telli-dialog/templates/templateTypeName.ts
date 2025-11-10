import { TemplateModel } from '@shared/models/templates';

export function getTemplateTypeName(type: TemplateModel['type']): string {
  switch (type) {
    case 'character':
      return 'Dialogpartner';
    case 'custom-gpt':
      return 'Assistent';
  }
}
