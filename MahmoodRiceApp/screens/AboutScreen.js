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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');

const MILESTONES = [
  { year: '1982', event: 'Mahmood Rice founded — beginning of a legacy in premium rice.' },
  { year: '1990s', event: 'Expanded across Middle East markets, becoming a household name.' },
  { year: '2000s', event: 'Global distribution launched — reaching Africa, Europe, and Asia.' },
  { year: '2010s', event: 'Modernized production facilities with state-of-the-art quality control.' },
  { year: 'Today', event: 'Trusted by millions worldwide — present in 50+ countries.' },
];

const CERTIFICATIONS = [
  '🏅 ISO 22000 (Food Safety Management)',
  '🏅 HACCP Certified',
  '🏅 BRC Global Standard for Food Safety',
  '🏅 Halal Certified',
  '🏅 UAE Quality Mark',
];

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    color: '#1877F2',
    url: 'https://www.facebook.com/mahmoodriceglobal/',
  },
  {
    name: 'Instagram',
    color: '#E4405F',
    url: 'https://www.instagram.com/mahmoodriceglobal',
  },
  {
    name: 'X / Twitter',
    color: '#1DA1F2',
    url: 'https://x.com/mahmood_rice',
  },
  {
    name: 'YouTube',
    color: '#FF0000',
    url: 'https://youtube.com/@mahmoodriceglobal?si=CgtC5LN5aJ9AZDif',
  },
];

export default function AboutScreen({ navigation }) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const sectionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    sectionAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const renderSection = (index, children) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: sectionAnims[index],
          transform: [
            {
              translateY: sectionAnims[index].interpolate({
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
      <LinearGradient colors={['#4A148C', '#6A1B9A', '#7C4DFF']} style={styles.gradient}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t(language, 'back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerEmoji}>🌾</Text>
          <Text style={styles.headerTitle}>{t(language, 'aboutTitle')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Who We Are */}
          {renderSection(
            0,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'whoWeAre')}</Text>
              <View style={styles.divider} />
              <Text style={styles.bodyText}>
                {t(language, 'whoWeAreText1')}
              </Text>
              <Text style={styles.bodyText}>
                {t(language, 'whoWeAreText2')}
              </Text>
            </>
          )}

          {/* Our Mission */}
          {renderSection(
            1,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'ourMission')}</Text>
              <View style={styles.divider} />
              <Text style={styles.bodyText}>
                {t(language, 'ourMissionText')}
              </Text>
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>
                  {t(language, 'ourMissionQuote')}
                </Text>
              </View>
            </>
          )}

          {/* Our Products */}
          {renderSection(
            2,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'ourProductsSection')}</Text>
              <View style={styles.divider} />
              <Text style={styles.bodyText}>
                {t(language, 'ourProductsSectionText')}
              </Text>
              <View style={styles.productGrid}>
                {[
                  { emoji: '🌾', name: t(language, 'whiteBasmati') },
                  { emoji: '🍚', name: t(language, 'basmatiIndian') },
                  { emoji: '✨', name: t(language, 'baldoRice') },
                  { emoji: '🥇', name: t(language, 'calroseRice') },
                ].map((product) => (
                  <View key={product.name} style={styles.productChip}>
                    <Text style={styles.productEmoji}>{product.emoji}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.bodyText, { marginTop: 12 }]}>
                {t(language, 'ourProductsSectionText2')}
              </Text>
              <TouchableOpacity
                style={styles.viewProductsBtn}
                onPress={() => navigation.navigate('Products')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewProductsBtnText}>{t(language, 'viewAllProducts')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Our Journey */}
          {renderSection(
            3,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'ourJourney')}</Text>
              <View style={styles.divider} />
              {MILESTONES.map((m, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  {i < MILESTONES.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineYear}>{m.year}</Text>
                    <Text style={styles.timelineEvent}>{m.event}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Certifications */}
          {renderSection(
            4,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'certificationsTitle')}</Text>
              <View style={styles.divider} />
              <Text style={styles.bodyText}>
                {t(language, 'certificationsText')}
              </Text>
              {CERTIFICATIONS.map((cert, i) => (
                <View key={i} style={styles.certRow}>
                  <Text style={styles.certText}>{cert}</Text>
                </View>
              ))}
            </>
          )}

          {/* Connect With Us */}
          {renderSection(
            5,
            <>
              <Text style={styles.sectionTitle}>{t(language, 'connectWithUs')}</Text>
              <View style={styles.divider} />
              <Text style={styles.bodyText}>
                {t(language, 'connectText')}
              </Text>
              <View style={styles.socialRow}>
                {SOCIAL_LINKS.map((s) => (
                  <TouchableOpacity
                    key={s.name}
                    style={[styles.socialBtn, { backgroundColor: s.color }]}
                    onPress={() => openLink(s.url)}
                  >
                    <Text style={styles.socialBtnText}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.contactMini}>
                <Text style={styles.contactMiniText}>📧 info@mahmoodrice.com</Text>
                <Text style={styles.contactMiniText}>📞 00971 4 8863664</Text>
                <Text style={styles.contactMiniText}>🌐 www.mahmoodrice.com</Text>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerEmoji: { fontSize: 48, marginBottom: 4 },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A148C',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#EDE7F6',
    borderRadius: 1,
    marginVertical: 14,
    width: '30%',
    alignSelf: 'center',
  },
  bodyText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },

  /* Quote */
  quoteBox: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#7C4DFF',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
  },
  quoteText: {
    fontSize: 14,
    color: '#4A148C',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  /* Products */
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  productEmoji: { fontSize: 16 },
  productName: { fontSize: 12, fontWeight: '600', color: '#4A148C' },
  viewProductsBtn: {
    backgroundColor: '#4A148C',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 14,
  },
  viewProductsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Timeline */
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    minHeight: 60,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7C4DFF',
    marginTop: 4,
    marginRight: 14,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 18,
    bottom: -4,
    width: 2,
    backgroundColor: '#D1C4E9',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineYear: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A148C',
    marginBottom: 2,
  },
  timelineEvent: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },

  /* Certifications */
  certRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  certText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  /* Social */
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  socialBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  contactMini: {
    alignItems: 'center',
    gap: 4,
  },
  contactMiniText: {
    fontSize: 13,
    color: '#666',
  },
});

