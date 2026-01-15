import { Page } from 'k6/browser';
import { BASE_URL } from '../config';

export class SharedCharacterPage {
  constructor(
    private page: Page,
    private characterId: string,
    private inviteCode: string,
  ) {
    this.page = page;
    this.characterId = characterId;
    this.inviteCode = inviteCode;
  }

  async goto() {
    await this.page.goto(
      `${BASE_URL}/ua/characters/${this.characterId}/dialog?inviteCode=${this.inviteCode}`,
    );
    await this.page.waitForNavigation({ waitUntil: 'load' });
    console.log(`${__VU}-${__ITER} Navigated to shared character page`);
  }

  async sendMessage(message: string) {
    // write message into input field
    const chatInput = this.page.getByTestId('chat-input');
    await chatInput.waitFor();
    await chatInput.fill(message);

    // click send button and wait for response
    await this.page.getByTestId('submit-button').click();
    await this.page
      .getByTestId('streaming-finished')
      .waitFor({ state: 'attached', timeout: 60000 });

    console.log(`${__VU}-${__ITER} Message sent and response received`);
  }
}
