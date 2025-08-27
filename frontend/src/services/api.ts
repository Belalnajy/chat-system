import { useAuthStore } from '@/stores/authStore';
import { Conversation, Message, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private getAuthHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      const responseData = await response.json();
      // Backend returns { success: true, data: ... }
      if (responseData.success && responseData.data !== undefined) {
        return responseData.data as T;
      }
      // Fallback for responses without data field
      return responseData as T;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    };

    const response = await fetch(url, config);
    return this.handleResponse(response);
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }

  async register(credentials: { email: string; password: string; name: string }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  // Users endpoints
  async searchUsers(query: string): Promise<User[]> {
    try {
      console.log('Searching for users with query:', query);
      const result = await this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
      console.log('Search result:', result);
      return result;
    } catch (error) {
      console.error('Search users API error:', error);
      throw error;
    }
  }

  async updateProfile(data: { name?: string; bio?: string; avatarUrl?: string }): Promise<User> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserById(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const conversations = await this.request<Conversation[]>('/conversations');
      console.log('API getConversations response:', conversations);
      
      // Validate each conversation has required fields
      if (Array.isArray(conversations)) {
        conversations.forEach((conv, index) => {
          if (!conv._id) {
            console.error(`Conversation at index ${index} missing _id:`, conv);
          }
        });
      }
      
      return conversations || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${conversationId}`);
  }

  async createConversation(participantId: string): Promise<Conversation> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  async getConversationMessages(conversationId: string): Promise<{ messages: Message[]; conversation: Conversation }> {
    return this.request<{ messages: Message[]; conversation: Conversation }>(`/conversations/${conversationId}/messages`);
  }

  // Messages
  async sendMessage(data: { conversationId: string; text?: string; image?: File }) {
    if (data.image) {
      const formData = new FormData();
      formData.append('conversationId', data.conversationId);
      formData.append('image', data.image);
      if (data.text) formData.append('text', data.text);
      
      return this.request('/messages', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it for FormData
      });
    } else {
      return this.request('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE_URL}/api/messages/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/messages/${messageId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'read' }),
    });
  }
}

export const apiService = new ApiService();
