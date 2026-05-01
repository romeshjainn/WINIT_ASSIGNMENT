import { visitService } from '@/services/visit.service';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Status = 'pending' | 'complete' | 'missed' | 'zero_sales';

const STATUS_BADGE: Record<Status, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#60A5FA' },
  complete: { label: 'Visited', color: '#34D399' },
  missed: { label: 'Missed', color: '#F87171' },
  zero_sales: { label: 'Zero Sales', color: '#FBBF24' },
};

const STATUS_COLORS: Record<Status, string> = {
  pending: '#60A5FA',
  complete: '#34D399',
  missed: '#F87171',
  zero_sales: '#FBBF24',
};

export default function RouteDetails() {
  const params = useLocalSearchParams<{
    visitId: string;
    customerId: string;
    name: string;
    customer_code: string;
    address: string;
    contact_number: string;
    location_route: string;
    status: string;
    notes: string;
    sales_order: string;
  }>();

  const [status, setStatus] = useState<Status>((params.status as Status) || 'pending');
  const [notesModal, setNotesModal] = useState(false);
  const [salesModal, setSalesModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [notesInput, setNotesInput] = useState(params.notes || '');
  const [salesInput, setSalesInput] = useState(params.sales_order || '');
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('#34D399');

  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, color: string) => {
    setToastMsg(msg);
    setToastColor(color);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleMarkComplete = async () => {
    try {
      await visitService.markVisited(params.visitId);
      setStatus('complete');
      showToast('Visit marked complete ✓', STATUS_COLORS.complete);
    } catch (e) {
      console.log(e);
    }
  };

  const handleZeroSales = async () => {
    try {
      await visitService.updateStatus(params.visitId, 'zero_sales');
      setStatus('zero_sales');
      showToast('Zero sales recorded ⊘', STATUS_COLORS.zero_sales);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await visitService.updateNotes(params.visitId, notesInput);
      setNotesModal(false);
      showToast('Notes saved ✓', '#60A5FA');
    } catch (e) {
      console.log(e);
    }
  };

  const handleSaveSalesOrder = async () => {
    try {
      await visitService.updateSalesOrder(params.visitId, salesInput);
      setSalesModal(false);
      showToast('Sales order saved ✓', '#60A5FA');
    } catch (e) {
      console.log(e);
    }
  };

  const handleUpdateStatus = async (newStatus: Status) => {
    try {
      await visitService.updateStatus(params.visitId, newStatus);
      setStatus(newStatus);
      setStatusModal(false);
      showToast(`Status updated to ${STATUS_BADGE[newStatus].label}`, STATUS_COLORS[newStatus]);
    } catch (e) {
      console.log(e);
    }
  };

  const badge = STATUS_BADGE[status] ?? { label: status, color: '#9CA3AF' };
  const isDone = status === 'complete' || status === 'zero_sales';

  const toastTranslate = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Customer Detail
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Customer Info Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <Text style={styles.customerName} numberOfLines={2}>
              {params.name}
            </Text>
            <View
              style={[
                styles.badge,
                { borderColor: badge.color + '50', backgroundColor: badge.color + '18' },
              ]}
            >
              <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
              <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={styles.customerCode}>{params.customer_code}</Text>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            {!!params.address && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{params.address}</Text>
              </View>
            )}
            {!!params.contact_number && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📞</Text>
                <Text style={styles.detailText}>{params.contact_number}</Text>
              </View>
            )}
            {!!params.location_route && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🗺️</Text>
                <Text style={styles.detailText}>{params.location_route}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Primary Actions ── */}
        <Text style={styles.actionsLabel}>ACTIONS</Text>

        {!isDone && (
          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.completeBtn]}
              onPress={handleMarkComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnIcon}>✓</Text>
              <Text style={styles.primaryBtnLabel}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.zeroBtn]}
              onPress={handleZeroSales}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnIcon}>⊘</Text>
              <Text style={styles.primaryBtnLabel}>Zero Sales</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Secondary Actions ── */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setNotesModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>📝</Text>
            <Text style={styles.secondaryLabel}>Log Notes</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.sep} />

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setSalesModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>🧾</Text>
            <Text style={styles.secondaryLabel}>Record Sales Order</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.sep} />

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setStatusModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>🔄</Text>
            <Text style={styles.secondaryLabel}>Update Status</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Notes Modal ── */}
      <Modal visible={notesModal} transparent animationType="slide" onRequestClose={() => setNotesModal(false)}>
        <TouchableWithoutFeedback onPress={() => setNotesModal(false)}>
          <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Log Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notesInput}
              onChangeText={setNotesInput}
              placeholder="Enter visit notes…"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNotesModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNotes}
                activeOpacity={0.8}
              >
                <Text style={styles.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Sales Order Modal ── */}
      <Modal visible={salesModal} transparent animationType="slide" onRequestClose={() => setSalesModal(false)}>
        <TouchableWithoutFeedback onPress={() => setSalesModal(false)}>
          <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Record Sales Order</Text>
            <TextInput
              style={styles.textArea}
              value={salesInput}
              onChangeText={setSalesInput}
              placeholder="Enter sales order number or details…"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSalesModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveSalesOrder}
                activeOpacity={0.8}
              >
                <Text style={styles.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Status Modal ── */}
      <Modal visible={statusModal} transparent animationType="slide" onRequestClose={() => setStatusModal(false)}>
        <TouchableWithoutFeedback onPress={() => setStatusModal(false)}>
          <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Update Status</Text>
            {(['pending', 'complete', 'missed', 'zero_sales'] as Status[]).map((s) => {
              const b = STATUS_BADGE[s];
              const isSelected = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusOption,
                    isSelected && { backgroundColor: b.color + '18' },
                  ]}
                  onPress={() => handleUpdateStatus(s)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statusDot, { backgroundColor: b.color }]} />
                  <Text
                    style={[
                      styles.statusOptionLabel,
                      { color: isSelected ? b.color : '#334155' },
                    ]}
                  >
                    {b.label}
                  </Text>
                  {isSelected && (
                    <Text style={[styles.statusCheck, { color: b.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 12 }]}
              onPress={() => setStatusModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Toast ── */}
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: toastColor,
            opacity: toastAnim,
            transform: [{ translateY: toastTranslate }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.toastTxt}>{toastMsg}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 24,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  customerName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  customerCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  detailGrid: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },

  // Actions label
  actionsLabel: {
    fontSize: 9,
    color: '#94A3B8',
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Primary buttons
  primaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 13,
    gap: 7,
    minHeight: 52,
  },
  completeBtn: {
    backgroundColor: '#34D399',
  },
  zeroBtn: {
    backgroundColor: '#FBBF24',
  },
  primaryBtnIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  // Secondary buttons
  secondaryActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    minHeight: 52,
  },
  secondaryIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  secondaryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '300',
  },
  sep: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 46,
  },

  // Modal / Sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  saveTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Status picker
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  statusCheck: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
