import { describe, expect, it } from 'vitest';
import {
  verifyFilesDoNotBelongToAnyUser,
  verifySharedChatFileOwnershipBySession,
  verifySharedSessionIdIsNotEmpty,
} from './shared-chat-verify';

describe('verifySharedSessionIdIsNotEmpty', () => {
  it('throws when shared session id is undefined', () => {
    expect(() => verifySharedSessionIdIsNotEmpty(undefined)).toThrow(
      'Not authorized to use uploaded files',
    );
  });

  it('throws when shared session id is blank', () => {
    expect(() => verifySharedSessionIdIsNotEmpty('   ')).toThrow(
      'Not authorized to use uploaded files',
    );
  });

  it('accepts a non-empty session id', () => {
    expect(() => verifySharedSessionIdIsNotEmpty('session-1')).not.toThrow();
  });
});

describe('verifyFilesDoNotBelongToAnyUser', () => {
  it('throws when at least one file belongs to a user', () => {
    expect(() => verifyFilesDoNotBelongToAnyUser([{ userId: null }, { userId: 'user-1' }])).toThrow(
      'Not authorized to use one or more files',
    );
  });

  it('allows files that do not belong to any user', () => {
    expect(() => verifyFilesDoNotBelongToAnyUser([{ userId: null }])).not.toThrow();
  });
});

describe('verifySharedChatFileOwnershipBySession', () => {
  const context = {
    inviteCode: 'invite-1',
    entityType: 'character' as const,
    entityId: 'character-1',
  };

  it('accepts files with matching ownership metadata', () => {
    const files = [
      {
        metadata: {
          sharedChatInviteCode: 'invite-1',
          sharedChatEntityType: 'character',
          sharedChatEntityId: 'character-1',
          sharedChatSessionId: 'session-1',
        },
      },
    ];

    expect(() => verifySharedChatFileOwnershipBySession(files, context, 'session-1')).not.toThrow();
  });

  it('throws when metadata does not match context/session', () => {
    const files = [
      {
        metadata: {
          sharedChatInviteCode: 'invite-1',
          sharedChatEntityType: 'character',
          sharedChatEntityId: 'character-1',
          sharedChatSessionId: 'other-session',
        },
      },
    ];

    expect(() => verifySharedChatFileOwnershipBySession(files, context, 'session-1')).toThrow(
      'Not authorized to access this file',
    );
  });

  it('throws when metadata is null', () => {
    const files = [{ metadata: null }];

    expect(() => verifySharedChatFileOwnershipBySession(files, context, 'session-1')).toThrow(
      'Not authorized to access this file',
    );
  });
});
