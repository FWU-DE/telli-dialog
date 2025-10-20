import { Page } from 'k6/browser';
import { open } from 'k6/experimental/fs';
import encoding from 'k6/encoding';
import { HEADLESS_BROWSER_OPTIONS, WAIT_TIMES_IN_MS } from './config';
import { performLogin, runTest, selectModel, sendMessage } from './common';
import { check } from 'k6';

export const options = HEADLESS_BROWSER_OPTIONS;

const PROMPT = `Was sind große Meilensteine im Leben von Van Gogh? Bitte schreib mir dazu 2-5 Sätze. 
Bitte beende außerdem deine Nachricht mit dem Wort "ENDE", nur so weiß ich, dass du fertig bist.`;

const UPLOAD_FILE_PATH = 'assets/Van_Gogh_Wikipedia.pdf';

const filePromise = open(UPLOAD_FILE_PATH);

export async function setup() {
  const file = await filePromise;
  const stat = await file.stat();
  const buffer = new Uint8Array(stat.size);
  const bytesRead = await file.read(buffer);
  if (bytesRead !== stat.size) {
    throw new Error('unexpected number of bytes read');
  }
  return { pdfBase64: encoding.b64encode(buffer, 'std') };
}

export default async function main(data: { pdfBase64: string }) {
  await runTest(async ({ page, userIndex, userName, password }) => {
    await performLogin(page, userName, password);
    await selectModel(page, Number(__VU) + Number(__ITER));
    await uploadPdfFile(page, userIndex, data.pdfBase64);
    await sendMessage(page, PROMPT);
  });
}

async function uploadPdfFile(page: Page, userIndex: string, pdfBase64: string) {
  let successfulUpload = false;
  try {
    const uploadPromise = page.waitForResponse(/api\/v1\/files$/, {
      timeout: WAIT_TIMES_IN_MS.FILE_UPLOAD_TIMEOUT,
    });
    await page.setInputFiles('input[type="file"]', {
      // @ts-expect-error Typings from @types/k6 are incorrect, string is allowed
      buffer: pdfBase64,
      mimeType: 'application/pdf',
      name: `${userIndex}.pdf`,
    });

    await uploadPromise;
    successfulUpload = true;
  } finally {
    check(page, {
      'File uploaded successfully': () => successfulUpload,
    });
  }
}
