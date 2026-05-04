import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../constants/colors';
import AppButton from '../common/AppButton';
import AppInput from '../common/AppInput';
import ErrorText from '../common/ErrorText';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  createReviewApi,
  deleteReviewApi,
  flagReviewApi,
  getReviewsApi,
  updateReviewApi,
  voteReviewApi
} from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';

const { width, height } = Dimensions.get('window');

/* ── Star Display ─────────────────────────────────────────── */
const Stars = ({ value, onChange, size = 20, readonly = false }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          onPress={() => !readonly && onChange?.(i)}
          onPressIn={() => !readonly && setHover(i)}
          onPressOut={() => !readonly && setHover(0)}
          style={{ marginHorizontal: 2 }}
        >
          <Ionicons
            name={i <= active ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning}
          />
        </Pressable>
      ))}
    </View>
  );
};

/* ── Single Review Card ─────────────────────────────────────── */
const ReviewCard = ({ review, currentUserId, onDelete, onEdit, onVote, onFlag }) => {
  const user = review.userId;
  const name = user?.fullName || 'Traveler';
  const date = review.createdAt 
    ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  
  const isOwn = currentUserId === String(user?._id || user?.id);
  const alreadyVoted = review.helpfulBy?.includes(currentUserId);
  const isFlagged = review.status === 'pending' || review.status === 'flagged';

  const travelIcons = { solo: '🧳', couple: '💑', family: '👨‍👩‍👧', friends: '👫', business: '💼' };

  return (
    <Animatable.View animation="fadeInUp" duration={500} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.author}>{name}</Text>
          <View style={styles.metaSub}>
            <Text style={styles.date}>{date}</Text>
            {review.travelType && (
              <View style={styles.travelTypeTag}>
                <Text style={styles.travelTypeText}>
                  {travelIcons[review.travelType] || ''} {review.travelType}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Stars value={review.rating} readonly size={14} />
          {review.wouldRecommend !== undefined && (
            <View style={[styles.recommendBadge, !review.wouldRecommend && styles.recommendBadgeNo]}>
              <Ionicons 
                name={review.wouldRecommend ? "checkmark-circle" : "close-circle"} 
                size={10} 
                color={review.wouldRecommend ? colors.success : colors.danger} 
              />
              <Text style={[styles.recommendText, !review.wouldRecommend && styles.recommendTextNo]}>
                {review.wouldRecommend ? 'Recommends' : 'No'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {review.title ? <Text style={styles.cardTitle}>{review.title}</Text> : null}
      <Text style={styles.comment}>{review.comment}</Text>

      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <View style={styles.prosConsContainer}>
          {review.pros?.length > 0 && (
            <View style={styles.prosList}>
              <Ionicons name="add-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
              <View style={styles.tagsContainer}>
                {review.pros.map((p, i) => (
                  <View key={i} style={styles.tag}><Text style={styles.tagText}>{p}</Text></View>
                ))}
              </View>
            </View>
          )}
          {review.cons?.length > 0 && (
            <View style={styles.consList}>
              <Ionicons name="alert-circle" size={14} color={colors.warning} style={{ marginTop: 2 }} />
              <View style={styles.tagsContainer}>
                {review.cons.map((c, i) => (
                  <View key={i} style={[styles.tag, styles.tagCon]}><Text style={styles.tagTextCon}>{c}</Text></View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {review.adminResponse && (
        <View style={styles.adminResponse}>
          <View style={styles.adminBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adminResponseLabel}>OFFICIAL GENIE RESPONSE</Text>
            <Text style={styles.adminResponseText}>{review.adminResponse}</Text>
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.helpfulRow}>
          <Pressable 
            style={[styles.helpfulBtn, alreadyVoted && styles.helpfulBtnVoted]} 
            onPress={() => onVote(review, true)}
            disabled={alreadyVoted || !currentUserId}
          >
            <Ionicons name="thumbs-up-outline" size={14} color={alreadyVoted ? colors.white : colors.textMuted} />
            <Text style={[styles.helpfulCount, alreadyVoted && styles.helpfulCountVoted]}>{review.helpfulCount || 0}</Text>
          </Pressable>
          <Pressable 
            style={styles.helpfulBtn} 
            onPress={() => onVote(review, false)}
            disabled={alreadyVoted || !currentUserId}
          >
            <Ionicons name="thumbs-down-outline" size={14} color={colors.textMuted} />
            <Text style={styles.helpfulCount}>{review.notHelpfulCount || 0}</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          {!isOwn && (
            <Pressable 
              style={styles.flagBtn} 
              onPress={() => onFlag(review)}
              disabled={isFlagged || !currentUserId}
            >
              <Ionicons name={isFlagged ? "flag" : "flag-outline"} size={16} color={isFlagged ? colors.danger : colors.textMuted} />
            </Pressable>
          )}
          {isOwn && (
            <>
              <Pressable style={styles.actionBtn} onPress={() => onEdit(review)}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => onDelete(review)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Animatable.View>
  );
};

/* ── Main Component ────────────────────────────────────────── */
export default function ReviewSection({ targetType, targetId, targetName }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Sort state
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'top', 'bottom'

  // Form State
  const [form, setForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    travelType: '',
    wouldRecommend: true,
    pros: '',
    cons: '',
  });
  const [editingId, setEditingId] = useState(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getReviewsApi({ targetType, targetId });
      setReviews(res?.data?.reviews || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (sortOrder === 'newest') return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortOrder === 'top') return arr.sort((a, b) => b.rating - a.rating);
    if (sortOrder === 'bottom') return arr.sort((a, b) => a.rating - b.rating);
    return arr;
  }, [reviews, sortOrder]);

  const toggleModal = () => {
    setShowModal(!showModal);
    if (!showModal) {
      // Opening
      if (!editingId) {
        setForm({
          rating: 0,
          title: '',
          comment: '',
          travelType: '',
          wouldRecommend: true,
          pros: '',
          cons: '',
        });
      }
    } else {
      // Closing
      setEditingId(null);
    }
  };

  const handleSubmit = async () => {
    if (form.rating === 0) {
      Alert.alert('Required', 'Please select a star rating.');
      return;
    }
    if (form.comment.length < 10) {
      Alert.alert('Incomplete', 'Please share a bit more detail (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        targetType,
        targetId,
        pros: form.pros.split(',').map(s => s.trim()).filter(Boolean),
        cons: form.cons.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editingId) {
        await updateReviewApi(editingId, payload);
      } else {
        await createReviewApi(payload);
      }

      loadReviews();
      toggleModal();
      Alert.alert('Submitted', 'Thank you for your feedback! It will be live after a quick moderation.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to save review'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (review) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to remove your feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReviewApi(review._id || review.id);
              loadReviews();
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete review'));
            }
          }
        }
      ]
    );
  };

  const handleEdit = (review) => {
    setForm({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      travelType: review.travelType || '',
      wouldRecommend: review.wouldRecommend !== false,
      pros: review.pros?.join(', ') || '',
      cons: review.cons?.join(', ') || '',
    });
    setEditingId(review._id || review.id);
    setShowModal(true);
  };

  const handleVote = async (review, isHelpful) => {
    try {
      await voteReviewApi(review._id || review.id, isHelpful);
      loadReviews();
    } catch (err) { /* Silent */ }
  };

  const handleFlag = (review) => {
    Alert.alert(
      'Report Review',
      'Report this review for official moderation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: async () => {
            try {
              await flagReviewApi(review._id || review.id);
              loadReviews();
              Alert.alert('Reported', 'Our team will review this content shortly.');
            } catch (err) {
              Alert.alert('Error', 'Action failed.');
            }
          }
        }
      ]
    );
  };

  // Summary Logic
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Traveler Reviews</Text>
        {isAuthenticated ? (
          <Pressable style={styles.writeBtn} onPress={toggleModal}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.writeBtnText}>Write</Text>
          </Pressable>
        ) : (
          <Text style={styles.loginHint}>Log in to share experience</Text>
        )}
      </View>

      {/* Summary Block */}
      {!loading && reviews.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryLeft}>
            <Text style={styles.avgScore}>{avg}</Text>
            <Stars value={Math.round(avg)} readonly size={14} />
            <Text style={styles.totalReviews}>{reviews.length} reviews</Text>
          </View>
          <View style={styles.summaryRight}>
            {distribution.map(d => (
              <View key={d.star} style={styles.distRow}>
                <Text style={styles.distStar}>{d.star}★</Text>
                <View style={styles.distBar}>
                  <View style={[styles.distFill, { width: `${d.pct}%` }]} />
                </View>
                <Text style={styles.distCount}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sort Chips */}
      {!loading && reviews.length > 1 && (
        <View style={styles.sortRow}>
          <Pressable style={[styles.sortChip, sortOrder === 'newest' && styles.sortChipActive]} onPress={() => setSortOrder('newest')}>
            <Text style={[styles.sortChipText, sortOrder === 'newest' && styles.sortChipTextActive]}>Newest First</Text>
          </Pressable>
          <Pressable style={[styles.sortChip, sortOrder === 'top' && styles.sortChipActive]} onPress={() => setSortOrder('top')}>
            <Text style={[styles.sortChipText, sortOrder === 'top' && styles.sortChipTextActive]}>Highest Rated</Text>
          </Pressable>
          <Pressable style={[styles.sortChip, sortOrder === 'bottom' && styles.sortChipActive]} onPress={() => setSortOrder('bottom')}>
            <Text style={[styles.sortChipText, sortOrder === 'bottom' && styles.sortChipTextActive]}>Lowest</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : reviews.length === 0 ? (
        <EmptyState 
          title="No reviews yet" 
          subtitle="Be the first to share your journey!"
          icon="chatbubble-ellipses-outline"
        />
      ) : (
        <View style={styles.list}>
          {sortedReviews.map(r => (
            <ReviewCard 
              key={r._id || r.id} 
              review={r} 
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onVote={handleVote}
              onFlag={handleFlag}
            />
          ))}
        </View>
      )}

      {/* ── Write Review Modal (System Way) ── */}
      <Modal 
        visible={showModal} 
        transparent 
        animationType="slide" 
        onRequestClose={toggleModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Review' : `Share Your Experience`}</Text>
              <Pressable onPress={toggleModal}><Ionicons name="close" size={24} color={colors.textMuted} /></Pressable>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={[
                styles.formScroll, 
                { paddingBottom: insets.bottom + 40 }
              ]}
            >
              <View style={styles.formSection}>
                <Text style={styles.label}>Rate your stay *</Text>
                <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} size={30} />
              </View>

              <AppInput label="Review Title" placeholder="Summarize your trip" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />
              <AppInput label="Detailed Review *" placeholder="What did you love or what could be better?" multiline numberOfLines={5} value={form.comment} onChangeText={v => setForm(p => ({ ...p, comment: v }))} style={{ height: 120, textAlignVertical: 'top' }} />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <AppInput label="What was good?" placeholder="View, Staff..." value={form.pros} onChangeText={v => setForm(p => ({ ...p, pros: v }))} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <AppInput label="Any issues?" placeholder="Price, WiFi..." value={form.cons} onChangeText={v => setForm(p => ({ ...p, cons: v }))} />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Type of Trip</Text>
                <View style={styles.pillsRow}>
                  {['solo', 'couple', 'family', 'friends', 'business'].map(t => (
                    <Pressable key={t} onPress={() => setForm(p => ({ ...p, travelType: p.travelType === t ? '' : t }))} style={[styles.pill, form.travelType === t && styles.pillActive]}>
                      <Text style={[styles.pillText, form.travelType === t && styles.pillTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Would you recommend this?</Text>
                <View style={styles.toggleRow}>
                  <Pressable onPress={() => setForm(p => ({ ...p, wouldRecommend: true }))} style={[styles.toggleBtn, form.wouldRecommend && styles.toggleBtnYes]}>
                    <Ionicons name="checkmark-circle" size={18} color={form.wouldRecommend ? colors.white : colors.textMuted} />
                    <Text style={[styles.toggleBtnText, form.wouldRecommend && styles.toggleBtnTextActive]}>Yes</Text>
                  </Pressable>
                  <Pressable onPress={() => setForm(p => ({ ...p, wouldRecommend: false }))} style={[styles.toggleBtn, !form.wouldRecommend && styles.toggleBtnNo]}>
                    <Ionicons name="close-circle" size={18} color={!form.wouldRecommend ? colors.white : colors.textMuted} />
                    <Text style={[styles.toggleBtnText, !form.wouldRecommend && styles.toggleBtnTextActive]}>No</Text>
                  </Pressable>
                </View>
              </View>

              <AppButton 
                title={editingId ? "Update Feedback" : "Post Review"} 
                onPress={handleSubmit} 
                loading={submitting} 
                containerStyle={{ marginTop: 20, marginBottom: 8 }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  writeBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  loginHint: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },

  summaryContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', paddingRight: 20, borderRightWidth: 1, borderRightColor: colors.border },
  avgScore: { fontSize: 38, fontWeight: '900', color: colors.textPrimary },
  totalReviews: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 4 },
  summaryRight: { flex: 1, paddingLeft: 20, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  distStar: { width: 25, fontSize: 10, color: colors.textSecondary, fontWeight: '800' },
  distBar: { flex: 1, height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: colors.warning, borderRadius: 3 },
  distCount: { width: 20, fontSize: 10, color: colors.textMuted, fontWeight: '700', textAlign: 'right' },

  sortRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  sortChipTextActive: { color: colors.white },

  list: { gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: colors.primary },
  meta: { flex: 1, marginLeft: 14 },
  author: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  metaSub: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  date: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  travelTypeTag: { backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  travelTypeText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  recommendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  recommendBadgeNo: { backgroundColor: colors.danger + '12' },
  recommendText: { fontSize: 10, fontWeight: '900', color: colors.success, textTransform: 'uppercase' },
  recommendTextNo: { color: colors.danger },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  comment: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },

  prosConsContainer: { marginTop: 15, gap: 10 },
  prosList: { flexDirection: 'row', gap: 10 },
  consList: { flexDirection: 'row', gap: 10 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: { backgroundColor: colors.success + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.success + '20' },
  tagCon: { backgroundColor: colors.warning + '08', borderColor: colors.warning + '20' },
  tagText: { fontSize: 11, color: colors.success, fontWeight: '700' },
  tagTextCon: { fontSize: 11, color: colors.warning, fontWeight: '700' },

  adminResponse: { marginTop: 18, padding: 15, backgroundColor: colors.surface2, borderRadius: 18, flexDirection: 'row', gap: 12 },
  adminBar: { width: 4, backgroundColor: colors.primary, borderRadius: 2 },
  adminResponseLabel: { fontSize: 10, fontWeight: '900', color: colors.primary, marginBottom: 4, letterSpacing: 1 },
  adminResponseText: { fontSize: 13, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border },
  helpfulRow: { flexDirection: 'row', gap: 12 },
  helpfulBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surface2 },
  helpfulBtnVoted: { backgroundColor: colors.primary },
  helpfulCount: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  helpfulCountVoted: { color: colors.white },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  flagBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.94 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  formScroll: { padding: 16, paddingHorizontal: 24 },
  formSection: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  starsRow: { flexDirection: 'row' },
  formRow: { flexDirection: 'row', marginBottom: 4 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
  pillTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  toggleBtnYes: { backgroundColor: colors.success, borderColor: colors.success },
  toggleBtnNo: { backgroundColor: colors.danger, borderColor: colors.danger },
  toggleBtnText: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  toggleBtnTextActive: { color: colors.white }
});
