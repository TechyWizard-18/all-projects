import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');

const getResultConfig = (lang) => ({
  1: {
    title: t(lang, 'verified'),
    message: t(lang, 'verifiedMsg'),
    icon: '✅',
    colors: ['#1B5E20', '#2E7D32', '#43A047'],
    bgColor: '#E8F5E9',
    textColor: '#1B5E20',
  },
  2: {
    title: t(lang, 'notVerified'),
    message: t(lang, 'notVerifiedMsg'),
    icon: '❌',
    colors: ['#B71C1C', '#C62828', '#D32F2F'],
    bgColor: '#FFEBEE',
    textColor: '#B71C1C',
  },
  3: {
    title: t(lang, 'qrNotDetected'),
    message: t(lang, 'qrNotDetectedMsg'),
    icon: '⚠️',
    colors: ['#4A148C', '#6A1B9A', '#7C4DFF'],
    bgColor: '#EDE7F6',
    textColor: '#4A148C',
  },
  4: {
    title: t(lang, 'retakeNeeded'),
    message: t(lang, 'retakeNeededMsg'),
    icon: '📸',
    colors: ['#E65100', '#EF6C00', '#F57C00'],
    bgColor: '#FFF3E0',
    textColor: '#E65100',
  },
  '-1': {
    title: t(lang, 'error'),
    message: t(lang, 'errorMsg'),
    icon: '⚠️',
    colors: ['#37474F', '#546E7A', '#78909C'],
    bgColor: '#ECEFF1',
    textColor: '#37474F',
  },
});

export default function ResultScreen({ route, navigation }) {
  const { language } = useLanguage();
  const RESULT_CONFIG = getResultConfig(language);
  const { result, retryQr } = route.params;
  const code = result.Code != null ? result.Code : -1;
  const config = RESULT_CONFIG[code] || RESULT_CONFIG['-1'];

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={config.colors} style={styles.gradient}>
        {/* Icon */}
        <Animated.View
          style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.resultIcon}>{config.icon}</Text>
          </View>
        </Animated.View>

        {/* Result Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: bounceAnim },
              ],
            },
          ]}
        >
          <Text style={[styles.resultTitle, { color: config.textColor }]}>
            {config.title}
          </Text>

          <View style={[styles.divider, { backgroundColor: config.textColor + '30' }]} />

          <Text style={[styles.resultMessage, { color: config.textColor + 'CC' }]}>
            {config.message}
          </Text>

          {/* Show server message if different from our default */}
          {result.Message && code !== -1 && (
            <View style={[styles.detailsBox, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.detailLabel, { color: config.textColor }]}>
                {t(language, 'serverResponse')}
              </Text>
              <Text style={[styles.detailValue, { color: config.textColor + 'AA' }]}>
                {result.Message}
              </Text>
            </View>
          )}

          {/* Show error details for Code -1 */}
          {code === -1 && result.Message && (
            <View style={[styles.detailsBox, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.detailLabel, { color: config.textColor }]}>
                {t(language, 'errorDetails')}
              </Text>
              <Text style={[styles.detailValue, { color: config.textColor + 'AA' }]}>
                {result.Message}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Code 3 or 4 or error: Show retry button */}
          {(code === 3 || code === 4 || code === -1) && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                navigation.replace('VerifyProduct', {
                  retryQr: retryQr || null,
                })
              }
            >
              <Text style={styles.retryButtonText}>
                {code === 4 ? t(language, 'retakePhoto') : t(language, 'tryAgain')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>{t(language, 'backToHome')}</Text>
          </TouchableOpacity>

          {(code === 1 || code === 2) && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => navigation.replace('VerifyProduct')}
            >
              <Text style={styles.scanAgainText}>{t(language, 'verifyAnother')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconWrapper: {
    marginBottom: 22,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 44,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    width: width - 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    width: 50,
    borderRadius: 1,
    marginVertical: 12,
  },
  resultMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  detailsBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    marginTop: 3,
  },
  buttonsContainer: {
    marginTop: 24,
    width: width - 40,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  homeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  scanAgainButton: {
    paddingVertical: 8,
  },
  scanAgainText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
