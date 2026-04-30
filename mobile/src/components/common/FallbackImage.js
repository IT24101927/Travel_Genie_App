import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { getImageUrl } from '../../constants/apiConfig';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
};

/**
 * FallbackImage
 *
 * Props:
 *   uri                – image URI or ordered list of image URIs
 *   style              – applied to the root View
 *   resizeMode         – 'cover' | 'contain' | 'stretch'
 *   iconName           – Ionicons name shown on placeholder
 *   iconSize           – size of placeholder icon
 *   placeholderColor   – background color when no image / loading
 *   placeholderIconColor – icon color on placeholder
 *   children           – rendered ONLY when the image successfully loads
 *                        (use this for gradient overlays so they never
 *                         appear on flat-color placeholder backgrounds)
 */
const FallbackImage = ({
  uri,
  style,
  resizeMode = 'cover',
  iconName = 'image-outline',
  iconSize = 36,
  placeholderColor,
  placeholderIconColor,
  children,
}) => {
  const uriKey = Array.isArray(uri) ? uri.map((v) => String(v || '')).join('|') : String(uri || '');
  const sources = useMemo(() => {
    const values = Array.isArray(uri) ? uri : [uri];
    const seen = new Set();

    return values
      .map(getImageUrl)
      .filter((source) => {
        if (!source || seen.has(source)) return false;
        seen.add(source);
        return true;
      });
  }, [uriKey]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const resolved = sources[sourceIndex] || null;
  const [status, setStatus] = useState(resolved ? 'loading' : 'failed');
  const shimmer   = useRef(new Animated.Value(0.45)).current;
  const shimmerA  = useRef(null);
  const errTimer  = useRef(null);

  // Reset when URI changes
  useEffect(() => {
    setSourceIndex(0);
    setStatus(sources.length ? 'loading' : 'failed');
  }, [sources.length, uriKey]);

  useEffect(() => {
    setStatus(resolved ? 'loading' : 'failed');
  }, [resolved]);

  // Shimmer pulse while loading
  useEffect(() => {
    if (status !== 'loading') {
      shimmerA.current?.stop();
      shimmer.setValue(1);
      return;
    }
    shimmerA.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1,    duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    );
    shimmerA.current.start();
    return () => shimmerA.current?.stop();
  }, [status, shimmer]);

  useEffect(() => () => clearTimeout(errTimer.current), []);

  const handleLoad  = () => { clearTimeout(errTimer.current); setStatus('loaded'); };
  const handleError = () => {
    clearTimeout(errTimer.current);
    if (sourceIndex < sources.length - 1) {
      setStatus('loading');
      setSourceIndex((idx) => Math.min(idx + 1, sources.length - 1));
      return;
    }
    errTimer.current = setTimeout(() => setStatus('failed'), 200);
  };

  const contentFit = resizeMode === 'contain' ? 'contain' : resizeMode === 'stretch' ? 'fill' : 'cover';
  const bgColor    = placeholderColor    || colors.surface3;
  const iconColor  = placeholderIconColor || colors.textMuted;

  return (
    <View style={[styles.root, { backgroundColor: bgColor }, style]}>

      {/* ── Placeholder (visible while loading or when no/broken URI) ── */}
      {status !== 'loaded' && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.center, { opacity: status === 'loading' ? shimmer : 1 }]}
        >
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        </Animated.View>
      )}

      {/* ── Actual image ── */}
      {resolved && (
        <Image
          key={resolved}
          source={{ uri: resolved, headers: HEADERS }}
          style={[
            StyleSheet.absoluteFill,
            { opacity: status === 'loaded' ? 1 : 0, backgroundColor: 'transparent' },
          ]}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          transition={350}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/*
       * ── Children (gradient overlays, badges, etc.) ──
       * Rendered ONLY when the image has loaded, so they never
       * paint coloured bands on top of a flat placeholder background.
       */}
      {status === 'loaded' && children}
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
});

export default FallbackImage;
