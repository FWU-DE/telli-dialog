import { describe, expect, it } from 'vitest';
import { LlmModelSelectModel } from '@shared/db/schema';
import { getSizeFromAspectRatio } from './image-generation-utils';

describe('getSizeFromAspectRatio', () => {
  it('returns configured size for the requested aspect ratio', () => {
    const model = {
      imageGenerationOptions: {
        aspectRatio: {
          quadratic: '1024x1024',
          landscape: '1536x1024',
          portrait: '1024x1536',
        },
      },
    } as Pick<LlmModelSelectModel, 'imageGenerationOptions'>;

    expect(getSizeFromAspectRatio(model, 'quadratic')).toBe('1024x1024');
    expect(getSizeFromAspectRatio(model, 'landscape')).toBe('1536x1024');
    expect(getSizeFromAspectRatio(model, 'portrait')).toBe('1024x1536');
  });

  it('returns auto when no matching aspect ratio is configured', () => {
    const modelWithoutOptions = {} as Pick<LlmModelSelectModel, 'imageGenerationOptions'>;
    const modelWithoutRequestedRatio = {
      imageGenerationOptions: {
        aspectRatio: {
          quadratic: '1024x1024',
        },
      },
    } as Pick<LlmModelSelectModel, 'imageGenerationOptions'>;

    expect(getSizeFromAspectRatio(modelWithoutOptions, 'portrait')).toBe('auto');
    expect(getSizeFromAspectRatio(modelWithoutRequestedRatio, 'landscape')).toBe('auto');
  });
});
