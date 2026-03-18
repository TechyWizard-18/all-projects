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

const CONTACT_INFO = {
  fax: '00971 4 8863665',
  phone: '00971 4 8863664',
  email: 'info@mahmoodrice.com',
  address:
    'ALTUNKAYA FZCO ROUTE JF09 SOUTH ZONE 1 Plot no: S10901 JEBEL ALI FREEZONE PO BOX 262716 UNITED ARAB EMIRATES',
};

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    emoji: '🔵',
    color: '#1877F2',
    url: 'https://www.facebook.com/mahmoodriceglobal/',
  },
  {
    name: 'Instagram',
    emoji: '📸',
    color: '#E4405F',
    url: 'https://www.instagram.com/mahmoodriceglobal',
  },
  {
    name: 'X / Twitter',
    emoji: '🐦',
    color: '#1DA1F2',
    url: 'https://x.com/mahmood_rice',
  },
  {
    name: 'YouTube',
    emoji: '▶️',
    color: '#FF0000',
    url: 'https://youtube.com/@mahmoodriceglobal?si=CgtC5LN5aJ9AZDif',
  },
];

export default function ContactScreen({ navigation }) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef([
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

    cardAnims.forEach((anim, index) => {
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

  const makeCall = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`).catch(() => {});
  };

  const sendEmail = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`).catch(() => {});
  };

  const makeFax = () => {
    Linking.openURL(`tel:${CONTACT_INFO.fax.replace(/\s/g, '')}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A237E', '#283593', '#3949AB']} style={styles.gradient}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t(language, 'back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(language, 'contactTitle')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Consumer Line */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[0],
                transform: [
                  {
                    translateY: cardAnims[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{t(language, 'consumerLine')}</Text>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactRow} onPress={makeFax}>
              <Text style={styles.contactLabel}>{t(language, 'fax')}</Text>
              <Text style={styles.contactValue}>{CONTACT_INFO.fax}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={makeCall}>
              <Text style={styles.contactLabel}>{t(language, 'phone')}</Text>
              <Text style={styles.contactValue}>{CONTACT_INFO.phone}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Address */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[1],
                transform: [
                  {
                    translateY: cardAnims[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{t(language, 'address')}</Text>
            <View style={styles.divider} />
            <Text style={styles.addressText}>{CONTACT_INFO.address}</Text>
          </Animated.View>

          {/* Email */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[2],
                transform: [
                  {
                    translateY: cardAnims[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{t(language, 'email')}</Text>
            <View style={styles.divider} />
            <TouchableOpacity onPress={sendEmail}>
              <Text style={styles.emailText}>{CONTACT_INFO.email}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Social Media */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[3],
                transform: [
                  {
                    translateY: cardAnims[3].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.cardTitle}>{t(language, 'socialMedia')}</Text>
            <View style={styles.divider} />
            <View style={styles.socialGrid}>
              {SOCIAL_LINKS.map((social) => (
                <TouchableOpacity
                  key={social.name}
                  style={[styles.socialCard, { backgroundColor: social.color }]}
                  onPress={() => openLink(social.url)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialEmoji}>{social.emoji}</Text>
                  <Text style={styles.socialName}>{social.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

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
    paddingBottom: 15,
  },
  backButton: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /* Cards */
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#E8EAF6',
    borderRadius: 1,
    marginVertical: 14,
    width: '40%',
    alignSelf: 'center',
  },

  /* Contact Row */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 14,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    width: 60,
  },
  contactValue: {
    fontSize: 15,
    color: '#D4A017',
    fontWeight: '700',
  },

  /* Address */
  addressText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },

  /* Email */
  emailText: {
    fontSize: 16,
    color: '#D4A017',
    fontWeight: '700',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },

  /* Social */
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  socialCard: {
    width: (width - 100) / 2,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  socialName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

