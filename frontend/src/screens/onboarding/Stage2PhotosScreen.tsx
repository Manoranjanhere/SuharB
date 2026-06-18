import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { api } from '../../services/api';
import { appendImageToFormData } from '../../utils/photoUpload';
import { useAuthStore } from '../../store/auth.store';
import type { Stage2ScreenProps } from '../../navigation/types';

type Props = Stage2ScreenProps;

interface PhotoSlot {
  uri?: string;
  uploading?: boolean;
  uploaded?: boolean;
  id?: string;
}

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;

export default function Stage2PhotosScreen({ navigation }: Props) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    Array.from({ length: MAX_PHOTOS }, () => ({})),
  );
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    loadExistingPhotos();
  }, []);

  const loadExistingPhotos = async () => {
    setLoadingExisting(true);
    try {
      const { data } = await api.get('/users/profile/photos');
      const slots: PhotoSlot[] = Array.from({ length: MAX_PHOTOS }, () => ({}));
      (data || []).forEach((photo: any) => {
        const index = typeof photo.order === 'number' ? photo.order : 0;
        if (index >= 0 && index < MAX_PHOTOS) {
          slots[index] = {
            uri: photo.url,
            uploaded: true,
            id: photo.id,
          };
        }
      });
      setPhotos(slots);
    } catch {
      // Keep empty slots if loading existing photos fails.
    } finally {
      setLoadingExisting(false);
    }
  };

  const uploadedCount = photos.filter((p) => p.uploaded).length;
  const canContinue = uploadedCount >= MIN_PHOTOS;

const UPLOAD_TIMEOUT_MS = 60000;

  const uploadPhotoToServer = async (asset: Asset, index: number) => {
    const formData = new FormData();
    appendImageToFormData(formData, 'photo', asset, `photo_${index}`);
    formData.append('order', String(index));
    return api.post('/users/profile/photos', formData, { timeout: UPLOAD_TIMEOUT_MS });
  };

  const pickAndUpload = async (index: number) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];

    // Mark as uploading
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { uri: asset.uri, uploading: true };
      return updated;
    });

    try {
      let data: { id: string } | undefined;
      let lastError: unknown;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
          const response = await uploadPhotoToServer(asset, index);
          data = response.data;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!data) {
        throw lastError;
      }

      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = { uri: asset.uri, uploaded: true, id: data.id };
        return updated;
      });
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message || 'Try again');
      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = {};
        return updated;
      });
    }
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (!photo.id) return;

    try {
      await api.delete(`/users/profile/photos/${photo.id}`);
      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = {};
        return updated;
      });
    } catch {
      Alert.alert('Error', 'Could not remove photo');
    }
  };

  const handleFinish = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      updateUser({ profileStage: 2 });
      navigation.replace('Main');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <Text style={styles.progressStepTextDone}>✓</Text>
          </View>
          <View style={[styles.progressLine, { backgroundColor: Colors.primary }]} />
          <View style={[styles.progressStep, styles.progressActive]}>
            <Text style={styles.progressStepText}>2</Text>
          </View>
        </View>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Your first photo is your profile photo.{'\n'}
          Add up to 6 — more photos = more matches 🔥
        </Text>
      </View>

      {/* Photo Grid */}
      {loadingExisting && (
        <View style={styles.loadingExistingRow}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingExistingText}>Loading your existing photos...</Text>
        </View>
      )}
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoSlotWrapper}>
            <TouchableOpacity
              style={[
                styles.photoSlot,
                photo.uploaded && styles.photoSlotFilled,
                index === 0 && styles.photoSlotPrimary,
              ]}
              onPress={() => !photo.uploading && !photo.uploaded && pickAndUpload(index)}
              activeOpacity={0.8}
            >
              {photo.uploading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : photo.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>+</Text>
                  {index === 0 && (
                    <Text style={styles.photoPlaceholderLabel}>Main photo</Text>
                  )}
                </View>
              )}

              {/* Badge for primary */}
              {index === 0 && photo.uploaded && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>MAIN</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Remove / Replace overlay */}
            {photo.uploaded && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Photo count */}
      <Text style={styles.photoCount}>
        {uploadedCount} / {MAX_PHOTOS} photos added
      </Text>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📸 Tips for great matches</Text>
        {[
          'Clear face shot as your first photo',
          'Show your personality and lifestyle',
          'Avoid group photos or sunglasses',
          'Natural light works best',
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipDot}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        onPress={handleFinish}
        disabled={!canContinue || saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueBtnText}>
            {canContinue ? "Let's Go! 🎉" : `Add at least ${MIN_PHOTOS} photo`}
          </Text>
        )}
      </TouchableOpacity>

      {canContinue && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleFinish}
        >
          <Text style={styles.skipBtnText}>Add more later</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.lg },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  progressStepText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  progressStepTextDone: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.sm },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoSlotWrapper: { position: 'relative' },
  loadingExistingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  loadingExistingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  photoSlot: {
    width: 110,
    height: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoSlotPrimary: {
    width: 230,
    height: 290,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  photoPlaceholder: { alignItems: 'center', gap: 4 },
  photoPlaceholderIcon: {
    fontSize: 28,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  photoPlaceholderLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  primaryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  photoCount: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  tipsContainer: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  tipDot: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  tipText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm },
  skipBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
