import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ConversationSidebar } from './ConversationSidebar';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Types
interface ChatTab {
  id: string;
  name: string;
  messages: ChatMessageType[];
  createdAt: Date;
}

interface ChatMessageType {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  adaptiveCard?: any;
}

interface ChatInterfaceProps {
  botId: string;
  personnelData?: any[];
  onSendMessage: (message: string, conversationId: string) => Promise<string>;
  onPollResponse: (conversationId: string, messageId: string) => Promise<any>;
  userName?: string;
  userPhotoUrl?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  botId,
  personnelData = [],
  onSendMessage,
  onPollResponse,
  userName = 'You',
  userPhotoUrl,
}) => {
  // Persistent tabs in localStorage
  const [tabs, setTabs] = useLocalStorage<ChatTab[]>('kb-chat-tabs', []);
  const [activeTabId, setActiveTabId] = useLocalStorage<string | null>('kb-active-tab', null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [tabs, activeTabId]);

  // Initialize with one tab if empty
  useEffect(() => {
    if (tabs.length === 0) {
      const newTab: ChatTab = {
        id: generateId(),
        name: 'Conversation 1',
        messages: [],
        createdAt: new Date(),
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id);
    }
  }, []);

  // Generate unique ID
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Create new tab
  const handleCreateTab = () => {
    const newTab: ChatTab = {
      id: generateId(),
      name: `Conversation ${tabs.length + 1}`,
      messages: [],
      createdAt: new Date(),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  // Close tab
  const handleCloseTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    // If closing active tab, switch to another
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  // Rename tab
  const handleRenameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
  };

  // Handle sending message
  const handleSendMessage = async (message: string) => {
    if (!activeTab) return;

    // Add user message
    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    const updatedMessages = [...activeTab.messages, userMessage];
    updateTabMessages(activeTab.id, updatedMessages);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to bot
      const response = await onSendMessage(message, activeTab.id);

      // Poll for bot response
      const botResponse = await onPollResponse(activeTab.id, userMessage.id);

      // Add bot message
      const botMessage: ChatMessageType = {
        id: generateId(),
        role: 'bot',
        content: botResponse.message || response,
        timestamp: new Date(),
        adaptiveCard: botResponse.adaptiveCard,
      };

      updateTabMessages(activeTab.id, [...updatedMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessageType = {
        id: generateId(),
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      updateTabMessages(activeTab.id, [...updatedMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Update tab messages
  const updateTabMessages = (tabId: string, messages: ChatMessageType[]) => {
    setTabs(
      tabs.map((tab) =>
        tab.id === tabId ? { ...tab, messages } : tab
      )
    );
  };

  return (
    <div className="flex h-full overflow-x-hidden">
      {/* Conversation Sidebar - Desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0 overflow-hidden max-w-[20rem]">
        <ConversationSidebar
          conversations={tabs}
          activeConversationId={activeTabId}
          onSelectConversation={(id) => {
            setActiveTabId(id);
          }}
          onCreateConversation={handleCreateTab}
          onRenameConversation={handleRenameTab}
          onDeleteConversation={handleCloseTab}
        />
      </div>

      {/* Conversation Sidebar - Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw]">
            <ConversationSidebar
              conversations={tabs}
              activeConversationId={activeTabId}
              onSelectConversation={(id) => {
                setActiveTabId(id);
                setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              onCreateConversation={() => {
                handleCreateTab();
                setIsMobileSidebarOpen(false);
              }}
              onRenameConversation={handleRenameTab}
              onDeleteConversation={handleCloseTab}
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Mobile Menu Toggle */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Mobile Menu Toggle */}
          <Button
            onClick={() => setIsMobileSidebarOpen(true)}
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Open conversations"
          >
            <Icon name="menu" className="w-5 h-5" />
          </Button>

          {/* Active Conversation Name */}
          <h2 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white truncate">
            {activeTab?.name || 'Chat'}
          </h2>

          {/* New Conversation Button */}
          <Button
            onClick={handleCreateTab}
            variant="ghost"
            size="sm"
            aria-label="New conversation"
          >
            <Icon name="plus" className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-50 dark:bg-gray-900">
          {activeTab && activeTab.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Icon name="chat-bubble" className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start a Conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Ask questions about personnel data, departments, roles, and more. I'm here to help!
              </p>
            </div>
          )}

          {activeTab?.messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              adaptiveCard={message.adaptiveCard}
              userName={userName}
              userPhotoUrl={userPhotoUrl}
            />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {activeTab && (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            placeholder="Ask a question about personnel data..."
          />
        )}
      </div>
    </div>
  );
};
