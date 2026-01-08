import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';

// Types
interface ChatTab {
  id: string;
  name: string;
  messages: any[];
  createdAt: Date;
}

interface ConversationSidebarProps {
  conversations: ChatTab[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onRenameConversation: (id: string, newName: string) => void;
  onDeleteConversation: (id: string) => void;
  onClose?: () => void; // For mobile overlay
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'date'>('recent');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    conversationName: string;
  }>({
    isOpen: false,
    conversationId: null,
    conversationName: '',
  });

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter((conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort conversations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // Most recent message first (use createdAt as proxy)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [conversations, searchQuery, sortBy]);

  // Start editing conversation name
  const handleStartRename = (conversation: ChatTab) => {
    setEditingId(conversation.id);
    setEditingName(conversation.name);
  };

  // Save renamed conversation
  const handleSaveRename = () => {
    if (editingId && editingName.trim()) {
      onRenameConversation(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  // Cancel rename
  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Handle delete click - open confirmation modal
  const handleDeleteClick = (conversation: ChatTab) => {
    setDeleteConfirm({
      isOpen: true,
      conversationId: conversation.id,
      conversationName: conversation.name,
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (deleteConfirm.conversationId) {
      onDeleteConversation(deleteConfirm.conversationId);
    }
    setDeleteConfirm({
      isOpen: false,
      conversationId: null,
      conversationName: '',
    });
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const conversationDate = new Date(date);
    const diffInMs = now.getTime() - conversationDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return conversationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return conversationDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return conversationDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Conversations
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateConversation}
            variant="ghost"
            size="sm"
            aria-label="New conversation"
          >
            <Icon name="plus" className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'date')}
          className="text-xs border-0 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-0 cursor-pointer"
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="date">Date Created</option>
        </select>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Icon name="chat-bubble" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button
                onClick={onCreateConversation}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isEditing = editingId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={`group relative mb-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => !isEditing && onSelectConversation(conversation.id)}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-primary-600" />
                    )}

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      {/* Conversation Name */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleSaveRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename();
                            } else if (e.key === 'Escape') {
                              handleCancelRename();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-2 py-1 text-sm font-medium border border-primary-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <h3
                          className={`text-sm font-medium truncate ${
                            isActive
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-gray-900 dark:text-white'
                          }`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(conversation);
                          }}
                          title="Double-click to rename"
                        >
                          {conversation.name}
                        </h3>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(conversation.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(conversation);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label="Rename conversation"
                        title="Rename"
                      >
                        <Icon name="edit" className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conversation);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label="Delete conversation"
                        title="Delete"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            conversationId: null,
            conversationName: '',
          })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Conversation?"
        message={`Are you sure you want to delete "${deleteConfirm.conversationName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        confirmButtonVariant="danger"
      />
    </div>
  );
};
