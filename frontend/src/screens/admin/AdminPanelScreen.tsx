import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminPanelProps } from '../../navigation/types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { api } from '../../services/api';

type Props = AdminPanelProps;

type Tab = 'dashboard' | 'reports' | 'users' | 'bans' | 'notifications';

interface Stats { totalUsers: number; activeUsers: number; pendingReports: number; bannedUsers: number; verifiedUsers: number; bannedIdentities: number; }

export default function AdminPanelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Marketing notification state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifCity, setNotifCity] = useState('');
  const [notifCountry, setNotifCountry] = useState('');
  const [notifGender, setNotifGender] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  // Ban identity state
  const [banType, setBanType] = useState<'ip' | 'phone' | 'email'>('phone');
  const [banValue, setBanValue] = useState('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  const loadTab = async (tab: Tab) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } else if (tab === 'reports') {
        const { data } = await api.get('/admin/reports?status=pending&limit=30');
        setReports(data.reports);
      } else if (tab === 'users') {
        const { data } = await api.get(`/admin/users?limit=30${search ? `&search=${search}` : ''}`);
        setUsers(data.users);
      } else if (tab === 'bans') {
        const { data } = await api.get('/admin/bans?limit=50');
        setBans(data.bans);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleReportAction = async (reportId: string, action: string) => {
    setActionLoading(reportId + action);
    try {
      await api.patch(`/admin/reports/${reportId}/action`, { action });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      Alert.alert('Done', `Action "${action}" applied`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const handleUserAction = async (userId: string, action: string, userName: string) => {
    Alert.alert(`${action} ${userName}?`, `Apply action: ${action}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', style: action === 'ban' || action === 'delete' ? 'destructive' : 'default',
        onPress: async () => {
          setActionLoading(userId + action);
          try {
            await api.patch(`/admin/users/${userId}/action`, { action });
            await loadTab('users');
            Alert.alert('Done', `${action} applied to ${userName}`);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed');
          } finally { setActionLoading(null); }
        },
      },
    ]);
  };

  const handleSendResetLink = async (userId: string, userName: string) => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`);
      Alert.alert('Link Sent', `Password reset link sent to ${userName}'s email`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No email on file');
    }
  };

  const handleAddBan = async () => {
    if (!banValue.trim()) return;
    setActionLoading('add_ban');
    try {
      await api.post('/admin/bans', { type: banType, value: banValue.trim(), reason: banReason.trim() });
      setBanValue(''); setBanReason('');
      await loadTab('bans');
      Alert.alert('Banned', `${banType} "${banValue}" has been banned`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const handleRemoveBan = async (banId: string) => {
    await api.delete(`/admin/bans/${banId}`);
    setBans((prev) => prev.filter((b) => b.id !== banId));
  };

  const sendMarketingNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('Required', 'Title and body are required');
      return;
    }
    setNotifSending(true);
    try {
      const payload: any = { title: notifTitle, body: notifBody };
      if (notifCity) payload.city = notifCity;
      if (notifCountry) payload.country = notifCountry;
      if (notifGender) payload.gender = notifGender;
      const { data } = await api.post('/admin/notifications/push', payload);
      Alert.alert('Sent!', `Notification sent to ${data.sent} devices`);
      setNotifTitle(''); setNotifBody(''); setNotifCity(''); setNotifCountry(''); setNotifGender('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send');
    } finally { setNotifSending(false); }
  };

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: 'dashboard', label: 'Stats', emoji: '📊' },
    { key: 'reports', label: 'Reports', emoji: '🚩' },
    { key: 'users', label: 'Users', emoji: '👥' },
    { key: 'bans', label: 'Bans', emoji: '🚫' },
    { key: 'notifications', label: 'Push', emoji: '📣' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Dashboard ─────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && stats && (
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Users', value: stats.totalUsers, emoji: '👥' },
                { label: 'Active', value: stats.activeUsers, emoji: '✅' },
                { label: 'Pending Reports', value: stats.pendingReports, emoji: '🚩', alert: stats.pendingReports > 0 },
                { label: 'Banned Users', value: stats.bannedUsers, emoji: '🚫' },
                { label: 'Verified', value: stats.verifiedUsers, emoji: '✅' },
                { label: 'Banned IDs', value: stats.bannedIdentities, emoji: '⛔' },
              ].map((stat) => (
                <View key={stat.label} style={[styles.statCard, stat.alert && styles.statCardAlert]}>
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.statValue, stat.alert && styles.statValueAlert]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Reports ───────────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            reports.length === 0
              ? <View style={styles.empty}><Text style={styles.emptyText}>No pending reports 🎉</Text></View>
              : reports.map((r) => (
                <View key={r.id} style={styles.reportCard}>
                  <Text style={styles.reportReason}>Reason: <Text style={styles.reportReasonValue}>{r.reason}</Text></Text>
                  <Text style={styles.reportMeta}>Reporter: {r.reporter?.name} → Reported: {r.reportedUser?.name}</Text>
                  {r.reportedPhotoId && <Text style={styles.reportPhotoNote}>📸 Specific photo reported</Text>}
                  <View style={styles.reportActions}>
                    {['dismiss', 'warn_user', 'remove_photo', 'ban_user'].map((action) => (
                      <TouchableOpacity
                        key={action}
                        style={[styles.actionChip, action === 'ban_user' && styles.actionChipDanger]}
                        onPress={() => handleReportAction(r.id, action)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === r.id + action
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.actionChipText}>{action.replace('_', ' ')}</Text>
                        }
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
          )}

          {/* ── Users ─────────────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name, email, phone..."
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={() => loadTab('users')}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={() => loadTab('users')}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
              {users.map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userCardLeft}>
                    <Text style={styles.userName}>{u.name || 'No name'} {u.isBanned ? '🚫' : ''} {u.isAdmin ? '👑' : ''}</Text>
                    <Text style={styles.userMeta}>{u.email || u.phone || '—'}</Text>
                    <Text style={styles.userMeta}>{u.city}, {u.country} • {u.role}</Text>
                    <Text style={styles.userId} numberOfLines={1}>ID: {u.id}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity style={styles.userActionBtn} onPress={() => handleSendResetLink(u.id, u.name)}>
                      <Text style={styles.userActionBtnText}>🔑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.userActionBtn, u.isBanned && styles.userActionBtnActive]}
                      onPress={() => handleUserAction(u.id, u.isBanned ? 'unban' : 'ban', u.name)}
                    >
                      <Text style={styles.userActionBtnText}>{u.isBanned ? '🔓' : '🚫'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.userActionBtn, styles.userActionBtnDanger]} onPress={() => handleUserAction(u.id, 'delete', u.name)}>
                      <Text style={styles.userActionBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── Bans ──────────────────────────────────────────────────────── */}
          {activeTab === 'bans' && (
            <>
              <View style={styles.banAddSection}>
                <Text style={styles.sectionTitle}>Add New Ban</Text>
                <View style={styles.banTypeRow}>
                  {(['phone', 'email', 'ip'] as const).map((t) => (
                    <TouchableOpacity key={t} style={[styles.banTypeChip, banType === t && styles.banTypeChipActive]} onPress={() => setBanType(t)}>
                      <Text style={[styles.banTypeText, banType === t && styles.banTypeTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.banInput} value={banValue} onChangeText={setBanValue} placeholder={`Enter ${banType}...`} placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                <TextInput style={styles.banInput} value={banReason} onChangeText={setBanReason} placeholder="Reason (optional)" placeholderTextColor={Colors.textMuted} />
                <TouchableOpacity style={styles.banAddBtn} onPress={handleAddBan} disabled={actionLoading === 'add_ban'}>
                  {actionLoading === 'add_ban' ? <ActivityIndicator color="#fff" /> : <Text style={styles.banAddBtnText}>+ Add Ban</Text>}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Active Bans ({bans.length})</Text>
              {bans.map((ban) => (
                <View key={ban.id} style={styles.banRow}>
                  <View style={styles.banInfo}>
                    <Text style={styles.banType}>{ban.type.toUpperCase()}</Text>
                    <Text style={styles.banValue}>{ban.value}</Text>
                    {ban.reason && <Text style={styles.banReason}>{ban.reason}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveBan(ban.id)}>
                    <Text style={styles.banLiftText}>Lift</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* ── Marketing Notifications ───────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <View style={styles.notifSection}>
              <Text style={styles.sectionTitle}>📣 Send Marketing Push Notification</Text>
              <Text style={styles.sectionSubtitle}>Target users by location, gender, or role. Leave blank to send to everyone.</Text>

              {[
                { label: 'Title *', value: notifTitle, onChange: setNotifTitle, placeholder: '10 new Rich guys joined near you! 🔥' },
                { label: 'Message *', value: notifBody, onChange: setNotifBody, placeholder: "Check who's nearby and start chatting!" },
                { label: 'City', value: notifCity, onChange: setNotifCity, placeholder: 'e.g. Mumbai (or leave blank)' },
                { label: 'Country', value: notifCountry, onChange: setNotifCountry, placeholder: 'e.g. India (or leave blank)' },
              ].map((field) => (
                <View key={field.label} style={styles.notifField}>
                  <Text style={styles.notifLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.notifInput}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              ))}

              <View style={styles.notifField}>
                <Text style={styles.notifLabel}>Gender Filter</Text>
                <View style={styles.filterChipRow}>
                  {[{ label: 'All', value: '' }, { label: '👨 Men', value: 'male' }, { label: '👩 Women', value: 'female' }].map((g) => (
                    <TouchableOpacity key={g.label} style={[styles.filterChip, notifGender === g.value && styles.filterChipActive]} onPress={() => setNotifGender(g.value)}>
                      <Text style={[styles.filterChipText, notifGender === g.value && styles.filterChipTextActive]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.sendNotifBtn, notifSending && styles.sendNotifBtnDisabled]} onPress={sendMarketingNotification} disabled={notifSending}>
                {notifSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendNotifBtnText}>Send Notification →</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { fontSize: 28, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  tabBar: { borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 52 },
  tabBarContent: { paddingHorizontal: Spacing.sm, gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  tabActive: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  statCardAlert: { borderColor: Colors.error },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  statValueAlert: { color: Colors.error },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  reportCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  reportReason: { color: Colors.textSecondary, fontSize: FontSize.sm },
  reportReasonValue: { color: Colors.primary, fontWeight: '700' },
  reportMeta: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  reportPhotoNote: { color: Colors.secondary, fontSize: FontSize.xs, marginTop: 4 },
  reportActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  actionChip: { backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  actionChipDanger: { borderColor: Colors.error },
  actionChipText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  searchInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, fontSize: FontSize.sm },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  userCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  userCardLeft: { flex: 1 },
  userName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  userMeta: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  userId: { color: Colors.textMuted, fontSize: 9, marginTop: 4, fontFamily: 'monospace' },
  userActions: { gap: 4 },
  userActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  userActionBtnActive: { borderColor: Colors.primary },
  userActionBtnDanger: { borderColor: Colors.error },
  userActionBtnText: { fontSize: 14 },
  banAddSection: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  banTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  banTypeChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  banTypeChipActive: { borderColor: Colors.primary, backgroundColor: '#1A0010' },
  banTypeText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  banTypeTextActive: { color: Colors.primary, fontWeight: '700' },
  banInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, fontSize: FontSize.sm },
  banAddBtn: { backgroundColor: Colors.error, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center' },
  banAddBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  banRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  banInfo: { flex: 1 },
  banType: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },
  banValue: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  banReason: { color: Colors.textMuted, fontSize: FontSize.xs },
  banLiftText: { color: '#4CAF50', fontWeight: '700', fontSize: FontSize.sm },
  notifSection: { gap: Spacing.md },
  notifField: { gap: Spacing.xs },
  notifLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  notifInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, fontSize: FontSize.sm },
  filterChipRow: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: '#1A0010' },
  filterChipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },
  sendNotifBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm },
  sendNotifBtnDisabled: { opacity: 0.5 },
  sendNotifBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.lg },
});
