import { SuspensionRequestOverview } from '@shared/suspension/suspension-service';

export function mapEntityTypeToLabel(entityType: SuspensionRequestOverview['entityType']) {
  switch (entityType) {
    case 'assistant':
      return 'Assistent';
    case 'character':
      return 'Dialogpartner';
    case 'learningScenario':
      return 'Lernszenario';
    default:
      return entityType;
  }
}

export function mapReasonToLabel(reason: SuspensionRequestOverview['reasons'][number]['reason']) {
  switch (reason) {
    case 'copyright_violation':
      return 'Urheberrechtsverletzung';
    case 'discrimination':
      return 'Diskriminierung';
    case 'false_or_outdated_information':
      return 'Falsche oder veraltete Informationen';
    case 'insufficient_sources':
      return 'Unzureichende Quellenangaben';
    case 'other':
      return 'Sonstiges';
    case 'personal_data_usage_or_query':
      return 'Nutzung oder Abfrage persönlicher Daten';
    case 'sexualized_content':
      return 'Sexualisierte Inhalte';
    case 'violence_or_extremist_content':
      return 'Gewalt / extremistische Inhalte';
    default:
      return reason;
  }
}
