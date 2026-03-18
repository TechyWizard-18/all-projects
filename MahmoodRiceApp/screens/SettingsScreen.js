import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, LANGUAGES } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { language, changeLanguage } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const renderAnimatedCard = (index, children) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardAnims[index],
          transform: [
            {
              translateY: cardAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#37474F', '#455A64', '#546E7A']} style={styles.gradient}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t(language, 'back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(language, 'settingsTitle')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Section */}
          {renderAnimatedCard(
            0,
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🌐</Text>
                <Text style={styles.cardTitle}>{t(language, 'selectLanguage')}</Text>
              </View>
              <View style={styles.currentLangRow}>
                <Text style={styles.currentLabel}>{t(language, 'currentLanguage')}:</Text>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentFlag}>{currentLang?.flag}</Text>
                  <Text style={styles.currentName}>{currentLang?.nativeName}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.langGrid}>
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langCard,
                        isSelected && styles.langCardSelected,
                      ]}
                      onPress={() => changeLanguage(lang.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text style={[styles.langNative, isSelected && styles.langNativeSelected]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={[styles.langEnglish, isSelected && styles.langEnglishSelected]}>
                        {lang.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Section separator */}
          <View style={styles.sectionSeparator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorLabel}>General</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Privacy Policy & App Version in one card */}
          {renderAnimatedCard(
            1,
            <>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => navigation.navigate('PrivacyPolicy')}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Text style={styles.settingsRowIcon}>🔒</Text>
                  <Text style={styles.settingsRowText}>{t(language, 'privacyPolicy')}</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Text style={styles.settingsRowIcon}>📱</Text>
                  <Text style={styles.settingsRowText}>{t(language, 'appVersion')}</Text>
                </View>
                <Text style={styles.versionText}>1.0.0</Text>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const LANG_CARD_WIDTH = (width - 60 - 8) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: { marginBottom: 6 },
  backText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: { fontSize: 20, marginRight: 8 },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  currentLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  currentFlag: { fontSize: 15 },
  currentName: { fontSize: 12, fontWeight: '700', color: '#3949AB' },
  divider: {
    height: 1.5,
    backgroundColor: '#C5CAE9',
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 1,
  },

  /* Language Grid */
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  langCard: {
    width: LANG_CARD_WIDTH,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  langCardSelected: {
    backgroundColor: '#E8EAF6',
    borderColor: '#3949AB',
  },
  langFlag: { fontSize: 24, marginBottom: 3 },
  langNative: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  langNativeSelected: {
    color: '#3949AB',
  },
  langEnglish: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  langEnglishSelected: {
    color: '#5C6BC0',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3949AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Section Separator */
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  separatorLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* Settings Row */
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsRowIcon: { fontSize: 18 },
  settingsRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingsArrow: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
    marginHorizontal: 2,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
});

