import { describe, expect, it } from 'vitest';
import { LlmModelSelectModel } from '@shared/db/schema';
import { getAspectRatioFromSize, getSizeFromAspectRatio } from './image-generation-utils';

describe('getSizeFromAspectRatio', () => {
  it('returns configured size for the requested aspect ratio', () => {
    const model = {
      imageGenerationConfig: {
        aspectRatio: {
          quadratic: '1024x1024',
          landscape: '1536x1024',
          portrait: '1024x1536',
        },
      },
    } as Pick<LlmModelSelectModel, 'imageGenerationConfig'>;

    expect(getSizeFromAspectRatio(model, 'quadratic')).toBe('1024x1024');
    expect(getSizeFromAspectRatio(model, 'landscape')).toBe('1536x1024');
    expect(getSizeFromAspectRatio(model, 'portrait')).toBe('1024x1536');
  });

  it('returns auto when no matching aspect ratio is configured', () => {
    const modelWithoutOptions = {} as Pick<LlmModelSelectModel, 'imageGenerationConfig'>;
    const modelWithoutRequestedRatio = {
      imageGenerationConfig: {
        aspectRatio: {
          quadratic: '1024x1024',
        },
      },
    } as Pick<LlmModelSelectModel, 'imageGenerationConfig'>;

    expect(getSizeFromAspectRatio(modelWithoutOptions, 'portrait')).toBe('auto');
    expect(getSizeFromAspectRatio(modelWithoutRequestedRatio, 'landscape')).toBe('auto');
  });
});

describe('getAspectRatioFromSize', () => {
  it('derives quadratic, landscape, and portrait presets from persisted image sizes', () => {
    expect(getAspectRatioFromSize('1024x1024')).toBe('quadratic');
    expect(getAspectRatioFromSize('1536x1024')).toBe('landscape');
    expect(getAspectRatioFromSize('1024x1536')).toBe('portrait');
  });

  it('falls back to quadratic for missing or invalid sizes', () => {
    expect(getAspectRatioFromSize()).toBe('quadratic');
    expect(getAspectRatioFromSize('auto')).toBe('quadratic');
    expect(getAspectRatioFromSize('invalid')).toBe('quadratic');
    expect(getAspectRatioFromSize('1024x0')).toBe('quadratic');
  });
});
