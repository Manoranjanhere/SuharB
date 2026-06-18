import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView, Animated,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PhotoVerificationProps } from '../../navigation/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { postFormData } from '../../services/api';
import { appendImageToFormData } from '../../utils/photoUpload';
import { useAuthStore } from '../../store/auth.store';

type Props = PhotoVerificationProps;

type VerifyStatus = 'idle' | 'uploading' | 'verified' | 'failed';

export default function PhotoVerificationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const takeSelfie = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 1,
      cameraType: 'front',
      saveToPhotos: false,
    });

    if (result.didCancel || !result.assets?.[0]) return;
    setSelfieUri(result.assets[0].uri!);
    setStatus('idle');
    setMessage('');
  };

  const submitVerification = async () => {
    if (!selfieUri) return;
    setStatus('uploading');

    try {
      const formData = new FormData();
      appendImageToFormData(formData, 'selfie', { uri: selfieUri, type: 'image/jpeg' }, 'selfie');

      const { data } = await postFormData('/users/verify/selfie', formData, {
        timeout: 60000,
      });

      setStatus(data.status === 'verified' ? 'verified' : 'failed');
      setConfidence(data.confidence || null);
      setMessage(data.message);

      if (data.status === 'verified') {
        updateUser({ isVerified: true } as any);
      }
    } catch (err: any) {
      setStatus('failed');
      setMessage(err?.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  const StatusIcon = () => {
    if (status === 'verified') return <Text style={styles.statusIcon}>✅</Text>;
    if (status === 'failed') return <Text style={styles.statusIcon}>❌</Text>;
    return null;
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Verify Your Photo</Text>
          <Text style={styles.subtitle}>Get a ✅ verified badge on your profile</Text>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howSection}>
        <Text style={styles.howTitle}>How it works</Text>
        {[
          { icon: '📸', step: '1', text: 'Take a clear selfie or upload one' },
          { icon: '🤖', step: '2', text: 'Our AI compares your selfie with your profile photo' },
          { icon: '✅', step: '3', text: 'Get verified — boosts your visibility & trust' },
        ].map((item) => (
          <View key={item.step} style={styles.howRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{item.step}</Text>
            </View>
            <Text style={styles.stepIcon}>{item.icon}</Text>
            <Text style={styles.howRowText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Selfie capture area */}
      <View style={styles.selfieArea}>
        {selfieUri ? (
          <View style={styles.selfiePreviewContainer}>
            <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
            {status === 'verified' && (
              <View style={styles.verifiedOverlay}>
                <Text style={styles.verifiedOverlayText}>✅ Verified!</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.selfiePlaceholder}>
            <Text style={styles.selfiePlaceholderIcon}>🤳</Text>
            <Text style={styles.selfiePlaceholderText}>Take a selfie</Text>
          </View>
        )}

        {/* Capture buttons */}
        <View style={styles.captureButtons}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={takeSelfie}
          >
            <Text style={styles.captureBtnIcon}>📷</Text>
            <Text style={styles.captureBtnText}>Take Selfie</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>📌 Tips for best results</Text>
        {[
          'Look directly at the camera',
          'Good lighting — no dark backgrounds',
          'Remove sunglasses or face masks',
          'Use same face angle as your profile photo',
        ].map((tip) => (
          <Text key={tip} style={styles.tipItem}>• {tip}</Text>
        ))}
      </View>

      {/* Status result */}
      {status !== 'idle' && status !== 'uploading' && (
        <View style={[
          styles.resultBox,
          status === 'verified' ? styles.resultBoxSuccess : styles.resultBoxFail,
        ]}>
          <StatusIcon />
          <Text style={[
            styles.resultText,
            status === 'verified' ? styles.resultTextSuccess : styles.resultTextFail,
          ]}>
            {message}
          </Text>
          {confidence !== null && (
            <Text style={styles.confidenceText}>
              Face match confidence: {confidence}%
            </Text>
          )}
        </View>
      )}

      {/* Submit button */}
      {selfieUri && status !== 'verified' && (
        <TouchableOpacity
          style={[styles.submitBtn, status === 'uploading' && styles.submitBtnDisabled]}
          onPress={submitVerification}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitBtnText}>Analyzing with AI...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>
              {status === 'failed' ? 'Try Again 🔄' : 'Verify Now →'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {status === 'verified' && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneBtnText}>Done ✓</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  backBtn: { fontSize: 28, color: Colors.textPrimary, marginTop: -2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  howSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  howTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md,
  },
  howRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepIcon: { fontSize: 20 },
  howRowText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },

  selfieArea: {
    paddingHorizontal: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg,
  },
  selfiePreviewContainer: { position: 'relative', marginBottom: Spacing.lg },
  selfiePreview: {
    width: 220, height: 280, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.primary,
  },
  verifiedOverlay: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    alignItems: 'center',
  },
  verifiedOverlayText: {
    backgroundColor: 'rgba(76,175,80,0.9)',
    color: '#fff', fontWeight: '800', fontSize: FontSize.md,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  selfiePlaceholder: {
    width: 220, height: 280, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  selfiePlaceholderIcon: { fontSize: 56 },
  selfiePlaceholderText: { color: Colors.textMuted, fontSize: FontSize.sm },
  captureButtons: { flexDirection: 'row', gap: Spacing.md },
  captureBtn: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  captureBtnIcon: { fontSize: 28 },
  captureBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  tipsBox: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  tipsTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md, marginBottom: Spacing.sm },
  tipItem: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 24 },

  resultBox: {
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm,
  },
  resultBoxSuccess: { backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50' },
  resultBoxFail: { backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: Colors.error },
  statusIcon: { fontSize: 40 },
  resultText: { fontSize: FontSize.md, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  resultTextSuccess: { color: '#4CAF50' },
  resultTextFail: { color: Colors.error },
  confidenceText: { color: Colors.textMuted, fontSize: FontSize.sm },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, marginHorizontal: Spacing.lg, alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  uploadingRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  doneBtn: {
    backgroundColor: '#4CAF50', borderRadius: BorderRadius.full,
    paddingVertical: 16, marginHorizontal: Spacing.lg, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
