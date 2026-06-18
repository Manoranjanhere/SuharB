import { api } from './api';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface DiscoverFilters {
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'other';
  role?: 'professional' | 'companion';
  minAllowance?: number;
  /** Filter female / companion profiles by weekly allowance expectation (INR) */
  weeklyAllowanceFilter?: number;
  accommodationType?: string;
  verifiedOnly?: boolean;
}

export interface NearbyUser {
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
  distance: number;
  photos: { id: string; url: string; order: number }[];
  primaryPhoto?: string;
}

const DiscoverService = {
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted';
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'SugarBF needs your location to show nearby members.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  },

  getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });
  },

  async updateLocation(): Promise<boolean> {
    try {
      const hasPermission = await DiscoverService.requestLocationPermission();
      if (!hasPermission) return false;
      const coords = await DiscoverService.getCurrentPosition();
      await api.patch('/discover/location', coords);
      return true;
    } catch {
      // Silent — location is optional
      return false;
    }
  },

  async getNearby(filters: DiscoverFilters = {}, page = 1): Promise<{
    users: NearbyUser[];
    total: number;
    pages: number;
  }> {
    const { data } = await api.get('/discover/nearby', {
      params: { ...filters, page, limit: 10 },
    });
    return data;
  },

  async passUser(userId: string): Promise<void> {
    await api.post(`/discover/pass/${userId}`);
  },
};

export default DiscoverService;
