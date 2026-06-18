import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AccountSettingsProps } from '../../navigation/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

type Props = AccountSettingsProps;

const HIDE_OPTIONS = [
  { label: '1 Month', months: 1, desc: 'Back in 30 days' },
  { label: '2 Months', months: 2, desc: 'Back in 60 days' },
  { label: '3 Months', months: 3, desc: 'Back in 90 days' },
];

export default function AccountSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { logout, user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [referralCode, setReferralCode] = useState(user?.referralCode || '');

  useEffect(() => {
    const loadReferral = async () => {
      try {
        const { data } = await api.get<{ referralCode: string }>('/users/referral-code');
        setReferralCode(data.referralCode);
        updateUser({ referralCode: data.referralCode });
      } catch {
        /* optional */
      }
    };
    loadReferral();
  }, []);

  const shareReferralCode = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join Sugar BF with my referral code ${referralCode} and get 10 free coins! Download the app and enter the code when you sign up.`,
      });
    } catch {
      Alert.alert('Your referral code', referralCode);
    }
  };

  const performLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleHideProfile = async (months: 1 | 2 | 3) => {
    setLoading(`hide_${months}`);
    try {
      const { data } = await api.patch('/users/profile/hide', { months });
      updateUser({ hiddenUntil: data.hiddenUntil });
      const until = new Date(data.hiddenUntil).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      Alert.alert('Profile Hidden', `Your profile will be hidden until ${until}.\nYou can unhide it anytime from settings.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not hide profile');
    } finally {
      setLoading(null);
    }
  };

  const handleUnhide = async () => {
    setLoading('unhide');
    try {
      await api.patch('/users/profile/unhide');
      updateUser({ hiddenUntil: null });
      Alert.alert('Profile Visible', 'Your profile is now visible in discover.');
    } catch {
      Alert.alert('Error', 'Could not unhide profile');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteModal(false);
    setLoading('delete');
    try {
      await api.delete('/users/account');
      Alert.alert('Account deleted', '', [{ text: 'OK', onPress: performLogout }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not process request');
    } finally {
      setLoading(null);
    }
  };

  const isHidden = user && (user as any).hiddenUntil
    && new Date((user as any).hiddenUntil) > new Date();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile</Text>
        <Text style={styles.sectionDesc}>
          Update your basic details and photos anytime.
        </Text>
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.profileActionBtn}
            onPress={() => navigation.navigate('Stage1')}
          >
            <Text style={styles.profileActionTitle}>Edit Basic Profile</Text>
            <Text style={styles.profileActionDesc}>Name, age, city, role, preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileActionBtn}
            onPress={() => navigation.navigate('Stage2')}
          >
            <Text style={styles.profileActionTitle}>Manage Photos</Text>
            <Text style={styles.profileActionDesc}>Add, remove, and reorder profile photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.profileActionBtn,
              user?.isVerified ? styles.verifiedActionBtn : styles.verifyActionBtn,
            ]}
            onPress={() => navigation.navigate('PhotoVerification')}
          >
            <Text style={styles.profileActionTitle}>
              {user?.isVerified ? 'Photo Verified ✓' : 'Verify Profile Photo'}
            </Text>
            <Text style={styles.profileActionDesc}>
              {user?.isVerified
                ? 'Your account has a verified badge. Re-verify if your photos changed.'
                : 'Upload a selfie to get a verified badge and higher trust.'}
            </Text>
          </TouchableOpacity>

          {user?.isAdmin ? (
            <TouchableOpacity
              style={[styles.profileActionBtn, styles.adminActionBtn]}
              onPress={() => navigation.navigate('AdminPanel')}
            >
              <Text style={styles.profileActionTitle}>
                Admin Panel{user.isSuperAdmin ? ' (Super Admin)' : ''}
              </Text>
              <Text style={styles.profileActionDesc}>
                {user.isSuperAdmin
                  ? 'Reports, bans, push — and promote/remove other admins'
                  : 'Reports, user bans, and marketing push notifications'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Referral */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Referral Code</Text>
        <Text style={styles.sectionDesc}>
          Share your code with friends. They get 10 coins when they sign up, and you earn 10 coins too.
        </Text>
        <View style={styles.referralCard}>
          <Text style={styles.referralCode}>{referralCode || '······'}</Text>
          <TouchableOpacity style={styles.shareReferralBtn} onPress={shareReferralCode} disabled={!referralCode}>
            <Text style={styles.shareReferralBtnText}>Share Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Membership & Coins */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💎 Membership & Coins</Text>
        <Text style={styles.sectionDesc}>
          Subscribe to like and message. Members can buy coins for extra super likes, messages, and compliments.
        </Text>
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={[styles.profileActionBtn, styles.subscriptionActionBtn]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.profileActionTitle}>View Plans & Buy Subscription</Text>
            <Text style={styles.profileActionDesc}>Compare plans and subscribe to unlock likes & messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.profileActionBtn, styles.coinsActionBtn]}
            onPress={() => navigation.navigate('Coins')}
          >
            <Text style={styles.profileActionTitle}>Coins</Text>
            <Text style={styles.profileActionDesc}>Balance, history, and how to use coins on super likes & messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hide Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🙈 Hide My Profile</Text>
        <Text style={styles.sectionDesc}>
          While hidden, your profile won't appear in discover or search.
          {'\n'}Your matches and messages remain accessible.
        </Text>

        {isHidden ? (
          <View style={styles.hiddenBanner}>
            <Text style={styles.hiddenBannerText}>
              🙈 Your profile is currently hidden
            </Text>
            <TouchableOpacity
              style={styles.unhideBtn}
              onPress={handleUnhide}
              disabled={loading === 'unhide'}
            >
              {loading === 'unhide'
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.unhideBtnText}>Make Visible Again</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hideOptions}>
            {HIDE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.months}
                style={styles.hideCard}
                onPress={() => handleHideProfile(opt.months as 1 | 2 | 3)}
                disabled={!!loading}
              >
                {loading === `hide_${opt.months}`
                  ? <ActivityIndicator color={Colors.primary} />
                  : <>
                      <Text style={styles.hideCardTitle}>{opt.label}</Text>
                      <Text style={styles.hideCardDesc}>{opt.desc}</Text>
                    </>
                }
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Privacy Notice */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeIcon}>💡</Text>
        <Text style={styles.noticeText}>
          Hiding your profile doesn't affect existing conversations or matches.
        </Text>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>

        <View style={styles.logoutCard}>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerItemTitle}>Log Out</Text>
            <Text style={styles.dangerItemDesc}>
              Sign out from this device and return to the welcome screen.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() =>
              Alert.alert(
                'Log out?',
                'You can sign back in anytime.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log Out', style: 'destructive', onPress: performLogout },
                ],
              )
            }
          >
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerCard}>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerItemTitle}>Delete My Account & Data</Text>
            <Text style={styles.dangerItemDesc}>
              Permanently removes your profile, photos, messages, and all data.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteModal(true)}
            disabled={loading === 'delete'}
          >
            {loading === 'delete'
              ? <ActivityIndicator color={Colors.error} size="small" />
              : <Text style={styles.deleteBtnText}>Delete</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>🗑️ Delete Account?</Text>
            <Text style={styles.modalText}>
              This will permanently delete your profile, photos, messages, matches, and subscription history. This cannot be undone.
            </Text>

            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.confirmDeleteBtnText}>Yes, Delete My Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setDeleteModal(false)}
            >
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  backBtn: { fontSize: 28, color: Colors.textPrimary },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  sectionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  profileActions: { gap: Spacing.sm },
  profileActionBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  adminActionBtn: {
    borderColor: Colors.secondary,
    backgroundColor: '#1A1500',
  },
  verifyActionBtn: {
    borderColor: Colors.primary,
    backgroundColor: '#1A0010',
  },
  verifiedActionBtn: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(76,175,80,0.12)',
  },
  subscriptionActionBtn: {
    borderColor: Colors.secondary,
    backgroundColor: '#1A1500',
  },
  coinsActionBtn: {
    borderColor: '#5B7CFA',
    backgroundColor: '#101528',
  },
  profileActionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileActionDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: Spacing.md,
  },
  referralCode: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: 4,
    color: Colors.secondary,
    textAlign: 'center',
  },
  shareReferralBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  shareReferralBtnText: { color: '#000', fontWeight: '800', fontSize: FontSize.sm },
  hiddenBanner: {
    backgroundColor: '#1A1500', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.secondary,
    gap: Spacing.md,
  },
  hiddenBannerText: { color: Colors.secondary, fontWeight: '600', fontSize: FontSize.md },
  unhideBtn: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  unhideBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  hideOptions: { flexDirection: 'row', gap: Spacing.sm },
  hideCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  hideCardTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  hideCardDesc: { color: Colors.textMuted, fontSize: FontSize.xs },
  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  noticeIcon: { fontSize: 18 },
  noticeText: { flex: 1, color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 18 },
  dangerSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  dangerTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.error,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md,
  },
  dangerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,59,48,0.05)', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)',
  },
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  dangerInfo: { flex: 1 },
  dangerItemTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md, marginBottom: 4 },
  dangerItemDesc: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  logoutBtn: {
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  logoutBtnText: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.sm },
  deleteBtn: {
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.error,
  },
  deleteBtnText: { color: Colors.error, fontWeight: '700', fontSize: FontSize.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.md },
  modalText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl },
  confirmDeleteBtn: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.full,
    paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.sm,
  },
  confirmDeleteBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelModalBtnText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
