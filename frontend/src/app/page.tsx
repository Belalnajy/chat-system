'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import { useSocket } from '@/services/socketService';
import { Conversation } from '@/types';
import Layout from '@/components/Layout';
import UserSearch from '@/components/UserSearch';
import ConversationList from '@/components/ConversationList';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InboxPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { connect, disconnect, socket } = useSocket();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Define loadConversations function with useCallback to prevent unnecessary re-renders
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const conversations = await apiService.getConversations();
      setConversations(conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('فشل في تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  }, []);

  // Define startConversation function with useCallback
  const startConversation = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const conversation = await apiService.createConversation(userId);
      
      if (!conversation?._id) {
        console.error('Invalid conversation response:', conversation);
        throw new Error('Invalid conversation response');
      }
      
      console.log('Created new conversation with ID:', conversation._id);
      // Navigate to the new conversation
      router.push(`/chat/${conversation._id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsub();
    };
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth');
    } else if (isHydrated && user) {
      loadConversations();
    }
  }, [isHydrated, user, router, loadConversations]);

  // Socket connection - only connect once when user is available
  useEffect(() => {
    if (user && isHydrated) {
      connect();
      
      return () => {
        disconnect();
      };
    }
  }, [user, isHydrated]); // Remove connect/disconnect from dependencies

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Update conversation list when new message arrives
      setConversations(prev => 
        prev.map(conv => 
          conv._id === data.conversationId 
            ? { ...conv, lastMessage: data.message, lastMessageAt: new Date() }
            : conv
        )
      );
    };

    socket.onMessageReceived(handleNewMessage);

    return () => {
      socket.offMessageReceived(handleNewMessage);
    };
  }, [socket]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  if (!isHydrated) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
              <button
                onClick={loadConversations}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User Search */}
          <UserSearch onStartConversation={startConversation} />

          {/* Conversations List */}
          <ConversationList 
            conversations={conversations}
            loading={loading}
            onRefresh={loadConversations}
          />
        </div>
      </div>
    </Layout>
  );
}
