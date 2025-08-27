'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSocket, socketService } from '@/services/socketService';
import { apiService } from '@/services/api';
import { Message, User } from '@/types';
import Layout from '@/components/Layout';
import { Send, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket, isConnected, connect, disconnect } = useSocket();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const conversationId = params?.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Online status and typing indicators
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Check hydration status
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Redirect if no conversation ID is provided or invalid
  useEffect(() => {
    console.log('Checking conversation ID:', conversationId);
    
    if (!isHydrated) {
      console.log('Waiting for hydration...');
      return;
    }
    
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      console.error('Invalid or missing conversation ID:', conversationId);
      toast.error('لم يتم العثور على معرف المحادثة');
      router.push('/');
      return;
    }
    
    console.log('Valid conversation ID detected:', conversationId);
  }, [conversationId, router, isHydrated]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Effect running with user:', user ? 'authenticated' : 'not authenticated');
    
    if (!user) {
      console.log('No user, redirecting to auth');
      router.push('/auth');
      return;
    }
    
    // Only load messages if we have a valid conversationId
    if (conversationId && conversationId !== 'undefined' && conversationId !== 'null') {
      console.log('Loading conversation and messages for ID:', conversationId);
      loadConversation();
      loadMessages();
    } else {
      console.error('Invalid conversation ID in messages effect:', conversationId);
      toast.error('معرف المحادثة غير صالح');
      router.push('/');
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [user, isHydrated]); // Remove connect/disconnect from dependencies

  useEffect(() => {
    if (user && isConnected) {
      socket.joinConversation(conversationId);
    }
  }, [user, isConnected, conversationId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const handleUserStatus = (data: any) => {
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

    socket.onMessageReceived(handleNewMessage);
    socket.onUserTyping(handleUserTyping);
    socket.onUserStatus(handleUserStatus);

    return () => {
      socket.offMessageReceived(handleNewMessage);
      socket.offUserTyping(handleUserTyping);
      socket.offUserStatus(handleUserStatus);
    };
  }, [socket, conversationId]);

  const loadConversation = async () => {
    // This function can be used to load conversation details if needed
    // For now, we'll get the other user info from messages
  };

  const loadMessages = async () => {
    console.log('loadMessages called with conversationId:', conversationId);
    
    if (!user) {
      console.error('Cannot load messages - no user');
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/auth');
      return;
    }
    
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      console.error('Cannot load messages - invalid conversationId:', conversationId);
      toast.error('معرف المحادثة غير صالح');
      router.push('/');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching messages for conversation ID:', conversationId);
      
      const response = await apiService.getConversationMessages(conversationId);
      console.log('API Response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }
      
      // The response should be an object with messages and conversation
      const messages = Array.isArray(response.messages) ? response.messages : [];
      const conversation = response.conversation;
      
      console.log('Loaded messages:', messages.length);
      console.log('Conversation data:', conversation);
      
      if (!conversation || !Array.isArray(conversation.participants)) {
        throw new Error('Invalid conversation data');
      }
      
      // Find the other participant in the conversation
      const otherUser = conversation.participants.find((p: User) => p._id !== user._id);
      
      if (!otherUser) {
        console.error('Other user not found in conversation participants');
        toast.error('المستخدم الآخر غير موجود في هذه المحادثة.');
        return;
      }
      
      setOtherUser(otherUser);
      setMessages(messages);
      
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error: unknown) {
      console.error('Error loading messages:', error);
      
      if (error instanceof AxiosError) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          toast.error('انتهت جلستك، يرجى تسجيل الدخول مرة أخرى');
          router.push('/auth');
          return;
        } else if (error.response?.status === 404) {
          toast.error('المحادثة غير موجودة');
          router.push('/');
          return;
        }
      } else if (error instanceof Error) {
        // Something happened in setting up the request
        console.error('Error:', error.message);
        toast.error('حدث خطأ أثناء تحميل المحادثة');
      } else {
        console.error('An unknown error occurred');
        toast.error('حدث خطأ غير معروف');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      // Send via API first
      const response = await apiService.sendMessage({
        conversationId,
        text: newMessage.trim(),
      });
      
      const messageData = response as any;
      
      // Add to local state immediately
      setMessages(prev => [...prev, messageData]);
      
      // Send via socket for real-time delivery
      if (socket) {
        socket.sendMessage({
          conversationId,
          content: newMessage.trim(),
          type: 'text',
        });
      }
      
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('فشل في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const handleTypingStart = () => {
    if (!socket || !user || !otherUser) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.startTyping({
        conversationId,
        userId: user._id,
        userName: user.name
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (!socket || !user || !isTyping) return;
    
    setIsTyping(false);
    socket.stopTyping({
      conversationId,
      userId: user._id,
      userName: user.name
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        <div className="bg-white shadow rounded-lg flex flex-col h-full">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3 space-x-reverse flex-1">
              <div className="flex-shrink-0">
                {otherUser?.avatarUrl ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {otherUser?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {otherUser?.name || 'جاري التحميل...'}
                </h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`w-2 h-2 rounded-full ${
                    otherUser && onlineUsers.has(otherUser._id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                  <p className="text-sm text-gray-500">
                    {otherUser && onlineUsers.has(otherUser._id) 
                      ? 'متصل الآن' 
                      : otherUserTyping 
                        ? 'يكتب...' 
                        : 'غير متصل'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">جاري تحميل الرسائل...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">لا توجد رسائل بعد</p>
                <p className="text-sm text-gray-400 mt-1">ابدأ المحادثة بإرسال رسالة</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex mb-4 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >   
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.type === 'text' ? (
                        <p className="text-sm">{message.text}</p>
                      ) : (
                        <div>
                          <img
                            src={message.image?.url}
                            alt="صورة"
                            className="rounded max-w-full mb-2"
                          />
                        </div>
                      )}
                      <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.sentAt)}
                        {isOwn && (
                          <span className="mr-1">
                            {message.status === 'sent' && '✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'read' && '👁️'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Typing Indicator */}
            {otherUserTyping && (
              <div className="flex justify-start mb-4">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {otherUser?.name} يكتب...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-4 space-x-reverse">
              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="اكتب رسالة..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={sending}
                />
              </div>
              
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
