// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Message Types
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image';
  text?: string;
  image?: {
    url: string;
    thumbUrl: string;
    originalName: string;
    size: number;
  };
  status: 'sent' | 'delivered' | 'read';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

// Conversation Types
export interface Conversation {
  _id: string;
  type: 'one_to_one';
  participants: User[];
  lastMessage?: {
    messageId: string;
    textPreview: string;
    sentAt: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Socket Event Types
export interface SocketEvents {
  // Client to Server
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: {
    conversationId: string;
    type: 'text' | 'image';
    text?: string;
    image?: { url: string; thumbUrl: string };
  }) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
  message_delivered: (messageId: string) => void;
  message_read: (messageId: string) => void;

  // Server to Client
  message_received: (message: Message) => void;
  message_status_update: (data: { messageId: string; status: string; timestamp: string }) => void;
  user_typing: (data: { userId: string; conversationId: string }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  conversation_updated: (conversation: Conversation) => void;
}
