import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import AddToTripSheet from '../../components/transport/AddToTripSheet';
import colors from '../../constants/colors';
import { getTransportSchedulesApi, getTransportsApi } from '../../api/transportApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  SCHEDULE_TYPES,
  formatDateLabel,
  formatDuration,
  formatLkr,
  getBookingActionLabel,
  getBookingChannelMeta,
  getStatusMeta,
  getTransportTypeMeta
} from '../../utils/transportOptions';

const TYPE_FILTERS = ['all', ...SCHEDULE_TYPES];
const POPULAR_ROUTE_LIMIT = 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POPULAR_CARD_WIDTH = Math.min(390, Math.max(300, SCREEN_WIDTH - 44));

/* ─── TypeChip ─── */
const TypeChip = React.memo(({ value, active, onPress }) => {
  const meta = value === 'all'
    ? { label: 'All', icon: 'apps-outline', color: colors.primary }
    : getTransportTypeMeta(value);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typeChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
    >
      <Ionicons name={meta.icon} size={14} color={active ? colors.white : meta.color} />
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {meta.shortLabel || meta.label}
      </Text>
    </Pressable>
  );
});

/* ─── Transport Log Modal ─── */
const TransportLogModal = ({ visible, logs, onClose, onEdit }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
          <View style={styles.modalHandle} />
          <View style={styles.logModalHeader}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.logModalTitle}>My Transport Log</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {logs.length ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {logs.map((item) => {
                const typeMeta = getTransportTypeMeta(item.type);
                const statusMeta = getStatusMeta(item.status);
                const cost = Number(item.actualCost || item.estimatedCost || 0);
                return (
                  <Pressable key={item._id} style={styles.logCard} onPress={() => onEdit(item)}>
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: typeMeta.color }} />
                    <View style={[styles.logCardIcon, { backgroundColor: `${typeMeta.color}15` }]}>
                      <Ionicons name={typeMeta.icon} size={18} color={typeMeta.color} />
                    </View>
                    <View style={styles.logCardBody}>
                      <Text style={styles.logCardRoute} numberOfLines={1}>
                        {item.fromLocation} → {item.toLocation}
                      </Text>
                      <Text style={styles.logCardSub} numberOfLines={1}>
                        {[formatDateLabel(item.departureDate), item.provider].filter(Boolean).join(' · ') || typeMeta.label}
                      </Text>
                    </View>
                    <View style={styles.logCardRight}>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.color}16` }]}>
                        <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                      </View>
                      {cost > 0 ? <Text style={styles.logCardCost}>{formatLkr(cost)}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.logModalEmpty}>
              <Ionicons name="ticket-outline" size={36} color={colors.border} />
              <Text style={styles.logModalEmptyTitle}>No trips logged yet</Text>
              <Text style={styles.logModalEmptySub}>Your transport history will appear here.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

/* ─── Route Detail Modal ─── */
export const RouteDetailModal = ({ item, onClose, onAddToTrip }) => {
  const insets = useSafeAreaInsets();
  if (!item) return null;
  const meta = getTransportTypeMeta(item.type);
  const bookingMeta = getBookingChannelMeta(item.bookingChannel);

  const InfoRow = ({ icon, label, value, color: c }) => (
    value ? (
      <View style={styles.detailInfoRow}>
        <Ionicons name={icon} size={15} color={c || colors.primary} />
        <View style={styles.detailInfoText}>
          <Text style={styles.detailInfoLabel}>{label}</Text>
          <Text style={styles.detailInfoValue}>{value}</Text>
        </View>
      </View>
    ) : null
  );

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
          <View style={styles.modalHandle} />
          <View style={[styles.modalHeader, { borderLeftColor: meta.color }]}>
            <View style={[styles.modalTypeTag, { backgroundColor: `${meta.color}15` }]}>
              <Ionicons name={meta.icon} size={13} color={meta.color} />
              <Text style={[styles.modalTypeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.modalProvider}>{item.provider}</Text>
            {item.serviceClass ? <Text style={styles.modalServiceClass}>{item.serviceClass}</Text> : null}
            {item.routeName || item.routeNo ? (
              <Text style={styles.modalRouteName}>
                {[item.routeNo, item.routeName].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <Pressable style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.detailTicket, { borderColor: `${meta.color}30` }]}>
              <View style={styles.detailTicketSide}>
                <Text style={styles.detailTime}>{item.departureTime || '--:--'}</Text>
                <Text style={styles.detailStation} numberOfLines={3}>{item.departureStation}</Text>
              </View>
              <View style={styles.detailTicketMid}>
                <View style={styles.detailDotFrom} />
                <View style={[styles.detailLine, { backgroundColor: meta.color }]} />
                <Ionicons name={meta.icon} size={20} color={meta.color} />
                <View style={[styles.detailLine, { backgroundColor: meta.color }]} />
                <View style={[styles.detailDotTo, { backgroundColor: meta.color }]} />
                <Text style={[styles.detailDuration, { color: meta.color }]}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
              <View style={[styles.detailTicketSide, { alignItems: 'flex-end' }]}>
                <Text style={styles.detailTime}>{item.arrivalTime || '--:--'}</Text>
                <Text style={[styles.detailStation, { textAlign: 'right' }]} numberOfLines={3}>
                  {item.arrivalStation}
                </Text>
              </View>
            </View>

            <View style={[styles.detailPriceRow, { backgroundColor: `${colors.success}10` }]}>
              <Ionicons name="cash-outline" size={17} color={colors.success} />
              <Text style={styles.detailPriceLabel}>Ticket price</Text>
              <Text style={styles.detailPriceValue}>{formatLkr(item.ticketPriceLKR)}</Text>
            </View>

            <View style={styles.detailInfoBlock}>
              <InfoRow icon="calendar-outline" label="Operating days" value={(item.operatingDays || ['Daily']).join(', ')} />
              <InfoRow icon={bookingMeta.icon} label="How to book" value={bookingMeta.label} color={bookingMeta.color} />
              {item.contactNumber ? (
                <Pressable style={styles.detailInfoRow} onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}>
                  <Ionicons name="call-outline" size={15} color={colors.primary} />
                  <View style={styles.detailInfoText}>
                    <Text style={styles.detailInfoLabel}>Contact</Text>
                    <Text style={[styles.detailInfoValue, { color: colors.primary }]}>{item.contactNumber}</Text>
                  </View>
                </Pressable>
              ) : null}
              {item.paymentNotes ? <InfoRow icon="card-outline" label="Payment" value={item.paymentNotes} /> : null}
              {item.bookingTips ? <InfoRow icon="bulb-outline" label="Tips" value={item.bookingTips} /> : null}
            </View>

            {item.tags?.length ? (
              <View style={styles.detailTags}>
                {item.tags.map((tag) => (
                  <View key={tag} style={styles.detailTag}>
                    <Text style={styles.detailTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {item.bookingUrl ? (
              <Pressable style={[styles.detailBookBtn, { backgroundColor: meta.color }]} onPress={() => Linking.openURL(item.bookingUrl)}>
                <Ionicons name="open-outline" size={17} color={colors.white} />
                <Text style={styles.detailBookText}>{getBookingActionLabel(item.bookingChannel)}</Text>
              </Pressable>
            ) : null}

            {onAddToTrip ? (
              <Pressable
                style={[styles.addToTripBtn, { borderColor: meta.color }]}
                onPress={() => onAddToTrip(item)}
              >
                <Ionicons name="airplane-outline" size={16} color={meta.color} />
                <Text style={[styles.addToTripBtnText, { color: meta.color }]}>Add to a trip</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/* ─── RouteResultCard ─── */
export const RouteResultCard = React.memo(({ item, onDetails, onLog, onAddToTrip, style }) => {
  const meta = getTransportTypeMeta(item.type);
  const bookingMeta = getBookingChannelMeta(item.bookingChannel);
  return (
    <View style={[styles.resultCard, style]}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: meta.color }} />
      <View style={styles.resultCardTop}>
        <View style={[styles.resultTypeTag, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon} size={12} color={meta.color} />
          <Text style={[styles.resultTypeText, { color: meta.color }]}>{meta.shortLabel || meta.label}</Text>
        </View>
        <Text style={styles.resultProvider} numberOfLines={1}>{item.provider}</Text>
        <View style={styles.resultPriceBadge}>
          <Text style={styles.resultPrice}>{formatLkr(item.ticketPriceLKR)}</Text>
        </View>
      </View>

      <View style={styles.ticketRow}>
        <View style={styles.ticketSide}>
          <Text style={styles.ticketTime}>{item.departureTime || '--:--'}</Text>
          <Text style={styles.ticketStation} numberOfLines={2}>{item.departureStation}</Text>
        </View>
        <View style={styles.ticketMid}>
          <View style={styles.ticketDotFrom} />
          <View style={[styles.ticketLine, { backgroundColor: meta.color }]} />
          <Ionicons name={meta.icon} size={16} color={meta.color} />
          <View style={[styles.ticketLine, { backgroundColor: meta.color }]} />
          <View style={[styles.ticketDotTo, { backgroundColor: meta.color }]} />
          <Text style={[styles.ticketDuration, { color: meta.color }]}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={[styles.ticketSide, { alignItems: 'flex-end' }]}>
          <Text style={styles.ticketTime}>{item.arrivalTime || '--:--'}</Text>
          <Text style={[styles.ticketStation, { textAlign: 'right' }]} numberOfLines={2}>{item.arrivalStation}</Text>
        </View>
      </View>

      <View style={styles.resultMeta}>
        <View style={styles.metaPill}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{(item.operatingDays || ['Daily']).join(', ')}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name={bookingMeta.icon} size={11} color={bookingMeta.color} />
          <Text style={[styles.metaText, { color: bookingMeta.color }]} numberOfLines={1}>{bookingMeta.shortLabel}</Text>
        </View>
        {item.serviceClass ? (
          <View style={styles.metaPill}>
            <Ionicons name="ticket-outline" size={11} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{item.serviceClass}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.resultActions}>
        {item.bookingUrl ? (
          <Pressable style={styles.actionSecondary} onPress={() => Linking.openURL(item.bookingUrl)}>
            <Text style={styles.actionSecondaryText}>Book</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.actionSecondary} onPress={onDetails}>
          <Text style={styles.actionSecondaryText}>More details</Text>
        </Pressable>
        
        {/* Spacer to push the next item to the right */}
        <View style={{ flex: 1 }} />

        {onAddToTrip ? (
          <Pressable
            style={[styles.actionPrimary, { backgroundColor: meta.color }]}
            onPress={() => onAddToTrip(item)}
          >
            <Ionicons name="airplane-outline" size={13} color={colors.white} />
            <Text style={styles.actionPrimaryText}>Add to trip</Text>
          </Pressable>
        ) : onLog ? (
          <Pressable style={[styles.actionSecondary, { backgroundColor: `${meta.color}15` }]} onPress={onLog}>
            <Text style={[styles.actionSecondaryText, { color: meta.color }]}>Log route</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

/* ─── Search Box Component (Isolates text input re-renders) ─── */
const SearchBox = React.memo(({ onSearchChange }) => {
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const toInputRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSearchChange(fromText, toText);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [fromText, toText, onSearchChange]);

  const handleSwap = () => {
    const f = fromText;
    const t = toText;
    setFromText(t);
    setToText(f);
    // Trigger immediate search on swap
    onSearchChange(t, f);
  };

  const isSearching = !!(fromText.trim() || toText.trim());

  return (
    <View style={styles.searchCard}>
      <Text style={styles.searchCardTitle}>Where are you going?</Text>
      <View style={styles.searchFields}>
        <View style={styles.searchTrack}>
          <View style={styles.trackDotFrom} />
          <View style={styles.trackLine} />
          <View style={styles.trackDotTo} />
        </View>
        <View style={styles.searchInputsCol}>
          <View style={styles.searchInputWrap}>
            <TextInput
              style={styles.routeInput}
              placeholder="From — city, station or airport"
              placeholderTextColor={colors.textMuted}
              value={fromText}
              onChangeText={setFromText}
              returnKeyType="next"
              onSubmitEditing={() => toInputRef.current?.focus()}
            />
          </View>
          <View style={styles.searchDivider} />
          <View style={styles.searchInputWrap}>
            <TextInput
              ref={toInputRef}
              style={styles.routeInput}
              placeholder="To — district, station or city"
              placeholderTextColor={colors.textMuted}
              value={toText}
              onChangeText={setToText}
              returnKeyType="search"
            />
          </View>
        </View>
        <Pressable style={styles.swapBtn} onPress={handleSwap}>
          <Ionicons name="swap-vertical" size={20} color={colors.primary} />
        </Pressable>
      </View>
      {isSearching && (
        <Pressable style={styles.clearSearchBtn} onPress={() => { setFromText(''); setToText(''); }}>
          <Ionicons name="close-circle-outline" size={15} color={colors.textMuted} />
          <Text style={styles.clearSearchText}>Clear search</Text>
        </Pressable>
      )}
    </View>
  );
});

const PAGE_SIZE = 30;

/* ─── Main Screen ─── */
const TransportListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState([]);
  const [personalLogs, setPersonalLogs] = useState([]);
  const [popularSchedules, setPopularSchedules] = useState([]);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const [tripPickerSchedule, setTripPickerSchedule] = useState(null);

  const openTripPicker = useCallback((schedule) => {
    setDetailItem(null);
    setTripPickerSchedule(schedule);
  }, []);

  const handleTripPicked = useCallback(({ tripId, tripTitle }) => {
    const schedule = tripPickerSchedule;
    setTripPickerSchedule(null);
    if (!schedule) return;
    navigation.navigate('AddTransport', tripId
      ? { schedule, tripId, tripTitle, lockTrip: true }
      : { schedule });
  }, [navigation, tripPickerSchedule]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const isFirstLoad = useRef(true);
  const listRef = useRef(null);
  const isSearching = !!(searchFrom.trim() || searchTo.trim());

  const handleSearchChange = useCallback((from, to) => {
    setSearchFrom(from);
    setSearchTo(to);
  }, []);

  const load = useCallback(async ({ silent = false, pageNum = 1, append = false } = {}) => {
    try {
      if (!silent && !append) setLoading(true);
      if (append) setLoadingMore(true);
      setError('');

      const params = { page: pageNum, limit: PAGE_SIZE };
      if (selectedType !== 'all') params.type = selectedType;
      if (searchFrom.trim()) params.from = searchFrom.trim();
      if (searchTo.trim()) params.to = searchTo.trim();

      const [scheduleRes, logRes] = await Promise.all([
        getTransportSchedulesApi(params),
        pageNum === 1 ? getTransportsApi().catch(() => null) : Promise.resolve(null)
      ]);

      const data = scheduleRes?.data || {};
      const newSchedules = data.schedules || [];

      setSchedules(prev => append ? [...prev, ...newSchedules] : newSchedules);
      setPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || newSchedules.length);

      if (logRes) {
        setPersonalLogs(logRes.data?.transports || []);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load transport routes'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedType, searchFrom, searchTo]);

  const loadPopularSchedules = useCallback(async () => {
    try {
      const params = { page: 1, limit: POPULAR_ROUTE_LIMIT };
      if (selectedType !== 'all') params.type = selectedType;
      const response = await getTransportSchedulesApi(params);
      setPopularSchedules(response?.data?.schedules || []);
    } catch (err) {
      setPopularSchedules([]);
    }
  }, [selectedType]);

  useFocusEffect(useCallback(() => {
    isFirstLoad.current = true;
    load();
    loadPopularSchedules();
  }, [load, loadPopularSchedules]));

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    load({ silent: true });
    loadPopularSchedules();
  }, [selectedType, searchFrom, searchTo, load, loadPopularSchedules]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    load({ silent: true, pageNum: page + 1, append: true });
  };

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);
  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 350;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  if (loading && !refreshing && schedules.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroBand}>
        <View style={styles.heroBandRow}>
          <View>
            <Text style={styles.heroEyebrow}>Sri Lanka</Text>
            <Text style={styles.heroTitle}>Transit</Text>
            <Text style={styles.heroSub}>Find trains, buses, taxis and more</Text>
          </View>
          <Pressable style={styles.logBtn} onPress={() => setShowLog(true)}>
            <Ionicons name="receipt-outline" size={18} color={colors.white} />
            {personalLogs.length > 0 && (
              <View style={styles.logBadge}><Text style={styles.logBadgeText}>{personalLogs.length}</Text></View>
            )}
          </Pressable>
        </View>
      </LinearGradient>

      <SearchBox onSearchChange={handleSearchChange} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        {TYPE_FILTERS.map((type) => (
          <TypeChip key={type} value={type} active={selectedType === type} onPress={() => setSelectedType(type)} />
        ))}
      </ScrollView>

      {!isSearching && popularSchedules.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flame-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Popular Routes</Text>
            </View>
            <Text style={styles.sectionSub}>Top {popularSchedules.length} by popularity score</Text>
          </View>
          <FlatList
            data={popularSchedules}
            keyExtractor={(item) => `popular_${item._id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularRouteRow}
            snapToInterval={POPULAR_CARD_WIDTH + 12}
            decelerationRate="fast"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <RouteResultCard
                item={item}
                style={styles.popularRouteCard}
                onDetails={() => setDetailItem(item)}
                onAddToTrip={openTripPicker}
              />
            )}
          />
        </View>
      )}

      <ErrorText message={error} />

      <View style={[styles.sectionHeader, { marginTop: isSearching ? 12 : 24 }]}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={isSearching ? "search-outline" : "bus-outline"} size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{isSearching ? `${total} routes found` : 'All Routes'}</Text>
        </View>
        {isSearching && (
          <Text style={styles.searchSummary} numberOfLines={1}>{searchFrom || 'Any'} → {searchTo || 'Any'}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        ref={listRef}
        data={schedules}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <RouteResultCard
            item={item}
            onDetails={() => setDetailItem(item)}
            onAddToTrip={openTripPicker}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load({ silent: true }); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title="No routes found" subtitle="Try different locations." icon="bus-outline" />
          ) : null
        }
      />
      {showToTop ? (
        <Pressable
          style={[styles.toTopBtn, { bottom: insets.bottom + 88 }]}
          onPress={handleScrollToTop}
        >
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </Pressable>
      ) : null}
      <RouteDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAddToTrip={openTripPicker}
      />
      <TransportLogModal visible={showLog} logs={personalLogs} onClose={() => setShowLog(false)} onEdit={(item) => { setShowLog(false); navigation.navigate('EditTransport', { transport: item }); }} />
      <AddToTripSheet
        visible={!!tripPickerSchedule}
        schedule={tripPickerSchedule}
        onClose={() => setTripPickerSchedule(null)}
        onPick={handleTripPicked}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  loadingText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  content: { paddingBottom: 60 },

  heroBand: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 },
  heroBandRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  logBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4
  },
  logBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center'
  },
  logBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },

  /* Search card */
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    marginHorizontal: 14,
    marginTop: -16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12
  },
  searchCardTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginBottom: 14 },
  searchFields: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchTrack: { alignItems: 'center', paddingVertical: 8, width: 16, gap: 0 },
  trackDotFrom: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.primary },
  trackLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 3, borderRadius: 1, minHeight: 20 },
  trackDotTo: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.primary },
  searchInputsCol: { flex: 1 },
  searchInputWrap: { paddingVertical: 4 },
  routeInput: { height: 44, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  searchDivider: { height: 1, backgroundColor: colors.border },
  swapBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1, borderColor: `${colors.primary}30`,
    alignItems: 'center', justifyContent: 'center'
  },
  clearSearchBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  clearSearchText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },

  typeRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 34, paddingHorizontal: 12, borderRadius: 17,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border
  },
  typeChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  typeChipTextActive: { color: colors.white },

  sectionHeader: { paddingHorizontal: 16, marginTop: 22, marginBottom: 12, gap: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  sectionSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  searchSummary: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  popularRouteRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  popularRouteCard: {
    width: POPULAR_CARD_WIDTH,
    marginHorizontal: 0,
    marginBottom: 0
  },

  /* Route result card */
  resultCard: {
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 14, marginBottom: 12, padding: 14,
    overflow: 'hidden'
  },
  resultCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  resultTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  resultTypeText: { fontSize: 10, fontWeight: '900' },
  resultProvider: { flex: 1, fontSize: 13, fontWeight: '900', color: colors.textPrimary },
  resultPriceBadge: { backgroundColor: `${colors.success}14`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  resultPrice: { color: colors.success, fontSize: 12, fontWeight: '900' },

  ticketRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10
  },
  ticketSide: { flex: 1, gap: 3 },
  ticketTime: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  ticketStation: { color: colors.textMuted, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  ticketMid: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  ticketDotFrom: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryDark },
  ticketLine: { height: 2, width: 24, borderRadius: 1 },
  ticketDotTo: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary },
  ticketDuration: { fontSize: 9, fontWeight: '900', marginTop: 2 },

  resultMeta: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  metaPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background, borderRadius: 9,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 7, paddingVertical: 5
  },
  metaText: { flex: 1, color: colors.textMuted, fontSize: 10, fontWeight: '800' },

  resultActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionSecondary: {
    height: 34, paddingHorizontal: 14, borderRadius: 11,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center'
  },
  actionSecondaryText: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 34, paddingHorizontal: 12, borderRadius: 11,
    justifyContent: 'center'
  },
  actionPrimaryText: { color: colors.white, fontSize: 12, fontWeight: '900' },

  /* Detail modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 12,
    maxHeight: '92%'
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: {
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    paddingLeft: 12, marginBottom: 16, position: 'relative'
  },
  modalTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  modalTypeText: { fontSize: 11, fontWeight: '900' },
  modalProvider: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  modalServiceClass: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  modalRouteName: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  modalCloseBtn: { position: 'absolute', right: 0, top: 0, padding: 4 },

  detailTicket: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, padding: 16, marginBottom: 12
  },
  detailTicketSide: { flex: 1, gap: 4 },
  detailTime: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  detailStation: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  detailTicketMid: { alignItems: 'center', gap: 4, paddingHorizontal: 10 },
  detailDotFrom: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryDark },
  detailLine: { height: 2, width: 28, borderRadius: 1 },
  detailDotTo: { width: 10, height: 10, borderRadius: 3 },
  detailDuration: { fontSize: 10, fontWeight: '900', marginTop: 4 },

  detailPriceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, marginBottom: 12
  },
  detailPriceLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  detailPriceValue: { color: colors.success, fontSize: 18, fontWeight: '900' },

  detailInfoBlock: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 4, marginBottom: 12
  },
  detailInfoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: colors.border
  },
  detailInfoText: { flex: 1 },
  detailInfoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  detailInfoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 18 },

  detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  detailTag: { backgroundColor: `${colors.primary}12`, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
  detailTagText: { color: colors.primary, fontSize: 11, fontWeight: '800' },

  detailBookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 16, marginBottom: 12
  },
  detailBookText: { color: colors.white, fontSize: 15, fontWeight: '900' },

  addToTripBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    backgroundColor: colors.surface, marginTop: 4
  },
  addToTripBtnText: { fontSize: 14, fontWeight: '900' },

  /* Log modal */
  logModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' },
  logModalTitle: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  logCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.surface, borderRadius: 15,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 10, overflow: 'hidden'
  },
  logCardIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  logCardBody: { flex: 1, minWidth: 0 },
  logCardRoute: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  logCardSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  logCardRight: { alignItems: 'flex-end', gap: 4 },
  logCardCost: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  statusBadge: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '900' },
  logModalEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, minHeight: 200, gap: 10 },
  logModalEmptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  logModalEmptySub: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  toTopBtn: {
    position: 'absolute',
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999
  }
});

export default TransportListScreen;
