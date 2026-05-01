import { Ionicons } from '@expo/vector-icons';
import { journeyService } from '@/services/journey.service';
import { logout } from '@/store/authSlice';
import { RootState } from '@/store/index';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// ─── Types ────────────────────────────────────────────────
type Visit = {
  id: string;
  name: string;
  customer_code: string;
  customer_id: string;
  status: 'pending' | 'complete' | 'missed' | 'zero_sales';
  address?: string;
  contact_number?: string;
  location_route?: string;
  notes?: string | null;
  sales_order?: string | null;
};

type Plan = {
  route_name: string;
  date: string;
  visits: Visit[];
};

// ─── Config ───────────────────────────────────────────────
const TABS = ['Pending', 'Visited', 'Missed', 'Zero Sales'] as const;
type Tab = (typeof TABS)[number];

const STATUS_MAP: Record<Tab, string> = {
  Pending: 'pending',
  Visited: 'complete',
  Missed: 'missed',
  'Zero Sales': 'zero_sales',
};

const TAB_META: Record<Tab, { color: string; bg: string; dim: string; icon: string }> = {
  Pending: { color: '#60A5FA', bg: '#1E3A5F', dim: '#141F33', icon: '◷' },
  Visited: { color: '#34D399', bg: '#0F3D2A', dim: '#0A241A', icon: '✓' },
  Missed: { color: '#F87171', bg: '#3D1515', dim: '#220D0D', icon: '✕' },
  'Zero Sales': { color: '#FBBF24', bg: '#3D2A08', dim: '#221806', icon: '⊘' },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#60A5FA' },
  complete: { label: 'Visited', color: '#34D399' },
  missed: { label: 'Missed', color: '#F87171' },
  zero_sales: { label: 'Zero Sales', color: '#FBBF24' },
};

// ─── Component ────────────────────────────────────────────
export default function Home() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Pending');
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const lastRefreshRef = useRef(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const loadSpinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'VS';

  const fetchPlan = async (isRefresh = false) => {
    if (isRefresh) {
      const now = Date.now();
      if (now - lastRefreshRef.current < 2500 || refreshing) return;
      lastRefreshRef.current = now;
      setRefreshing(true);
      spinAnim.setValue(0);
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      );
      spinLoopRef.current.start();
    } else {
      setLoading(true);
    }
    const t0 = Date.now();
    try {
      const res = await journeyService.getTodayPlan();
      setPlan(res);
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      if (isRefresh) {
        const elapsed = Date.now() - t0;
        if (elapsed < 700) await new Promise(r => setTimeout(r, 700 - elapsed));
        spinLoopRef.current?.stop();
        spinLoopRef.current = null;
        spinAnim.setValue(0);
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlan(false);
    }, []),
  );

  useEffect(() => {
    if (loading) {
      loadSpinAnim.setValue(0);
      Animated.loop(
        Animated.timing(loadSpinAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ).start();
    } else {
      loadSpinAnim.stopAnimation();
    }
  }, [loading]);

  const handleLogout = async () => {
    dispatch(logout());
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  };

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = plan != null && plan.date < today;

  const visits: Visit[] = (plan?.visits || []).map((v) =>
    isExpired && v.status === 'pending' ? { ...v, status: 'missed' as const } : v,
  );

  const counts = TABS.reduce(
    (acc, tab) => {
      acc[tab] = visits.filter((v) => v.status === STATUS_MAP[tab]).length;
      return acc;
    },
    {} as Record<Tab, number>,
  );

  const total = visits.length;
  const done = counts['Visited'];
  const left = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const filteredVisits = visits
    .filter((v) => v.status === STATUS_MAP[activeTab])
    .filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  const meta = TAB_META[activeTab];
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reloadDisabled = loading || refreshing;

  // ── Loading ──
  if (loading) {
    const loadSpin = loadSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
      <SafeAreaView style={styles.loadWrap}>
        <Animated.Text style={[styles.loadSpinner, { transform: [{ rotate: loadSpin }] }]}>
          ↻
        </Animated.Text>
        <Text style={styles.loadText}>FETCHING ROUTE…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>TODAY'S ROUTE</Text>
          <Text style={styles.routeName} numberOfLines={1}>
            {plan?.route_name || 'Route Overview'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.reloadBtn, reloadDisabled && { opacity: 0.35 }]}
          onPress={() => fetchPlan(true)}
          disabled={reloadDisabled}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={20} color="#2563EB" />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatar} onPress={() => setShowMenu(v => !v)} activeOpacity={0.7}>
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.progressPct}>{pct}% complete</Text>
      </View>

      {/* ── Summary Strip ── */}
      <View style={styles.summaryRow}>
        {(
          [
            { label: 'TOTAL', value: total, color: '#CBD5E1' },
            { label: 'VISITED', value: done, color: '#34D399' },
            { label: 'LEFT', value: left, color: '#F87171' },
          ] as const
        ).map(({ label, value, color }, i) => (
          <View key={label} style={[styles.summaryCard, i < 2 && styles.summaryDivider]}>
            <Text style={[styles.summaryVal, { color }]}>{value}</Text>
            <Text style={styles.summaryLbl}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const m = TAB_META[tab];
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                isActive ? { backgroundColor: m.bg, borderColor: m.color } : styles.tabIdle,
              ]}
            >
              <Text style={[styles.tabIcon, { color: isActive ? m.color : '#3A3A55' }]}>
                {m.icon}
              </Text>
              <Text style={[styles.tabLabel, { color: isActive ? m.color : '#555570' }]}>
                {tab}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: isActive ? m.color : '#E2E8F0' }]}>
                <Text style={[styles.tabBadgeTxt, { color: isActive ? '#0D0D14' : '#475569' }]}>
                  {counts[tab]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer or address…"
          placeholderTextColor="#2E2E48"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: meta.color }]} />
        <Text style={[styles.sectionTitle, { color: meta.color }]}>{activeTab}</Text>
        <View style={[styles.sectionPill, { backgroundColor: meta.dim }]}>
          <Text style={[styles.sectionPillTxt, { color: meta.color }]}>
            {filteredVisits.length} stops
          </Text>
        </View>
      </View>

      {/* ── Visits List ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredVisits.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyCircle, { backgroundColor: meta.dim }]}>
              <Text style={[styles.emptyIconTxt, { color: meta.color }]}>{meta.icon}</Text>
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} stops</Text>
            <Text style={styles.emptyBody}>
              {search.length > 0
                ? 'No results match your search.'
                : 'Stops in this category will appear here.'}
            </Text>
          </View>
        ) : (
          filteredVisits.map((item, idx) => {
            const badge = STATUS_BADGE[item.status] ?? { label: item.status, color: '#9CA3AF' };
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.72}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/route-details',
                    params: {
                      visitId: item.id,
                      customerId: item.customer_id,
                      name: item.name,
                      customer_code: item.customer_code,
                      address: item.address || '',
                      contact_number: item.contact_number || '',
                      location_route: item.location_route || '',
                      status: item.status,
                      notes: item.notes || '',
                      sales_order: item.sales_order || '',
                    },
                  })
                }
              >
                <View style={[styles.cardStripe, { backgroundColor: meta.color }]} />

                <View style={[styles.cardNum, { backgroundColor: meta.dim }]}>
                  <Text style={[styles.cardNumTxt, { color: meta.color }]}>
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardCode}>{item.customer_code}</Text>
                  {item.address ? (
                    <Text style={styles.cardAddr} numberOfLines={1}>
                      📍 {item.address}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.cardBadge,
                    { borderColor: badge.color + '40', backgroundColor: badge.color + '15' },
                  ]}
                >
                  <View style={[styles.cardDot, { backgroundColor: badge.color }]} />
                  <Text style={[styles.cardBadgeTxt, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showMenu && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 99 }]}
            onPress={() => setShowMenu(false)}
            activeOpacity={0}
          />
          <View style={styles.menuCard}>
            <Text style={styles.menuName} numberOfLines={1}>
              {user?.name || 'Van Sales User'}
            </Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuLogoutBtn}
              onPress={() => { setShowMenu(false); handleLogout(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuLogoutTxt}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Loading
  loadWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadSpinner: {
    fontSize: 44,
    color: '#2563EB',
    fontWeight: '700',
    lineHeight: 50,
  },
  loadText: {
    color: '#94A3B8',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
  },
  eyebrow: {
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  routeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#CBD5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Progress
  progressWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 5,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 10,
    color: '#10B981',
    letterSpacing: 1,
    fontWeight: '600',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
  },
  summaryDivider: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  summaryVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#0F172A',
  },
  summaryLbl: {
    fontSize: 9,
    color: '#94A3B8',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },

  // Tabs
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 14,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    gap: 5,
  },
  tabIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  tabIcon: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
    color: '#475569',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: '#334155',
  },
  tabBadge: {
    minWidth: 18,
    height: 17,
    borderRadius: 5,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
  },
  tabBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 20,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  searchClear: {
    fontSize: 11,
    color: '#94A3B8',
    padding: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 15,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
    color: '#0F172A',
  },
  sectionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  sectionPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#475569',
  },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20 },

  // Empty
  emptyWrap: {
    marginTop: 52,
    alignItems: 'center',
    gap: 10,
  },
  emptyCircle: {
    width: 68,
    height: 68,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#E2E8F0',
  },
  emptyIconTxt: {
    fontSize: 28,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  emptyBody: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },

  // Avatar dropdown menu
  menuCard: {
    position: 'absolute',
    top: 58,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 170,
    overflow: 'hidden',
    zIndex: 100,
  },
  menuName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  menuLogoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuLogoutTxt: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 9,
    overflow: 'hidden',
    gap: 11,
    paddingRight: 12,
    paddingVertical: 12,
  },
  cardStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  cardNum: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cardNumTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#0F172A',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardCode: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  cardAddr: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cardDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  cardBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#334155',
  },
});
