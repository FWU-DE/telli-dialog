'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageStyle, ImageStyleType } from '@shared/utils/chat';

type ImageStyleProviderProps = {
  children: React.ReactNode;
};

type ImageStyleContextProps = {
  styles: ImageStyle[];
  selectedStyle: ImageStyle | undefined;
  setSelectedStyle: (style: ImageStyle | undefined) => void;
};

const ImageStyleContext = React.createContext<ImageStyleContextProps | undefined>(undefined);

function useImageStyles() {
  const t = useTranslations('image-generation');

  return [
    {
      name: 'none' as ImageStyleType,
      displayName: t('no-style'),
      prompt: '',
    },
    {
      name: 'fotorealistic' as ImageStyleType,
      displayName: t('style-fotorealistic-name'),
      prompt: 'Create a photorealistic image with natural lighting and realistic textures',
    },
    {
      name: 'cartoon' as ImageStyleType,
      displayName: t('style-cartoon-name'),
      prompt: 'Create a cartoon-style image with vibrant colors and stylized features',
    },
  ];
}

export function ImageStyleProvider({
  children,
  defaultImageStyle,
}: ImageStyleProviderProps & { defaultImageStyle?: string }) {
  const styles = useImageStyles();
  const [selectedStyle, setSelectedStyle] = React.useState<ImageStyle | undefined>(
    styles.find((style) => style.name === defaultImageStyle) || styles[0],
  );

  return (
    <ImageStyleContext.Provider value={{ styles, selectedStyle, setSelectedStyle }}>
      {children}
    </ImageStyleContext.Provider>
  );
}

export function useImageStyle(): ImageStyleContextProps {
  const maybeContext = React.useContext(ImageStyleContext);

  if (maybeContext === undefined) {
    throw Error('useImageStyle can only be used inside a ImageStyleProvider');
  }
  return maybeContext;
}
