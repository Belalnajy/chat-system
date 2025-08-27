import { Request } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../models/User';

// User type with string _id for API responses
export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'local' | 'google' | 'github';
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  toJSON(): any;
}

// Simple AuthRequest interface
export interface AuthRequest {
  user?: AuthUser;
  userId?: string;
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  file?: any;
  files?: any[];
}

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// User types
export interface UserData {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

// Conversation types
export interface ConversationData {
  _id: string;
  participants: UserData[];
  lastMessage?: MessageData;
  lastMessageAt?: Date;
  unreadCount?: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface MessageData {
  _id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image';
  text?: string;
  image?: {
    url: string;
    filename: string;
    size: number;
  };
  status: 'sent' | 'delivered' | 'read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Socket event types
export interface SocketEvents {
  // Client to server events
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (messageData: {
    conversationId: string;
    type: 'text' | 'image';
    text?: string;
    image?: File;
  }) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;

  // Server to client events
  message_received: (message: MessageData) => void;
  message_status_updated: (messageId: string, status: string) => void;
  user_typing: (data: { userId: string; conversationId: string }) => void;
  user_stopped_typing: (data: { userId: string; conversationId: string }) => void;
  conversation_updated: (conversation: ConversationData) => void;
}

// Validation schemas types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface SendMessageData {
  conversationId: string;
  text?: string;
  type?: 'text' | 'image';
}

export interface CreateConversationData {
  participantId: string;
}

export interface UpdateMessageStatusData {
  status: 'delivered' | 'read';
}
