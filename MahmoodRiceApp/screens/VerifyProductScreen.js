import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { verifyProduct } from '../api/verifyProduct';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width, height } = Dimensions.get('window');
// Scan area — compact frame matching 16x20mm label dimensions
const SCAN_WIDTH = width * 0.45;
const SCAN_HEIGHT = SCAN_WIDTH * (20 / 16); // 4:5 ratio matching 16x20mm label
// Zone heights based on real dimensions: QR=12mm, gap≈3.5mm, SV=4.5mm (total 20mm)
const QR_ZONE_RATIO = 12 / 20;    // 60%
const SV_ZONE_RATIO = 4.5 / 20;   // 22.5%
// The purple color used everywhere
const PURPLE = '#4A148C';

export default function VerifyProductScreen({ navigation, route }) {
  const { language } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const cameraRef = useRef(null);
  const scanWindowRef = useRef(null);
  const scanWindowLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const retryQr = route.params?.retryQr || null;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, []);

  useEffect(() => {
    if (!loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading]);

  const handleScanWindowLayout = useCallback(() => {
    if (scanWindowRef.current) {
      scanWindowRef.current.measureInWindow((x, y, w, h) => {
        scanWindowLayout.current = { x, y, width: w, height: h };
      });
    }
  }, []);

  const handleTapToFocus = useCallback((evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    // Convert scan-window-local coords to absolute screen coords
    const layout = scanWindowLayout.current;
    const absX = layout.x + locationX;
    const absY = layout.y + locationY;
    setFocusPoint({ x: absX, y: absY });
    focusAnim.setValue(0);
    Animated.sequence([
      Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(focusAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setFocusPoint(null));
  }, [focusAnim]);

  const sendForVerification = useCallback(async (imageUri) => {
    setLoading(true);
    setStatusText('Verifying product...');
    try {
      const result = await verifyProduct(imageUri, retryQr);
      setLoading(false);
      setStatusText('');
      navigation.navigate('Result', {
        result,
        retryQr: result.Code === 4 ? (result.Qr || null) : null,
      });
    } catch (error) {
      setLoading(false);
      setStatusText('');
      navigation.navigate('Result', {
        result: { Code: -1, Message: error.message || 'Connection failed.' },
      });
    }
  }, [navigation, retryQr]);

  const handleCapture = useCallback(async () => {
    if (loading || !cameraRef.current) return;
    setLoading(true);
    setStatusText('Capturing image...');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        imageType: 'jpg',
        shutterSound: false,
      });
      if (!photo || !photo.uri) throw new Error('Failed to capture image.');
      await sendForVerification(photo.uri);
    } catch (error) {
      setLoading(false);
      setStatusText('');
      navigation.navigate('Result', {
        result: { Code: -1, Message: error.message || 'Failed to capture image.' },
      });
    }
  }, [loading, navigation, sendForVerification]);

  const handlePickFromGallery = useCallback(async () => {
    if (loading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 1, allowsEditing: false,
      });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      await sendForVerification(result.assets[0].uri);
    } catch (error) {
      setLoading(false);
      setStatusText('');
      navigation.navigate('Result', {
        result: { Code: -1, Message: error.message || 'Failed to pick image.' },
      });
    }
  }, [loading, navigation, sendForVerification]);

  // ─── Permission states ───────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#B388FF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>{t(language, 'cameraPermRequired')}</Text>
        <Text style={styles.permissionText}>{t(language, 'cameraPermText')}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>{t(language, 'grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main camera UI ──────────────────────────────────
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7C4DFF" />
            <Text style={styles.loadingText}>{statusText || t(language, 'pleaseWait')}</Text>
          </View>
        </View>
      )}

      {/* Camera fills screen behind everything */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        animateShutter={false}
      />

      {/* UI overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* ====== SOLID PURPLE MASK WITH CUTOUT ====== */}

          {/* Top purple block */}
          <View style={styles.maskTop}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← {t(language, 'back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flashBtn, flashOn && styles.flashBtnOn]}
                onPress={() => setFlashOn((v) => !v)}
              >
                <Text style={styles.flashIcon}>{flashOn ? '⚡' : '🔦'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{t(language, 'captureProductLabel')}</Text>
            <Text style={styles.subtitle}>
              {retryQr ? t(language, 'retakeHint') : t(language, 'scanHint')}
            </Text>

            {/* Step-by-step instructions */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionStep}>
                {'① '}{t(language, 'instrStep1')}
              </Text>
              <Text style={styles.instructionStep}>
                {'② '}{t(language, 'instrStep2')}
              </Text>
              <Text style={styles.instructionStep}>
                {'③ '}{t(language, 'instrStep3')}
              </Text>
            </View>
          </View>

          {/* Middle row: purple | clear scan window | purple */}
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <TouchableWithoutFeedback onPress={handleTapToFocus}>
              <View
                ref={scanWindowRef}
                onLayout={handleScanWindowLayout}
                style={styles.scanWindow}
              >
              {/* QR + SV guide zones based on real label dimensions */}
              <View style={styles.guideContainer}>
                {/* QR zone — 12mm of 20mm = 60% */}
                <View style={[styles.guideQrArea, { height: SCAN_HEIGHT * QR_ZONE_RATIO }]}>
                  <Text style={styles.guideText}>QR Code</Text>
                  <Text style={styles.guideDimText}>12 × 12 mm</Text>
                </View>

                {/* Separator line between QR and SV */}
                <View style={styles.separatorRow}>
                  <View style={styles.dashLine} />
                  <View style={styles.separatorBadge}>
                    <Text style={styles.separatorBadgeText}>▼ SV ▼</Text>
                  </View>
                  <View style={styles.dashLine} />
                </View>

                {/* SV zone — 4.5mm of 20mm = 22.5% */}
                <View style={[styles.guideSvArea, { height: SCAN_HEIGHT * SV_ZONE_RATIO }]}>
                  <Text style={styles.guideTextSmall}>SEALVector</Text>
                </View>
              </View>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCAN_HEIGHT - 4],
                      }),
                    }],
                  },
                ]}
              />
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.maskSide} />
          </View>

          {/* Bottom purple block */}
          <View style={styles.maskBottom}>
            <Text style={styles.hintText}>
              {retryQr ? t(language, 'retakeHint') : t(language, 'alignLabel')}
            </Text>

            {!loading && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.sideBtn} onPress={handlePickFromGallery}>
                  <Text style={styles.sideBtnIcon}>🖼️</Text>
                  <Text style={styles.sideBtnLabel}>{t(language, 'gallery')}</Text>
                </TouchableOpacity>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                    <View style={styles.captureBtnInner}>
                      <Text style={styles.captureBtnIcon}>📸</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.sideBtn} />
              </View>
            )}

            <Text style={styles.captureLabel}>
              {loading ? t(language, 'processing') : t(language, 'captureOrGallery')}
            </Text>
          </View>

          {/* Tap to focus indicator — only shows within scan area */}
          {focusPoint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusRing,
                {
                  left: focusPoint.x - 28,
                  top: focusPoint.y - 28,
                  opacity: focusAnim,
                  transform: [{
                    scale: focusAnim.interpolate({
                      inputRange: [0, 1], outputRange: [1.5, 1],
                    }),
                  }],
                },
              ]}
            />
          )}
        </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PURPLE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PURPLE,
  },

  /* Permission screen */
  permissionScreen: {
    flex: 1,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionIcon: { fontSize: 50, marginBottom: 16 },
  permissionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#fff',
    textAlign: 'center', marginBottom: 10,
  },
  permissionText: {
    fontSize: 13, color: '#D1C4E9',
    textAlign: 'center', marginBottom: 24, lineHeight: 19,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24,
  },
  permissionButtonText: { color: PURPLE, fontSize: 14, fontWeight: '700' },

  /* ====== PURPLE MASK BLOCKS ====== */

  maskTop: {
    backgroundColor: PURPLE,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  flashBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  flashBtnOn: {
    backgroundColor: 'rgba(255,235,59,0.35)',
  },
  flashIcon: { fontSize: 18 },
  title: {
    color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginTop: 3,
  },

  /* Capture instructions */
  instructionBox: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  instructionStep: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 2,
  },

  maskMiddle: {
    flexDirection: 'row',
    height: SCAN_HEIGHT,
  },
  maskSide: {
    flex: 1,
    backgroundColor: PURPLE,
  },

  scanWindow: {
    width: SCAN_WIDTH,
    height: SCAN_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  /* Guide labels inside scan window */
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  guideQrArea: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  guideText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  guideDimText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 8,
    marginTop: 2,
    letterSpacing: 1,
  },

  /* Separator between QR and SV zones */
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 6,
  },
  dashLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  separatorBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  separatorBadgeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },

  guideSvArea: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  guideTextSmall: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  corner: {
    position: 'absolute',
    width: 18, height: 18,
    borderColor: '#fff',
    borderWidth: 2.5,
  },
  cTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  cTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  cBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  cBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },

  scanLine: {
    position: 'absolute',
    left: 6, right: 6, height: 2,
    backgroundColor: '#B388FF', borderRadius: 1,
    shadowColor: '#B388FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8,
    elevation: 4,
  },

  maskBottom: {
    flex: 1,
    backgroundColor: PURPLE,
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 18,
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11, textAlign: 'center', marginBottom: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  sideBtn: {
    width: 50, alignItems: 'center', justifyContent: 'center', marginHorizontal: 18,
  },
  sideBtnIcon: { fontSize: 22, marginBottom: 2 },
  sideBtnLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },

  captureBtn: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  captureBtnInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnIcon: { fontSize: 22 },

  captureLabel: {
    color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8,
  },

  focusRing: {
    position: 'absolute',
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: '#FFEB3B',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  loadingText: {
    marginTop: 12, fontSize: 14, fontWeight: '600', color: '#333',
  },
});
