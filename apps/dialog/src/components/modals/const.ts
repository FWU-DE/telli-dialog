import { FederalStateId } from '@/utils/vidis/const';

export const TERM_AND_CONDITIONS_BB = `telli ist ein Angebot des Instituts für Film und Bild in Wissenschaft und Unterricht (FWU) gGmbH, das in Brandenburg im Auftrag des Ministeriums für Bildung, Jugend und Sport des Landes Brandenburg zur Verfügung gestellt wird.

1. Nur registrierte und für telli freigeschaltete Lehrkräfte („Nutzende“) können telli für dienstliche Zwecke nutzen. Eine private Nutzung ist nicht zulässig.

2. Nutzende erhalten ein begrenztes Nutzungskontingent. Eine Nutzung über das Kontingent hinaus ist nicht zulässig, um eine Verfügbarkeit des Dienstes für eine Vielzahl von Lehrkräften gewährleisten zu können.

3. Die Nutzung von telli ist ausschließlich für dienstliche Zwecke gestattet. Eine private, bzw. gewerbliche Nutzung von telli durch Nutzende ist untersagt und kann zum Ausschluss von der Nutzung von telli führen.

4. Nutzende sind für ihre Eingaben selbst verantwortlich. Inhalte, die gegen geltendes deutsches Recht verstoßen und/oder als beleidigend, bedrohlich, obszön oder anderweitig unangemessen angesehen werden können, sowie sensible und/oder eindeutig personenbezogene Inhalte sind nicht gestattet. Antworten von telli sollten in jedem Fall einer pädagogischen Reflexion und Prüfung unterzogen werden.

5. telli nutzt eine Schnittstelle zu unterschiedlichen LLM-Anbietern. Dabei werden nur die jeweiligen Eingaben im Chat an die LLM-Anbieter weitergegeben, jedoch keine weiteren personenbezogenen Daten. Alle LLM-Anbieter speichern nach eigenen Angaben keine Daten für spätere Trainingszwecke. Chatverläufe, die von Nutzenden gespeichert werden, werden ausschließlich durch FWU verschlüsselt abgelegt und sind nur von Ihnen selbst einsehbar. Auch Beschäftigte des FWU oder des Ministeriums für Bildung, Jugend und Sport des Landes Brandenburg können Chatverläufe nicht einsehen. Gespeicherte Chatverläufe werden durch die Löschung eines Zugangs endgültig entfernt.

6. Nutzende sind verpflichtet, das Urheberrecht zu beachten.

7. Das FWU und das Ministerium für Bildung, Jugend und Sport des Landes Brandenburg haften nicht für die Richtigkeit der Antworten von telli und übernehmen keine Haftung für Schäden, die durch die Nutzung von telli entstehen könnten.

8. Das Ministerium für Bildung, Jugend und Sport des Landes Brandenburg behält sich das Recht vor, diesen Dienst jederzeit ohne gesonderte Ankündigung einzustellen. Das MBJS behält sich außerdem das Recht vor, Nutzende bei wiederholter oder andauernder missbräuchlicher Nutzung vorübergehend oder dauerhaft von der Nutzung auszuschließen.

9. Diese Nutzungsbedingungen können jederzeit geändert werden. Nutzende werden durch eine Mitteilung auf dem Bildungsserver Berlin Brandenburg über Änderungen informiert. Die Nutzungsbedingung sind jederzeit auf den Seiten des Bildungsservers Berlin Brandenburg einsehbar.`;

export const EDUCATION_HINT_BB = `Liebe Kollegin, Lieber Kollege,
  wir freuen uns, dass Sie telli nutzen möchten. Als KI-Chatbot unterliegt telli der EU-Verordnung über den Einsatz von Künstlicher Intelligenz (KI-VO). Die KI-VO verpflichtet in Art. 4 alle Anbieter und Betreiber von KI-Systemen dafür Sorge zu tragen, dass Personen, die ihre Systeme nutzen über die Notwendigen KI-Kompetenzen verfügen.
  
  Für telli ist in Brandenburg vor der initialen Nutzung darum der Besuch eines Selbstlernkurses des LIBRA zum Thema KI verpflichtend.

  Der Kurs ist abrufbar unter [https://ecampus.meinlibra.de/course/view.php?id=94](https://ecampus.meinlibra.de/course/view.php?id=94) und kann online absolviert werden.

  Darüber hinaus bietet das LIBRA auf der Plattform [JWD](https://bildungsserver.berlin-brandenburg.de/jwd/startseite) zahlreiche Informationen, Hinweise und Tipps zum Thema KI und Schule und für den Einsatz von telli für Lehrkräfte.
  
  Vielen Dank und viel Freude bei der Nutzung von telli.
  
  Ihr telli-Team Brandenburg`;

export const EDUCATION_HINT_HB = `Liebe Kollegin, lieber Kollege,
  wir freuen uns, dass Sie telli nutzen möchten. Als KI-Chatbot unterliegt telli der EU-Verordnung über den Einsatz von Künstlicher Intelligenz (KI-VO). Die KI-VO verpflichtet in Art. 4 alle Anbieter und Betreiber von KI-Systemen dafür Sorge zu tragen, dass Personen, die ihre Systeme nutzen über die notwendigen KI-Kompetenzen verfügen.

  Deshalb ist in Bremen der Besuch eines itslearning Selbstlernkurses zum Thema KI vor der initialen Nutzung von telli verpflichtend.

  Alle Informationen zum Selbstlernkurs sind abrufbar unter:
  [https://www.bildung.bremen.de/einfuhrung-des-chatbots-telli-im-land-bremen-458348](https://www.bildung.bremen.de/einfuhrung-des-chatbots-telli-im-land-bremen-458348)

  Dort finden Sie hilfreiche Informationen, Hinweise und Tipps zum Thema KI und Schule im Allgemeinen sowie speziell zum Einsatz von telli.

  Vielen Dank und viel Freude bei der Nutzung von telli.
  Ihr Referat 10 Medien und Bildung in der digitalen Welt`;

export const EDUCATION_HINT_BW = `telli ist eine KI-Chatbotoberfläche, über die verschiedene Sprachmodelle für Lehrkräfte, Schülerinnen und Schüler zu schulischen Zwecken nutzbar sind. Die Anwendung von KI erfordert Kompetenzen über die Nutzung, Funktion und die Wirkungsweise künstlicher Intelligenz.`;

// increment this number to prompt renewed acceptance from all users
export const VERSION: number = 1;
export type DisclaimerConfig = {
  pageContents: string[];
  showCheckBox?: boolean;
  acceptLabel?: string;
  image?: string;
};
// Ids of all States which explicitly have to accept to the terms & conditions

export const federalStateDisclaimers: Partial<Record<FederalStateId, DisclaimerConfig>> = {
  'DE-BB': {
    pageContents: [
      'Bitte lese und akzeptiere die Nutzungsbedingungen um fortzufahren.',
      TERM_AND_CONDITIONS_BB,
      EDUCATION_HINT_BB,
    ],
    showCheckBox: true,
    acceptLabel:
      'Ich versichere, dass ich den Selbstlernkurs des LIBRA zum Umgang mit telli absolviert habe.',
  },
  'DE-HB': {
    pageContents: [
      'Bitte lese und akzeptiere die Nutzungsbedingungen um fortzufahren.',
      EDUCATION_HINT_HB,
    ],
    showCheckBox: true,
    acceptLabel: 'Ich versichere, dass ich den Selbstlernkurs zum Umgang mit KI absolviert habe.',
  },
  'DE-SL': {
    pageContents: [
      'KI-Tools neigen zu Halluzinationen und Vorurteilen. Bitte überprüfen Sie die Ausgaben des KI-Chatbots kritisch.',
    ],
  },
  'DE-BW': {
    pageContents: [EDUCATION_HINT_BW],
    showCheckBox: true,
    acceptLabel:
      'Es dürfen keine privaten oder rechtswidrigen Inhalte über telli eingegeben werden. Der Output von KI-Systemen muss geprüft werden, bevor er weiterverwendet wird. Weiterführende Informationen, Hilfen und Materialien zum Einsatz von telli an Schulen sind [hier](https://edubw.link/telli-taskcards) zu finden. Ich bestätige, dies zur Kenntnis genommen zu haben.',
    image: '/disclaimer/DE-BW.png',
  },
};

if (!Number.isInteger(VERSION)) {
  throw Error(`Version must be set to an Integer, Value: ${VERSION}`);
}
