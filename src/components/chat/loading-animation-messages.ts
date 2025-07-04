// defines general loading messages used by the loading animation
const loadingMessages: string[] = [
  'Roger…ich erledige das',
  'Aye-aye…',
  'Ich überlege…',
  'Ich suche nach der besten Antwort für Dich…',
  'Ich muss kurz nachdenken…',
  'Genieße den Duft deines Tees…ich bin gleich soweit',
  'Nimm einen Schluck Wasser…ich erledige das',
  'Lehn dich zurück…gleich geht’s weiter',
  'Denk an was Schönes…um den Rest kümmere ich mich',
  'Ich bin fast am Ziel, halte durch!',
  'Ich bin auf der Zielgeraden, noch ein Moment!',
  'Fast fertig, halte die Spannung!',
  'Ich bin gleich soweit, bleib gespannt!',
  'Atme einmal tief durch…im Nu bin ich fertig',
  'Vielen Dank für deine Anfrage…gib mir eine Sekunde',
  'Mach kurz Pause…ich bin gleich wieder soweit',
  'Es macht Spaß mit dir zu arbeiten…',
  'Schließe deine Augen für eine Sekunde…et voila!',
  'Freue Dich auf meine Antwort…',
  'telli at your service…',
];

// defines loading messages if external resources like documents or links are used
const loadingMessagesForExternalResources: string[] = [
  "Ich sortiere die Informationen, gleich geht's weiter…",
  'Ich blättere gerade durch die Seiten… gleich bin ich fertig',
  'Ich bin dabei, die Informationen zu entwirren…',
  'Die Dokumente erzählen mir gerade ihre Geschichte...',
  'Ich bin auf einer Entdeckungsreise durch die Daten...',
  'Die Quellen sind wie ein Puzzle, das ich gerade zusammensetze...',
  'Ich bin dabei, die Fakten zu sortieren...',
  'Die Dokumente sind mein Kompass, ich finde den Weg...',
];

export function getLoadingMessage(isExternalResourceUsed: boolean): string {
  if (isExternalResourceUsed) {
    const index = Math.floor(Math.random() * loadingMessagesForExternalResources.length - 1);
    return loadingMessagesForExternalResources.at(index) ?? '';
  } else {
    const index = Math.floor(Math.random() * loadingMessages.length - 1);
    return loadingMessages.at(index) ?? '';
  }
}
