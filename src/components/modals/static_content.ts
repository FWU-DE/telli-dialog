export const TERM_AND_CONDITIONS = [
  'telli ist ein Angebot des Instituts für Film und Bild in Wissenschaft und Unterricht (FWU) gGmbH, das in Brandenburg im Auftrag des Ministeriums für Bildung, Jugend und Sport des Landes Brandenburg zur Verfügung gestellt wird.',
  '1. Nur registrierte und für telli freigeschaltete Lehrkräfte („Nutzende“) können telli für dienstliche Zwecke nutzen. Eine private Nutzung ist nicht zulässig.',
  ,
  '2. Nutzende erhalten ein begrenztes Nutzungskontingent. Eine Nutzung über das Kontingent hinaus ist nicht zulässig, um eine Verfügbarkeit des Dienstes für eine Vielzahl von Lehrkräften gewährleisten zu können.',
  '3. Die Nutzung von telli ist ausschließlich für dienstliche Zwecke gestattet. Eine private, bzw. gewerbliche Nutzung von telli durch Nutzende ist untersagt und kann zum Ausschluss von der Nutzung von telli führen.',
  '4. Nutzende sind für ihre Eingaben selbst verantwortlich. Inhalte, die gegen geltendes deutsches Recht verstoßen und/oder als beleidigend, bedrohlich, obszön oder anderweitig unangemessen angesehen werden können, sowie sensible und/oder eindeutig personenbezogene Inhalte sind nicht gestattet. Ant-worten von telli sollten in jedem Fall einer pädagogischen Reflexion und Prüfung unterzogen werden.',
  '5. telli nutzt eine Schnittstelle zu unterschiedlichen LLM-Anbietern. Dabei werden nur die jeweiligen Ein-gaben im Chat an die LLM-Anbieter weitergegeben, jedoch keine weiteren personenbezogenen Daten. Alle LLM-Anbieter speichern nach eigenen Angaben keine Daten für spätere Trainingszwecke. Chatverläufe, die von Nutzenden gespeichert werden, werden ausschließlich durch FWU verschlüsselt abgelegt und sind nur von Ihnen selbst einsehbar. Auch Beschäftigte des FWU oder des Ministeriums für Bil-dung, Jugend und Sport des Landes Brandenburg können Chatverläufe nicht einsehen. Gespeicherte Chatverläufe werden durch die Löschung eines Zugangs endgültig entfernt.',
  '6. Nutzende sind verpflichtet, das Urheberrecht zu beachten.',
  '7. Das FWU und das Ministerium für Bildung, Jugend und Sport des Landes Brandenburg haften nicht für die Richtigkeit der Antworten von telli und übernehmen keine Haftung für Schäden, die durch die Nutzung von telli entstehen könnten.',
  '8. Das Ministerium für Bildung, Jugend und Sport des Landes Brandenburg behält sich das Recht vor, diesen Dienst jederzeit ohne gesonderte Ankündigung einzustellen. Das MBJS behält sich außerdem das Recht vor, Nutzende bei wiederholter oder andauernder missbräuchlicher Nutzung vorübergehend oder dauerhaft von der Nutzung auszuschließen.',
  '9. Diese Nutzungsbedingungen können jederzeit geändert werden. Nutzende werden durch eine Mitteilung auf dem Bildungsserver Berlin Brandenburg über Änderungen informiert. Die Nutzungsbedingung sind jederzeit auf den Seiten des Bildungsservers Berlin Brandenburg einsehbar.',
];

// increment this number to prompt renewed acceptance from all users
export const VERSION = 1;
// Ids of all States which explicitly have to accept to the terms & conditions
export const showTermsFederalStates = ['DE-BB'];
