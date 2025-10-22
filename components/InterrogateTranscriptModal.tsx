
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { FormState, ApiConfig, ChatMessage } from '../types';
import { interrogateTranscript } from '../services/apiService';
import { Tooltip } from './ui/Tooltip';
import { telemetryService } from '../utils/telemetryService';

interface InterrogateTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  formState: FormState;
  apiConfig: ApiConfig;
  addToast: (message: string, type?: 'success' | 'error') => void;
  suggestedQuestions?: string[];
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


export const InterrogateTranscriptModal: React.FC<InterrogateTranscriptModalProps> = ({ isOpen, onClose, formState, apiConfig, addToast, suggestedQuestions }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  
  const fallbackQuestions = [
    "What were the main decisions?",
    "Who owns the top action and by when?",
    "Summarize risks or open questions."
  ];
  
  const questionsToDisplay = (suggestedQuestions && suggestedQuestions.length > 0)
    ? suggestedQuestions
    : fallbackQuestions;
    
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
      const response = await interrogateTranscript(formState, trimmedQuestion, apiConfig);
      // Update the last message (the user's question) with the agent's response
      setConversation(prev => {
        const newConversation = [...prev];
        const lastMessage = newConversation[newConversation.length - 1];
        lastMessage.answer = response.answer;
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
            <h2 className="text-lg font-semibold">Interrogate Transcript</h2>
          </div>
          <div className="flex items-center gap-2">
            {conversation.length > 0 && (
                 <Tooltip content="Clear conversation">
                    <button
                        onClick={() => setConversation([])}
                        className="-m-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label="Clear conversation"
                    >
                        <Icon name="trash" className="h-5 w-5" />
                    </button>
                 </Tooltip>
            )}
            <button
                id="interrogate-modal-close-button"
                onClick={onClose}
                className="-m-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close"
            >
                <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </header>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {conversation.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 pt-8">
              <h3 className="text-lg font-semibold">Ask a question about the transcript.</h3>
              <p className="mt-2 text-sm">
                {(suggestedQuestions && suggestedQuestions.length > 0) 
                  ? 'Here are some suggestions based on your transcript:'
                  : 'Or try one of these examples:'}
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
          {conversation.map((turn, index) => (
            <div key={index} className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-primary text-white p-3 rounded-lg max-w-[80%]">
                  {turn.question}
                </div>
              </div>
              
              {turn.answer ? (
                 <div className="flex justify-start">
                    <div className={`${turn.isError ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'} p-3 rounded-lg max-w-[80%]`}>
                      <ChatMarkdownRenderer content={turn.answer} />
                    </div>
                  </div>
              ) : (
                <div className="flex justify-start">
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
                <p className="text-sm text-slate-500 dark:text-slate-400">Suggested follow-ups:</p>
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
                  placeholder="Your question..."
                  rows={1}
                  className="resize-none"
                />
            </div>
            <Button 
                size="md" 
                className="!p-2.5 flex-shrink-0"
                onClick={() => handleAsk(question)}
                disabled={isLoading || !question.trim()}
                aria-label="Send question"
            >
              <Icon name="send" className="h-5 w-5" />
            </Button>
          </div>
        </footer>
      </Card>
    </div>
  );
};
