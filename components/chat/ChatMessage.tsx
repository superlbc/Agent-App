import React from 'react';
import { Icon } from '../ui/Icon';
import { AdaptiveCardRenderer } from './AdaptiveCardRenderer';

interface ChatMessageProps {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date | string | number;
  adaptiveCard?: any;
  userName?: string;
  userPhotoUrl?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  adaptiveCard,
  userName = 'You',
  userPhotoUrl,
}) => {
  const isBot = role === 'bot';

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      {/* Avatar - Left for bot */}
      {isBot && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Icon name="robot" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Sender Name */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
          {isBot ? 'Knowledge Bot' : userName}
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isBot
              ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              : 'bg-primary-600 text-white'
          }`}
        >
          {/* Adaptive Card if present */}
          {adaptiveCard ? (
            <AdaptiveCardRenderer card={adaptiveCard} fallbackText={content} />
          ) : (
            <div className="text-sm whitespace-pre-wrap break-words">{content}</div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Avatar - Right for user */}
      {!isBot && (
        <div className="flex-shrink-0 mt-1">
          {userPhotoUrl ? (
            <img
              src={userPhotoUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border-2 border-primary-600"
              onError={(e) => {
                // Fallback to icon on error
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center ${userPhotoUrl ? 'hidden' : ''}`}>
            <Icon name="user" className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
