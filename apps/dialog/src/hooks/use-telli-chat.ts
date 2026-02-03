'use client';

import { useState, useCallback, useRef } from 'react';
import { readTextStream } from '@/utils/streaming';
import { type ChatMessage, type ChatStatus } from '@/types/chat';

// Re-export for consumers
export type { ChatMessage, ChatStatus };

export type SendMessageResult = {
  stream: ReadableStream<string>;
  messageId: string;
};

/**
 * Function type for sending chat messages.
 * Each chat type (main chat, character chat, shared chat) will implement this interface.
 */
export type SendMessageFn = (params: {
  messages: ChatMessage[];
  modelId: string;
  fileIds?: string[];
}) => Promise<SendMessageResult>;

export type UseChatOptions = {
  initialMessages?: ChatMessage[];
  modelId?: string;
  sendMessage: SendMessageFn;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
};

export type UseChatReturn = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent, options?: { fileIds?: string[] }) => Promise<void>;
  isLoading: boolean;
  status: ChatStatus;
  error: Error | null;
  reload: () => Promise<void>;
  stop: () => void;
};

/**
 * Custom hook to manage chat state and streaming.
 * Replaces the Vercel AI SDK's useChat hook with Server Actions.
 */
export function useTelliChat({
  initialMessages = [],
  modelId,
  sendMessage,
  onError,
  onFinish,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<ChatMessage | null>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const submitMessage = useCallback(
    async (userMessage: ChatMessage, fileIds?: string[]) => {
      if (!modelId) {
        const err = new Error('No model selected');
        setError(err);
        setStatus('error');
        onError?.(err);
        return;
      }

      setStatus('submitted');
      setError(null);
      abortControllerRef.current = new AbortController();

      // Add user message immediately
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      lastUserMessageRef.current = userMessage;

      try {
        const result = await sendMessage({
          messages: newMessages,
          modelId,
          fileIds,
        });

        // we need to handle the first chunk separately to avoid missing content
        let firstChunk = true;        

        // Stream the response using native ReadableStream
        for await (const content of readTextStream(result.stream)) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          if (content !== undefined && content !== null) {
            if (firstChunk) {
                    
              // Create assistant message placeholder
              const assistantMessage: ChatMessage = {
                id: result.messageId,
                role: 'assistant',
                content: '',
              };

              setMessages((prev) => [...prev, assistantMessage]);
              setStatus('streaming');
              firstChunk = false;
            }
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx]!,
                  content: updated[lastIdx]!.content + content,
                };
              }
              return updated;
            });
          }
        }

        // Get final message for onFinish callback
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            onFinish?.(lastMsg);
          }
          return prev;
        });

        setStatus('ready');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setStatus('error');
        onError?.(error);

        // Remove the assistant placeholder on error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [messages, modelId, sendMessage, onError, onFinish],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent, options?: { fileIds?: string[] }) => {
      e.preventDefault();

      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input.trim(),
      };

      setInput('');
      await submitMessage(userMessage, options?.fileIds);
    },
    [input, isLoading, submitMessage],
  );

  const reload = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // Remove last assistant message and retry
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await submitMessage(lastUserMessageRef.current);
  }, [submitMessage]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    error,
    reload,
    stop,
  };
}
