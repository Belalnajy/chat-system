import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { SocketEvents } from '@/types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (token && user) {
      // Create socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if no token/user
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [token, user]);

  // Helper functions for common socket operations
  const joinConversation = (conversationId: string) => {
    socket?.emit('join_conversation', conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socket?.emit('leave_conversation', conversationId);
  };

  const sendMessage = (data: {
    conversationId: string;
    type: 'text' | 'image';
    text?: string;
    image?: { url: string; thumbUrl: string };
  }) => {
    socket?.emit('send_message', data);
  };

  const startTyping = (conversationId: string) => {
    socket?.emit('typing_start', conversationId);
  };

  const stopTyping = (conversationId: string) => {
    socket?.emit('typing_stop', conversationId);
  };

  const markAsDelivered = (messageId: string) => {
    socket?.emit('message_delivered', messageId);
  };

  const markAsRead = (messageId: string) => {
    socket?.emit('message_read', messageId);
  };

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsDelivered,
    markAsRead,
  };
};
