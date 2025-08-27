'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { MessageCircle, Clock } from 'lucide-react';
import { socketService } from '@/services/socketService';
import { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ConversationList({ 
  conversations, 
  loading,
  onRefresh
}: ConversationListProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants?.find(p => p._id !== user?._id);
  };

  const handleConversationClick = (conversationId: string) => {
    if (!conversationId) {
      console.error('Conversation ID is undefined');
      return;
    }
    console.log('Navigating to conversation:', conversationId);
    router.push(`/chat/${conversationId}`);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('ar-EG', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInHours < 24 * 7) {
        return date.toLocaleDateString('ar-EG', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('ar-EG', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  // Listen for online status updates
  useEffect(() => {
    const handleUserStatus = (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    socketService.onUserStatus(handleUserStatus);

    return () => {
      socketService.offUserStatus(handleUserStatus);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل المحادثات...</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-lg mb-2">لا توجد محادثات</p>
        <p className="text-sm text-center">
          ابحث عن مستخدم أعلاه لبدء محادثة جديدة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        // Validate conversation data
        if (!conversation || !conversation._id) {
          console.warn('Invalid conversation data:', conversation);
          return null;
        }
        
        const otherParticipant = getOtherParticipant(conversation);
        const hasUnread = (conversation.unreadCount ?? 0) > 0;
        
        return (
          <div
            key={conversation._id}
            onClick={() => handleConversationClick(conversation._id)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors 
                     border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {otherParticipant?.avatarUrl ? (
                  <img
                    src={otherParticipant.avatarUrl}
                    alt={otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                {/* Online status indicator */}
                {otherParticipant && onlineUsers.has(otherParticipant._id) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                
                {/* Unread indicator */}
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                               flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(conversation.unreadCount ?? 0) > 9 ? '9+' : (conversation.unreadCount ?? 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm truncate ${
                    hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                  }`}>
                    {otherParticipant?.name || 'مستخدم غير معروف'}
                  </h3>
                  
                  {conversation.lastMessage?.sentAt && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{formatTime(conversation.lastMessage.sentAt)}</span>
                    </div>
                  )}
                </div>

                {/* Last Message */}
                {conversation.lastMessage ? (
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage.textPreview || 'رسالة'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    لم يتم إرسال رسائل بعد
                  </p>
                )}
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
