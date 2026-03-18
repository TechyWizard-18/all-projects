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
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');

const getMenuItems = (lang) => [
  { id: '1', title: t(lang, 'verifyProduct'), icon: '🔍', color: '#7C4DFF', screen: 'VerifyProduct' },
  { id: '2', title: t(lang, 'ourProducts'), icon: '🌾', color: '#2E7D32', screen: 'Products' },
  { id: '3', title: t(lang, 'recipes'), icon: '🍚', color: '#FF7043', screen: 'Recipes' },
  { id: '4', title: t(lang, 'aboutUs'), icon: 'ℹ️', color: '#AB47BC', screen: 'About' },
  { id: '5', title: t(lang, 'contactUs'), icon: '📞', color: '#EF5350', screen: 'Contact' },
  { id: '6', title: t(lang, 'settings'), icon: '⚙️', color: '#78909C', screen: 'Settings' },
];

export default function HomeScreen({ navigation }) {
  const { language } = useLanguage();
  const MENU_ITEMS = getMenuItems(language);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef(MENU_ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate header
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate menu items with stagger
    const staggerAnimations = scaleAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, staggerAnimations).start();
  }, []);

  const handlePress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A148C', '#6A1B9A', '#7C4DFF']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.logo}>🌾</Text>
            <Text style={styles.title}>{t(language, 'appName')}</Text>
            <Text style={styles.subtitle}>{t(language, 'appSubtitle')}</Text>
          </Animated.View>

          {/* Menu Grid */}
          <View style={styles.grid}>
            {MENU_ITEMS.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: scaleAnims[index],
                    transform: [
                      {
                        scale: scaleAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Text style={styles.icon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: item.color }]}>
                    <Text style={styles.badgeText}>{t(language, 'active')}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#D1C4E9',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
});
