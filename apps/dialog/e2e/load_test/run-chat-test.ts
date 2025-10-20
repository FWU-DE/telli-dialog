import { HEADLESS_BROWSER_OPTIONS } from './config';
import { performLogin, runTest, selectModel, sendMessage } from './common';

export const options = HEADLESS_BROWSER_OPTIONS;

const PROMPT = `Ich bin eine Lehrerin an einer Schule und unterrichte ein technisches Fach. 
Wie kann ich dennoch dazu beitragen, den Schülerinnen und Schülern soziale Werte zu vermitteln? Bitte schreib mir dazu 2-5 Sätze. 
Bitte beende außerdem deine Nachricht mit dem Wort "ENDE", nur so weiß ich, dass du fertig bist.`;

export default async function main() {
  await runTest(async ({ page, userName, password }) => {
    await performLogin(page, userName, password);
    await selectModel(page, Number(__VU) + Number(__ITER));
    await sendMessage(page, PROMPT);
  });
}
