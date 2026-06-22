import { api } from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  kind?: 'text' | 'compliment' | string;
  readAt?: string | null;
  createdAt: string;
}

export interface InboxConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  primaryPhoto?: string | null;
}

const MessageService = {
  getRealtimeBaseUrl(): string {
    const base = api.defaults.baseURL || '';
    return base.replace(/\/api\/v1$/, '');
  },

  async getInbox(): Promise<{ conversations: InboxConversation[] }> {
    const { data } = await api.get('/messages/inbox');
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>('/messages/unread-count');
    return data.count;
  },

  async getConversation(recipientId: string, page = 1, limit = 30): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { data } = await api.get(`/messages/${recipientId}`, { params: { page, limit } });
    return data;
  },

  async sendMessage(recipientId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.post(`/messages/${recipientId}`, { content });
    return data;
  },
};

export default MessageService;
