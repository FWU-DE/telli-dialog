'use client';

import { useCallback, useRef } from 'react';
import { Control, FieldValues, Path, UseFormGetValues, useWatch } from 'react-hook-form';
import { AccessLevel, ShareTarget } from '@shared/db/schema';
import { normalizeShareTargets } from '@shared/sharing/share-targets';

type CustomChatSharingFields = {
  isSchoolShared: boolean;
  isCommunityShared: boolean;
  hasLinkAccess: boolean;
};

type ShareSettings = {
  accessLevel: AccessLevel;
  shareTargets?: ShareTarget[] | null;
};

type ShareChange = {
  name: string;
  checked: boolean;
};

type UseCustomChatSharingParams<T extends FieldValues & CustomChatSharingFields> = {
  control: Control<T>;
  getValues: UseFormGetValues<T>;
  flushAutoSave: () => Promise<unknown>;
  initialShareTargets: ShareTarget[];
  suspended?: boolean;
  onUpdateShareTargets: (shareTargets: ShareTarget[]) => Promise<boolean>;
  onUpdateError: () => void;
};

export function buildShareTargets({
  isSchoolShared,
  isCommunityShared,
}: Pick<CustomChatSharingFields, 'isSchoolShared' | 'isCommunityShared'>): ShareTarget[] {
  return normalizeShareTargets([
    ...(isSchoolShared ? (['school'] as const) : []),
    ...(isCommunityShared ? (['community'] as const) : []),
  ]);
}

export function getInitialShareTargets({
  accessLevel,
  shareTargets,
}: ShareSettings): ShareTarget[] {
  const normalizedShareTargets = normalizeShareTargets(shareTargets ?? []);

  if (normalizedShareTargets.length > 0) {
    return normalizedShareTargets;
  }

  if (accessLevel === 'community') {
    return ['community'];
  }

  if (accessLevel === 'school') {
    return ['school'];
  }

  return [];
}

export function useCustomChatSharing<T extends FieldValues & CustomChatSharingFields>({
  control,
  getValues,
  flushAutoSave,
  initialShareTargets,
  suspended,
  onUpdateShareTargets,
  onUpdateError,
}: UseCustomChatSharingParams<T>) {
  const savedShareTargetsRef = useRef(initialShareTargets.join(','));
  const isSchoolShared = Boolean(useWatch({ control, name: 'isSchoolShared' as Path<T> }));
  const isCommunityShared = Boolean(useWatch({ control, name: 'isCommunityShared' as Path<T> }));
  const hasLinkAccess = Boolean(useWatch({ control, name: 'hasLinkAccess' as Path<T> }));

  const handleSharingChange = useCallback(
    async ({ name, checked }: ShareChange) => {
      if (name === 'isSchoolShared' || name === 'isCommunityShared') {
        const currentValues = getValues();
        const nextShareTargets = buildShareTargets({
          isSchoolShared:
            name === 'isSchoolShared' ? checked : Boolean(currentValues.isSchoolShared),
          isCommunityShared:
            name === 'isCommunityShared' ? checked : Boolean(currentValues.isCommunityShared),
        });
        const nextShareTargetsKey = nextShareTargets.join(',');

        if (nextShareTargetsKey !== savedShareTargetsRef.current) {
          const didUpdateShareTargets = await onUpdateShareTargets(nextShareTargets);

          if (!didUpdateShareTargets) {
            onUpdateError();
            return;
          }

          savedShareTargetsRef.current = nextShareTargetsKey;
        }
      }

      await flushAutoSave();
    },
    [flushAutoSave, getValues, onUpdateError, onUpdateShareTargets],
  );

  return {
    handleSharingChange,
    showShareInfo: (isSchoolShared || isCommunityShared || hasLinkAccess) && !suspended,
  };
}
