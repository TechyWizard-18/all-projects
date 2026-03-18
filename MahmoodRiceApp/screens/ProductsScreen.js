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
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 200;
const BUY_URL = 'https://mahmoodrice.com/';

const getProductCategories = (lang) => [
  {
    id: 'white-basmati',
    name: t(lang, 'whiteBasmati'),
    image: require('../images/POUCH_STEAM_900.webp'),
    variants: ['900g', '5 Kg', '10 Kg'],
    color: '#4A148C',
    bgColor: '#F3E5F5',
  },
  {
    id: 'basmati-indian',
    name: t(lang, 'basmatiIndian'),
    image: require('../images/2nd-all.webp'),
    variants: ['900g', '4.5 Kg', '5 Kg', '10 Kg', '20 Kg', '25 Kg', '30 Kg', '35 Kg'],
    color: '#1B5E20',
    bgColor: '#E8F5E9',
  },
  {
    id: 'baldo',
    name: t(lang, 'baldoRice'),
    image: require('../images/BALDO RICE.webp'),
    variants: ['900g', '5 Kg'],
    color: '#E65100',
    bgColor: '#FFF3E0',
  },
  {
    id: 'calrose',
    name: t(lang, 'calroseRice'),
    image: require('../images/CALROSE.webp'),
    variants: ['1 Kg', '4 Kg', '5 Kg'],
    color: '#0D47A1',
    bgColor: '#E3F2FD',
  },
];

export default function ProductsScreen({ navigation }) {
  const { language } = useLanguage();
  const PRODUCT_CATEGORIES = getProductCategories(language);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(PRODUCT_CATEGORIES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 300 + index * 180,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const openStore = () => {
    Linking.openURL(BUY_URL).catch(() => {});
  };

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
          <Text style={styles.headerTitle}>{t(language, 'ourProductsTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t(language, 'premiumRice')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {PRODUCT_CATEGORIES.map((category, index) => (
            <Animated.View
              key={category.id}
              style={[
                styles.productCard,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Product Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={category.image}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>

              {/* Product Info */}
              <View style={styles.infoContainer}>
                <Text style={[styles.productName, { color: category.color }]}>
                  {category.name}
                </Text>

                <View style={[styles.divider, { backgroundColor: category.color + '30' }]} />

                {/* Variant Labels */}
                <Text style={styles.variantsLabel}>{t(language, 'availableIn')}</Text>
                <View style={styles.variantsGrid}>
                  {category.variants.map((variant) => (
                    <View
                      key={variant}
                      style={[styles.variantChip, { backgroundColor: category.bgColor, borderColor: category.color + '40' }]}
                    >
                      <Text style={[styles.variantText, { color: category.color }]}>{variant}</Text>
                    </View>
                  ))}
                </View>

                {/* Buy Button */}
                <TouchableOpacity
                  style={[styles.buyButton, { backgroundColor: category.color }]}
                  onPress={openStore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyButtonText}>{t(language, 'buyNow')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}

          {/* Bottom CTA */}
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>{t(language, 'visitStore')}</Text>
            <Text style={styles.ctaText}>
              {t(language, 'visitStoreText')}
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={openStore} activeOpacity={0.8}>
              <Text style={styles.ctaButtonText}>{t(language, 'visitWebsite')}</Text>
            </TouchableOpacity>
          </View>

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
    paddingBottom: 12,
  },
  backButton: { marginBottom: 8 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#D1C4E9',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /* Product Card */
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  imageContainer: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CARD_IMAGE_HEIGHT,
  },
  productImage: {
    width: width - 64,
    height: CARD_IMAGE_HEIGHT,
  },
  infoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    borderRadius: 1,
    marginVertical: 14,
    width: '40%',
    alignSelf: 'center',
  },
  variantsLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  variantChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  variantText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buyButton: {
    paddingVertical: 13,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 4,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Bottom CTA */
  ctaCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginTop: 4,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#D1C4E9',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#4A148C',
    fontSize: 15,
    fontWeight: '700',
  },
});

