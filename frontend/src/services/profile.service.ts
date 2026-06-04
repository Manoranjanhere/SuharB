import { api } from './api';

export interface UserPhoto {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface ProfileUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  bio?: string;
  turnOns?: string[];
  turnOffs?: string[];
  role: 'professional' | 'companion';
  subscriptionPlan?: string | null;
  subscriptionTier?: number;
  photos: UserPhoto[];
  primaryPhoto?: string;
  hasLiked: boolean;
  isSuperLike?: boolean;
  complimentMessage?: string | null;
  likedAt?: string;
}

const ProfileService = {
  async getFullProfile(userId: string): Promise<ProfileUser> {
    const { data } = await api.get(`/likes/profile/${userId}`);
    return data;
  },

  async toggleLike(userId: string): Promise<{ liked: boolean; isMatch: boolean }> {
    const { data } = await api.post(`/likes/${userId}`);
    return data;
  },

  async superLike(userId: string, message?: string): Promise<{ liked: boolean; isMatch: boolean }> {
    const { data } = await api.post(`/likes/${userId}/super-like`, { message });
    return data;
  },

  async sendCompliment(userId: string, message: string): Promise<{ liked: boolean; isMatch: boolean }> {
    const { data } = await api.post(`/likes/${userId}/compliment`, { message });
    return data;
  },

  async getYouLiked(page = 1, limit = 20) {
    const { data } = await api.get('/likes/you-liked', { params: { page, limit } });
    return data;
  },

  async getLikedBy(page = 1, limit = 20) {
    const { data } = await api.get('/likes/liked-by', { params: { page, limit } });
    return data;
  },

  async getMatches(page = 1, limit = 20) {
    const { data } = await api.get('/likes/matches', { params: { page, limit } });
    return data;
  },

  async reportUser(userId: string, reason: string, description?: string, reportedPhotoId?: string) {
    const { data } = await api.post(`/reports/${userId}`, {
      reason,
      description,
      reportedPhotoId,
    });
    return data;
  },
};

export default ProfileService;
