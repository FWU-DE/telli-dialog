import { TemplateModel } from '@shared/templates/template';

export function getTemplateTypeName(type: TemplateModel['type']): string {
  switch (type) {
    case 'character':
      return 'Dialogpartner';
    case 'custom-gpt':
      return 'Assistent';
    case 'learning-scenario':
      return 'Lernszenario';
  }
}
