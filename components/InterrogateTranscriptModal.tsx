
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { FormState, ApiConfig, ChatMessage, Participant, Controls } from '../types';
import { interrogateTranscript } from '../services/apiService';
import { Tooltip } from './ui/Tooltip';
import { telemetryService } from '../utils/telemetryService';
import { EmphasisText } from './EmphasisText';
import { useAuth } from '../contexts/AuthContext';

interface InterrogateTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  formState: FormState;
  apiConfig: ApiConfig;
  addToast: (message: string, type?: 'success' | 'error') => void;
  suggestedQuestions?: string[];
  participants?: Participant[];  // NEW: For context-aware interrogation
  controls?: Controls;  // NEW: To pass user's actual control settings
}

const renderWithBold = (text: string): React.ReactNode => {
    const regex = /(\*\*|__)(.*?)\1/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    return parts.length > 1 ? <>{parts}</> : text;
};

const ChatMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listType: 'ol' | 'ul' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            if (listType === 'ol') {
                elements.push(<ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1">{listItems}</ol>);
            } else {
                elements.push(<ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1">{listItems}</ul>);
            }
            listItems = [];
            listType = null;
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        const olMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        const ulMatch = trimmed.match(/^- \s*(.*)/);

        if (olMatch) {
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            listItems.push(<li key={index}>{renderWithBold(olMatch[2])}</li>);
        } else if (ulMatch) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(<li key={index}>{renderWithBold(ulMatch[1])}</li>);
        } else {
            flushList();
            if (trimmed) {
                elements.push(<p key={index}>{renderWithBold(trimmed)}</p>);
            }
        }
    });

    flushList(); // Make sure the last list is rendered
    return <div className="space-y-2">{elements}</div>;
};


export const InterrogateTranscriptModal: React.FC<InterrogateTranscriptModalProps> = ({ isOpen, onClose, formState, apiConfig, addToast, suggestedQuestions, participants, controls }) => {
  const { t } = useTranslation(['common']);
  const { graphData } = useAuth();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // User initials for avatar
  const getUserInitials = (): string => {
    if (!graphData?.displayName) return 'U';
    const names = graphData.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return graphData.displayName.substring(0, 2).toUpperCase();
  };

  const fallbackQuestions = [
    t('common:interrogate.defaultQuestions.decisions'),
    t('common:interrogate.defaultQuestions.topAction'),
    t('common:interrogate.defaultQuestions.risks')
  ];

  // Only show questions if suggestedQuestions is explicitly provided (not undefined)
  // When undefined, we don't show any suggested questions (e.g., from View Transcript modal)
  const questionsToDisplay = suggestedQuestions !== undefined
    ? (suggestedQuestions.length > 0 ? suggestedQuestions : fallbackQuestions)
    : [];
    
  const lastTurn = conversation.length > 0 ? conversation[conversation.length - 1] : null;

  useEffect(() => {
    if (isOpen) {
      setConversation([]);
      setQuestion('');
    }
  }, [isOpen]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleAsk = async (questionToSend: string) => {
    const trimmedQuestion = questionToSend.trim();
    if (!trimmedQuestion || isLoading) return;

    // Telemetry: Track question asked
    telemetryService.trackEvent('questionAsked', {
      questionLength: trimmedQuestion.length,
      conversationTurn: conversation.length + 1
    });

    setIsLoading(true);
    setQuestion('');

    // Add user's question to the conversation immediately for better UX
    const userMessage: ChatMessage = { question: trimmedQuestion };
    setConversation(prev => [...prev, userMessage]);

    try {
      const response = await interrogateTranscript(formState, trimmedQuestion, apiConfig, participants, controls);
      // Update the last message (the user's question) with the agent's response
      setConversation(prev => {
        const newConversation = [...prev];
        const lastMessage = newConversation[newConversation.length - 1];
        lastMessage.answer = response.answer;
        lastMessage.emphasis = response.emphasis; // Store emphasis markers
        lastMessage.not_in_transcript = response.not_in_transcript;
        lastMessage.follow_up_suggestions = response.follow_up_suggestions;
        return newConversation;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      addToast(errorMessage, 'error');
      // Update the last message to show an error state
       setConversation(prev => {
        const newConversation = [...prev];
        const lastMessage = newConversation[newConversation.length - 1];
        lastMessage.answer = `Sorry, an error occurred: ${errorMessage}`;
        lastMessage.isError = true;
        return newConversation;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <Card id="interrogate-transcript-modal" className="w-full max-w-2xl flex flex-col h-[70vh]" onClick={e => e.stopPropagation()}>
        <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="interrogate" className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('common:interrogate.title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            {conversation.length > 0 && (
                 <Tooltip content={t('common:actions.clearConversation')}>
                    <button
                        onClick={() => setConversation([])}
                        className="-m-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label={t('common:actions.clearConversation')}
                    >
                        <Icon name="trash" className="h-5 w-5" />
                    </button>
                 </Tooltip>
            )}
            <button
                id="interrogate-modal-close-button"
                onClick={onClose}
                className="-m-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t('common:buttons.close')}
            >
                <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </header>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {conversation.length === 0 && questionsToDisplay.length > 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 pt-8">
              <h3 className="text-lg font-semibold">{t('common:interrogate.subtitle')}</h3>
              <p className="mt-2 text-sm">
                {(suggestedQuestions && suggestedQuestions.length > 0)
                  ? t('common:interrogate.suggestionsIntro')
                  : t('common:interrogate.examplesIntro')}
              </p>
              <div className="mt-3 flex flex-col items-center gap-2">
                {questionsToDisplay.map((q, i) => (
                    <button key={i} onClick={() => handleAsk(q)} className="text-primary hover:underline text-sm font-medium p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        "{q}"
                    </button>
                ))}
              </div>
            </div>
          )}
          {conversation.length === 0 && questionsToDisplay.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 pt-8">
              <h3 className="text-lg font-semibold">{t('common:interrogate.subtitle')}</h3>
              <p className="mt-2 text-sm">
                Ask any question about this transcript.
              </p>
            </div>
          )}
          {conversation.map((turn, index) => (
            <div key={index} className="space-y-4">
              {/* User Question with Avatar */}
              <div className="flex justify-end gap-3 items-start">
                <div className="bg-primary text-white p-3 rounded-lg max-w-[80%]">
                  {turn.question}
                </div>
                {/* User Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shadow-md">
                  {graphData?.photoUrl ? (
                    <img src={graphData.photoUrl} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getUserInitials()
                  )}
                </div>
              </div>

              {/* Agent Answer with Icon */}
              {turn.answer ? (
                 <div className="flex justify-start gap-3 items-start">
                    {/* Agent Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className={`${turn.isError ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'} p-3 rounded-lg max-w-[80%]`}>
                      {turn.emphasis && turn.emphasis.length > 0 ? (
                        <EmphasisText text={turn.answer} emphasis={turn.emphasis} />
                      ) : (
                        <ChatMarkdownRenderer content={turn.answer} />
                      )}
                    </div>
                  </div>
              ) : (
                <div className="flex justify-start gap-3 items-start">
                  {/* Agent Icon (loading state) */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg inline-flex items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
           {lastTurn && lastTurn.answer && !isLoading && lastTurn.follow_up_suggestions && lastTurn.follow_up_suggestions.length > 0 && (
              <div className="pt-4 flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('common:interrogate.followUpLabel')}</p>
                {lastTurn.follow_up_suggestions.map((q, i) => (
                  <button key={i} onClick={() => handleAsk(q)} className="text-primary hover:underline text-sm font-medium p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    "{q}"
                  </button>
                ))}
              </div>
            )}
          <div ref={conversationEndRef} />
        </div>

        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
                <Textarea
                  id="interrogate-question"
                  label=""
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(question); } }}
                  placeholder={t('common:interrogate.placeholder')}
                  rows={1}
                  className="resize-none"
                />
            </div>
            <Button
                size="md"
                className="!p-2.5 flex-shrink-0"
                onClick={() => handleAsk(question)}
                disabled={isLoading || !question.trim()}
                aria-label={t('common:actions.sendQuestion')}
            >
              <Icon name="send" className="h-5 w-5" />
            </Button>
          </div>
        </footer>
      </Card>
    </div>
  );
};
