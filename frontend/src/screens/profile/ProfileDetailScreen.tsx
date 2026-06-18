import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Animated,
  TextInput,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProfileDetailScreenProps } from '../../navigation/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import ProfileService, { ProfileUser, UserPhoto } from '../../services/profile.service';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { getInteractionAccess, showSubscribeRequiredAlert, showTierUpgradeRequiredAlert, showPaymentOrCoinError } from '../../utils/subscription';
import { useFeatureFlagsStore } from '../../store/featureFlags.store';
import { useAppCountry } from '../../hooks/useAppCountry';

const PLAN_LABELS: Record<string, string> = {
  silver: '🥈 Silver', gold: '🥇 Gold', platinum: '💎 Platinum',
  rich: '💰 Rich', very_rich: '💎 Very Rich', super_rich: '👑 Super Rich',
};
const getPlanBadgeLabel = (planId: string) => PLAN_LABELS[planId] || '';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_H * 0.62;

type Props = ProfileDetailScreenProps;

const REPORT_REASONS = [
  { label: 'Fake Profile', value: 'fake_profile' },
  { label: 'Inappropriate Photo', value: 'inappropriate_photo' },
  { label: 'Spam', value: 'spam' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Underage', value: 'underage' },
  { label: 'Other', value: 'other' },
];

export default function ProfileDetailScreen({ navigation, route }: Props) {
  const { userId } = route.params as { userId: string };
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const paidFeaturesDisabled = useFeatureFlagsStore((s) => s.paidFeaturesDisabled);
  const { formatWeeklyAllowance } = useAppCountry();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [reportModal, setReportModal] = useState(false);
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [complimentModal, setComplimentModal] = useState(false);
  const [complimentText, setComplimentText] = useState('');
  const [complimentSending, setComplimentSending] = useState(false);
  const [superLikeLoading, setSuperLikeLoading] = useState(false);
  const [interactionToast, setInteractionToast] = useState<{ title: string; message: string } | null>(null);

  const heartScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionAccess = profile
    ? getInteractionAccess(authUser, profile.subscriptionTier ?? 0, { paidFeaturesDisabled })
    : 'need_subscribe';
  const photoListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const showInteractionToast = (title: string, message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setInteractionToast({ title, message });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setInteractionToast(null));
    }, 2600);
  };

  const loadProfile = async () => {
    try {
      const data = await ProfileService.getFullProfile(userId);
      setProfile(data);
      setLiked(data.hasLiked);
    } catch {
      Alert.alert('Error', 'Could not load profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading || !profile) return;
    if (interactionAccess === 'need_subscribe') {
      showSubscribeRequiredAlert(navigation, 'like profiles');
      return;
    }
    if (interactionAccess === 'need_upgrade') {
      showTierUpgradeRequiredAlert(navigation);
      return;
    }
    setLikeLoading(true);

    // Animate heart
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      const res = await ProfileService.toggleLike(userId);
      setLiked(res.liked);
      if (res.isMatch) {
        showInteractionToast("It's a Match! 🎉", `You and ${profile.name} both liked each other`);
      }
    } catch {
      Alert.alert('Error', 'Could not update like');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSuperLike = async () => {
    if (superLikeLoading || !profile) return;
    if (interactionAccess === 'need_subscribe') {
      showSubscribeRequiredAlert(navigation, 'super like profiles');
      return;
    }
    if (interactionAccess === 'need_upgrade') {
      showTierUpgradeRequiredAlert(navigation);
      return;
    }
    setSuperLikeLoading(true);
    try {
      const res = await ProfileService.superLike(userId);
      setLiked(res.liked);
      if (res.isMatch) {
        showInteractionToast("It's a Match! 🎉", `You and ${profile.name} both liked each other`);
      } else {
        showInteractionToast('Super liked ⭐', `You super-liked ${profile.name}`);
      }
    } catch (err) {
      showPaymentOrCoinError(navigation, err, 'super like this profile');
    } finally {
      setSuperLikeLoading(false);
    }
  };

  const handleSendCompliment = async () => {
    if (interactionAccess === 'need_subscribe') {
      showSubscribeRequiredAlert(navigation, 'send compliments');
      return;
    }
    if (interactionAccess === 'need_upgrade') {
      showTierUpgradeRequiredAlert(navigation);
      return;
    }
    const message = complimentText.trim();
    if (!message) {
      Alert.alert('Compliment required', 'Please write a message before sending.');
      return;
    }
    if (complimentSending) return;

    setComplimentSending(true);
    try {
      const res = await ProfileService.sendCompliment(userId, message);
      setLiked(res.liked);
      setComplimentModal(false);
      setComplimentText('');
      if (res.isMatch) {
        showInteractionToast("It's a Match! 🎉", `You and ${profile?.name || 'this member'} both liked each other`);
      } else {
        showInteractionToast('Compliment sent 💝', `Your message was sent to ${profile?.name || 'this member'}`);
      }
    } catch (err: any) {
      Alert.alert('Could not send', err?.response?.data?.message || 'Please try again');
    } finally {
      setComplimentSending(false);
    }
  };

  const handleBlock = async () => {
    Alert.alert(
      isBlocked ? 'Unblock User' : 'Block User',
      isBlocked
        ? `Unblock ${profile?.name}? They will be able to appear in discover again.`
        : `Block ${profile?.name}? They won't appear in discover and can't message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setBlockLoading(true);
            try {
              const { data } = await api.post(`/blocks/${userId}`);
              setIsBlocked(data.blocked);
              if (data.blocked) navigation.goBack();
            } catch { /* silent */ }
            finally { setBlockLoading(false); }
          },
        },
      ],
    );
  };

  const handleReport = async (reason: string) => {
    setReportSubmitting(true);
    try {
      await ProfileService.reportUser(
        userId,
        reason,
        undefined,
        reportPhotoId || undefined,
      );
      setReportModal(false);
      setReportPhotoId(null);
      Alert.alert('Reported', 'Thank you. Our team will review this report.');
    } catch {
      Alert.alert('Error', 'Could not submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const openReportForPhoto = (photoId: string) => {
    setReportPhotoId(photoId);
    setReportModal(true);
  };

  const onPhotoScroll = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActivePhotoIndex(index);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) return null;

  const photos = profile.photos?.length > 0
    ? profile.photos
    : [{ id: 'placeholder', url: '', order: 0, isPrimary: true }];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {interactionToast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.interactionToast,
            {
              top: insets.top + 14,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.interactionToastTitle}>{interactionToast.title}</Text>
          <Text style={styles.interactionToastText}>{interactionToast.message}</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        stickyHeaderIndices={[0]}
      >
        {/* ── Photos Section (sticky) ── */}
        <View style={[styles.photoSection, { height: PHOTO_HEIGHT }]}>
          {/* Photo Pager */}
          <FlatList
            ref={photoListRef}
            data={photos}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={styles.photoSlide}>
                {item.url ? (
                  <FastImage
                    source={{ uri: item.url, priority: FastImage.priority.high }}
                    style={styles.photo}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  </View>
                )}

                {/* Photo action buttons */}
                {item.url && (
                  <TouchableOpacity
                    style={styles.photoReportBtn}
                    onPress={() => openReportForPhoto(item.id)}
                  >
                    <Text style={styles.photoReportIcon}>⚑</Text>
                  </TouchableOpacity>
                )}

                {/* Gradient overlay at bottom */}
                <View style={styles.photoGradient} />
              </View>
            )}
          />

          {/* Dot indicators */}
          {photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activePhotoIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Name / Age / City overlay on photo */}
          <View style={styles.photoOverlayInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{profile.name}</Text>
            <Text style={styles.ageText}>{profile.age}</Text>
            {(profile as any).photoVerifiedStatus === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✅</Text>
              </View>
            )}
          </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{profile.city}, {profile.country}</Text>
              <View style={styles.genderBadge}>
                <Text style={styles.genderText}>
                  {profile.gender === 'male' ? '♂' : profile.gender === 'female' ? '♀' : '⚧'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          {/* Report */}
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => { setReportPhotoId(null); setReportModal(true); }}
          >
            <Text style={styles.actionBtnSecondaryIcon}>🚩</Text>
          </TouchableOpacity>

          {/* Block */}
          <TouchableOpacity
            style={[styles.actionBtnSecondary, isBlocked && styles.actionBtnBlocked]}
            onPress={handleBlock}
            disabled={blockLoading}
          >
            {blockLoading
              ? <ActivityIndicator color={Colors.error} size="small" />
              : <Text style={styles.actionBtnSecondaryIcon}>{isBlocked ? '🔓' : '🚫'}</Text>
            }
          </TouchableOpacity>

          {/* Like */}
          {interactionAccess === 'allowed' ? (
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <TouchableOpacity
                style={[styles.likeBtn, liked && styles.likeBtnActive]}
                onPress={handleLike}
                disabled={likeLoading}
              >
                {likeLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.likeBtnIcon}>{liked ? '❤️' : '🤍'}</Text>
                }
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => (
                interactionAccess === 'need_upgrade'
                  ? showTierUpgradeRequiredAlert(navigation)
                  : showSubscribeRequiredAlert(navigation, 'like profiles')
              )}
            >
              <Text style={styles.actionBtnSecondaryIcon}>❤️</Text>
            </TouchableOpacity>
          )}

          {/* Super like */}
          {interactionAccess === 'allowed' && (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={handleSuperLike}
              disabled={superLikeLoading}
            >
              {superLikeLoading
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.actionBtnSecondaryIcon}>⭐</Text>}
            </TouchableOpacity>
          )}

          {/* Compliment */}
          {interactionAccess === 'allowed' && (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => setComplimentModal(true)}
            >
              <Text style={styles.actionBtnSecondaryIcon}>💝</Text>
            </TouchableOpacity>
          )}

          {/* Message */}
          {interactionAccess === 'allowed' ? (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => navigation.navigate('ChatConversation', {
                userId: profile.id,
                userName: profile.name,
              })}
            >
              <Text style={styles.actionBtnSecondaryIcon}>💬</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => (
                interactionAccess === 'need_upgrade'
                  ? showTierUpgradeRequiredAlert(navigation)
                  : showSubscribeRequiredAlert(navigation, 'send messages')
              )}
            >
              <Text style={styles.actionBtnSecondaryIcon}>💬</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Profile Details ── */}
        <View style={styles.detailsContainer}>

          {/* Role + Plan badges */}
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {profile.role === 'professional' ? '💼 Professional' : '✨ Lifestyle Seeker'}
              </Text>
            </View>
            {(profile as any).subscriptionPlan && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>
                  {getPlanBadgeLabel((profile as any).subscriptionPlan)}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* Turn Ons */}
          {profile.turnOns?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Turn Ons 🔥</Text>
              <View style={styles.tagsRow}>
                {profile.turnOns.map((item, i) => (
                  <View key={i} style={[styles.tag, styles.tagOn]}>
                    <Text style={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Turn Offs */}
          {profile.turnOffs?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Turn Offs ❄️</Text>
              <View style={styles.tagsRow}>
                {profile.turnOffs.map((item, i) => (
                  <View key={i} style={[styles.tag, styles.tagOff]}>
                    <Text style={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Lifestyle Details */}
          {(
            (profile as any).weeklyAllowanceExpectation ||
            (profile as any).canProvideAllowance ||
            (profile as any).canProvideAccommodation
          ) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle 💎</Text>
              <View style={styles.lifestyleGrid}>
                {/* Female expectation */}
                {(profile as any).weeklyAllowanceExpectation && (
                  <View style={styles.lifestyleCard}>
                    <Text style={styles.lifestyleIcon}>💰</Text>
                    <Text style={styles.lifestyleLabel}>Allowance Expected</Text>
                    <Text style={styles.lifestyleValue}>
                      {formatWeeklyAllowance((profile as any).weeklyAllowanceExpectation as number)}
                    </Text>
                  </View>
                )}

                {/* Male offer */}
                {(profile as any).canProvideAllowance && (
                  <View style={styles.lifestyleCard}>
                    <Text style={styles.lifestyleIcon}>💸</Text>
                    <Text style={styles.lifestyleLabel}>Weekly Allowance</Text>
                    <Text style={styles.lifestyleValue}>
                      {(profile as any).weeklyAllowanceAmount
                        ? formatWeeklyAllowance((profile as any).weeklyAllowanceAmount as number)
                        : 'Open to discuss'}
                    </Text>
                  </View>
                )}
                {(profile as any).canProvideAllowance === false && (
                  <View style={styles.lifestyleCard}>
                    <Text style={styles.lifestyleIcon}>💸</Text>
                    <Text style={styles.lifestyleLabel}>Weekly Allowance</Text>
                    <Text style={[styles.lifestyleValue, { color: Colors.textMuted }]}>Not offering</Text>
                  </View>
                )}

                {/* Accommodation */}
                {(profile as any).canProvideAccommodation && (
                  <View style={styles.lifestyleCard}>
                    <Text style={styles.lifestyleIcon}>🏠</Text>
                    <Text style={styles.lifestyleLabel}>Accommodation</Text>
                    <Text style={styles.lifestyleValue}>
                      {(profile as any).accommodationType === 'live_in' ? 'Live-in' : 'Independent Room'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>

      {/* ── Compliment Modal ── */}
      <Modal
        visible={complimentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setComplimentModal(false)}
      >
        <View style={styles.complimentBackdrop}>
          <View style={styles.complimentCard}>
            <Text style={styles.complimentTitle}>Send a Compliment 💝</Text>
            <Text style={styles.complimentSubtitle}>
              Add a thoughtful message with your like.
            </Text>
            <TextInput
              style={styles.complimentInput}
              value={complimentText}
              onChangeText={setComplimentText}
              placeholder="Write your compliment..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={255}
              textAlignVertical="top"
            />
            <Text style={styles.complimentCounter}>{complimentText.length}/255</Text>
            <View style={styles.complimentActions}>
              <TouchableOpacity
                style={styles.complimentCancelBtn}
                onPress={() => setComplimentModal(false)}
                disabled={complimentSending}
              >
                <Text style={styles.complimentCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.complimentSendBtn}
                onPress={handleSendCompliment}
                disabled={complimentSending}
              >
                {complimentSending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.complimentSendText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Report Modal ── */}
      <Modal
        visible={reportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setReportModal(false)}
        />
        <View style={[styles.reportSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.reportHandle} />
          <Text style={styles.reportTitle}>
            {reportPhotoId ? 'Report this photo' : `Report ${profile.name}`}
          </Text>
          <Text style={styles.reportSubtitle}>Why are you reporting?</Text>

          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={styles.reportOption}
              onPress={() => handleReport(r.value)}
              disabled={reportSubmitting}
            >
              <Text style={styles.reportOptionText}>{r.label}</Text>
              {reportSubmitting
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.reportOptionArrow}>›</Text>
              }
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.reportCancel}
            onPress={() => setReportModal(false)}
          >
            <Text style={styles.reportCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  interactionToast: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: '#1A1500',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  interactionToastTitle: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  interactionToastText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  // Photos
  photoSection: { width: SCREEN_W, overflow: 'hidden' },
  photoSlide: { width: SCREEN_W, height: PHOTO_HEIGHT },
  photo: { width: SCREEN_W, height: PHOTO_HEIGHT },
  photoPlaceholder: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderIcon: { fontSize: 64 },
  photoGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'transparent',
    // Simulated gradient via multiple layers
  },
  dotsContainer: {
    position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff', width: 20, borderRadius: 3 },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 28, lineHeight: 34, marginTop: -2 },
  photoReportBtn: {
    position: 'absolute', top: 60, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoReportIcon: { fontSize: 16 },
  photoOverlayInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 4 },
  nameText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  ageText: { fontSize: 24, fontWeight: '400', color: 'rgba(255,255,255,0.85)', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationIcon: { fontSize: 13 },
  locationText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  genderBadge: {
    marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  genderText: { color: '#fff', fontSize: 12 },

  // Action row
  actionsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, gap: Spacing.xl,
    backgroundColor: Colors.background,
  },
  likeBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  likeBtnActive: { backgroundColor: '#3D0020', borderColor: Colors.primary },
  likeBtnIcon: { fontSize: 28 },
  actionBtnSecondary: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnBlocked: { borderColor: Colors.error, backgroundColor: 'rgba(255,59,48,0.1)' },
  actionBtnSecondaryIcon: { fontSize: 20 },

  // Details
  detailsContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg },
  roleBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  roleBadgeText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  planBadge: {
    backgroundColor: '#1A0010',
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  planBadgeText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  bioText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 24 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1,
  },
  tagOn: { backgroundColor: '#1A0010', borderColor: Colors.primary },
  tagOff: { backgroundColor: '#0A0A1A', borderColor: '#3A3A6A' },
  tagText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  verifiedBadge: { marginBottom: 4 },
  verifiedBadgeText: { fontSize: 20 },
  lifestyleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  lifestyleCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, minWidth: 140, flex: 1,
    alignItems: 'center', gap: 4,
  },
  lifestyleIcon: { fontSize: 24 },
  lifestyleLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  lifestyleValue: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.sm, textAlign: 'center' },

  // Compliment Modal
  complimentBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  complimentCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
  },
  complimentTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  complimentSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  complimentInput: {
    minHeight: 110,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  complimentCounter: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 6,
    textAlign: 'right',
  },
  complimentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  complimentCancelBtn: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  complimentCancelText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  complimentSendBtn: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  complimentSendText: {
    color: '#fff',
    fontWeight: '800',
  },

  // Report Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  reportSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  reportHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  reportTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  reportSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  reportOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  reportOptionText: { fontSize: FontSize.md, color: Colors.textPrimary },
  reportOptionArrow: { fontSize: 20, color: Colors.textMuted },
  reportCancel: {
    marginTop: Spacing.lg, alignItems: 'center', paddingVertical: 12,
  },
  reportCancelText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
});
