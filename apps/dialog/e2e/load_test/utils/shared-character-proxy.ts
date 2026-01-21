import { PatchCharacterSchema } from '@/app/api/v1/admin/characters/[characterId]/route';
import { HttpProxy } from './http-proxy';
import z from 'zod';

const getCharacterResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  modelId: z.string(),
});

const shareCharacterResponseSchema = z.object({
  characterId: z.string(),
  userId: z.string(),
  inviteCode: z.string(),
});

export class SharedCharacterProxy {
  private proxy: HttpProxy;

  constructor() {
    this.proxy = new HttpProxy();
  }

  getCharacter(characterId: string) {
    const url = `/api/v1/admin/characters/${characterId}`;
    const response = this.proxy.get(url);
    if (response.status !== 200) {
      throw new Error('Could not get character. Status: ' + response.status);
    }
    return getCharacterResponseSchema.parse(response.json());
  }

  shareCharacter({
    characterId,
    userId,
    telliPointsPercentageLimit,
    usageTimeLimitMinutes,
  }: {
    characterId: string;
    userId: string;
    telliPointsPercentageLimit: number;
    usageTimeLimitMinutes: number;
  }) {
    const url = `/api/v1/admin/characters/${characterId}`;
    const payload: PatchCharacterSchema = {
      shareCharacter: {
        userId,
        telliPointsPercentageLimit,
        usageTimeLimitMinutes,
      },
    };
    const response = this.proxy.patch(url, payload);
    if (response.status !== 200) {
      throw new Error('Could not share character. Status: ' + response.status);
    }
    return shareCharacterResponseSchema.parse(response.json());
  }

  unshareCharacter({ characterId, userId }: { characterId: string; userId: string }) {
    const url = `/api/v1/admin/characters/${characterId}`;
    const payload = {
      unshareCharacter: {
        userId,
      },
    };
    const response = this.proxy.patch(url, payload);
    if (response.status !== 200) {
      throw new Error('Could not unshare character. Status: ' + response.status);
    }
  }
}
