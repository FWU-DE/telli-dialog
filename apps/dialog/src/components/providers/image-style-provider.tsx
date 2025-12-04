'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export type ImageStyle = {
  name: string;
  displayName: string;
  prompt: string;
};

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
      name: 'none',
      displayName: t('no-style'),
      prompt: '',
    },
    {
      name: 'fotorealistic',
      displayName: t('style-fotorealistic-name'),
      prompt: 'Create a photorealistic image with natural lighting and realistic textures',
    },
    {
      name: 'cartoon',
      displayName: t('style-cartoon-name'),
      prompt: 'Create a cartoon-style image with vibrant colors and stylized features',
    },
  ];
}

export function ImageStyleProvider({ children }: ImageStyleProviderProps) {
  const [selectedStyle, setSelectedStyle] = React.useState<ImageStyle | undefined>(undefined);
  const styles = useImageStyles();

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
