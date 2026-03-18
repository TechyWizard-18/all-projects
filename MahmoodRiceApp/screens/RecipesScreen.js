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

const RECIPES = [
  {
    id: '1',
    title: 'Classic Chicken Biryani',
    emoji: '🍗',
    time: '60 min',
    difficulty: 'Medium',
    servings: '4-6',
    image: null,
    description:
      'A fragrant and flavorful rice dish layered with tender marinated chicken, aromatic spices, and saffron-infused Mahmood Basmati Rice.',
    ingredients: [
      '2 cups Mahmood Basmati Rice',
      '500g chicken (bone-in pieces)',
      '2 large onions, thinly sliced',
      '1 cup yogurt',
      '2 tomatoes, chopped',
      '1 tsp turmeric, 1 tsp red chili powder',
      '1 tsp garam masala, 1 tsp biryani masala',
      'A pinch of saffron soaked in warm milk',
      'Fresh mint and coriander leaves',
      'Ghee, salt to taste',
    ],
    steps: [
      'Wash and soak the Mahmood Basmati Rice for 30 minutes, then parboil until 70% cooked. Drain and set aside.',
      'Marinate chicken with yogurt, turmeric, red chili, garam masala, salt, and half the mint/coriander. Rest for 30 mins.',
      'Fry sliced onions in ghee until golden brown. Remove half for garnish.',
      'Add tomatoes and marinated chicken to the pot. Cook on medium heat for 15 mins until chicken is almost done.',
      'Layer the parboiled rice over the chicken. Drizzle saffron milk, fried onions, and remaining mint/coriander on top.',
      'Seal the pot with foil and lid. Cook on low heat (dum) for 20 minutes.',
      'Gently mix and serve hot with raita!',
    ],
  },
  {
    id: '2',
    title: 'Vegetable Fried Rice',
    emoji: '🥗',
    time: '25 min',
    difficulty: 'Easy',
    servings: '3-4',
    image: null,
    description:
      'A quick and tasty stir-fried rice loaded with colorful vegetables, soy sauce, and a hint of sesame — perfect for a weeknight dinner.',
    ingredients: [
      '3 cups cooked Mahmood Basmati Rice (day-old works best)',
      '1 cup mixed vegetables (carrot, peas, corn, bell pepper)',
      '2 eggs, beaten',
      '3 tbsp soy sauce',
      '1 tbsp sesame oil',
      '2 cloves garlic, minced',
      '2 green onions, chopped',
      'Salt and pepper to taste',
      'Oil for cooking',
    ],
    steps: [
      'Heat oil in a large wok or pan over high heat.',
      'Scramble the eggs quickly, break into pieces, and set aside.',
      'Add garlic and stir-fry mixed vegetables for 2-3 minutes until tender-crisp.',
      'Add the cooked Mahmood Basmati Rice and toss well.',
      'Pour soy sauce and sesame oil, stir-fry for 3-4 minutes.',
      'Add the scrambled eggs back, mix evenly.',
      'Garnish with green onions and serve hot!',
    ],
  },
  {
    id: '3',
    title: 'Creamy Mushroom Risotto',
    emoji: '🍄',
    time: '40 min',
    difficulty: 'Medium',
    servings: '3-4',
    image: null,
    description:
      'A luxurious Italian-style risotto made creamy with butter and parmesan, featuring earthy mushrooms and Mahmood premium rice.',
    ingredients: [
      '1.5 cups Mahmood Rice',
      '200g mushrooms (button or cremini), sliced',
      '1 small onion, finely diced',
      '2 cloves garlic, minced',
      '4 cups warm vegetable/chicken broth',
      '½ cup white wine (optional)',
      '2 tbsp butter',
      '¼ cup grated parmesan cheese',
      'Fresh thyme or parsley',
      'Salt and pepper to taste',
    ],
    steps: [
      'Sauté mushrooms in butter until golden. Set aside.',
      'In the same pan, cook diced onion until soft. Add garlic, stir for 30 seconds.',
      'Add the Mahmood Rice and toast for 1-2 minutes, stirring constantly.',
      'Add wine (if using) and stir until absorbed.',
      'Add warm broth one ladle at a time, stirring frequently. Wait until each addition is absorbed before adding more.',
      'After about 20 mins, the rice should be creamy and al dente. Stir in mushrooms, parmesan, and a knob of butter.',
      'Season with salt, pepper, and fresh herbs. Serve immediately!',
    ],
  },
  {
    id: '4',
    title: 'Lamb Kabsa (Arabian Rice)',
    emoji: '🐑',
    time: '90 min',
    difficulty: 'Hard',
    servings: '6-8',
    image: null,
    description:
      'A traditional Arabian one-pot feast of spiced lamb and aromatic long-grain Mahmood Rice — a staple dish across the Middle East.',
    ingredients: [
      '3 cups Mahmood Basmati Rice',
      '700g lamb (bone-in, shoulder or leg)',
      '2 onions, diced',
      '3 tomatoes, blended',
      '4 cloves garlic, minced',
      '1 tsp cinnamon, 1 tsp black lime (loomi)',
      '1 tsp cumin, ½ tsp cardamom, 2 bay leaves',
      '2 tbsp tomato paste',
      'Fried raisins and almonds for garnish',
      'Salt, oil, 4 cups water',
    ],
    steps: [
      'Sear lamb pieces in hot oil until browned on all sides. Remove and set aside.',
      'Fry onions until golden, add garlic and all spices. Cook for 1 minute.',
      'Add blended tomatoes and tomato paste. Cook for 5 minutes.',
      'Return lamb to the pot. Add 4 cups water, bring to boil, then simmer for 45-60 mins until tender.',
      'Remove lamb and measure the broth — you need about 3 cups. Adjust with water if needed.',
      'Wash and soak Mahmood Basmati Rice for 20 mins. Add rice to the broth, cook on low heat (covered) until rice absorbs all liquid.',
      'Plate the rice, place lamb on top, garnish with fried raisins and almonds. Serve with salad!',
    ],
  },
  {
    id: '5',
    title: 'Mango Sticky Rice Dessert',
    emoji: '🥭',
    time: '45 min',
    difficulty: 'Easy',
    servings: '4',
    image: null,
    description:
      'A heavenly Thai-inspired dessert combining sweet ripe mangoes with coconut-infused Mahmood Rice — the perfect end to any meal.',
    ingredients: [
      '1.5 cups Mahmood Rice (short-grain or sticky variety)',
      '1 cup coconut milk',
      '⅓ cup sugar',
      '¼ tsp salt',
      '2 ripe mangoes, peeled and sliced',
      '1 tbsp toasted sesame seeds (optional)',
      'Extra coconut milk for drizzling',
    ],
    steps: [
      'Soak the Mahmood Rice in water for at least 4 hours or overnight.',
      'Steam the soaked rice for 20-25 minutes until fully cooked and sticky.',
      'While rice steams, heat coconut milk with sugar and salt until dissolved. Do not boil.',
      'Pour ¾ of the coconut sauce over the steamed rice. Gently fold and let it sit for 10 minutes to absorb.',
      'Plate the coconut rice, arrange mango slices alongside.',
      'Drizzle remaining coconut sauce on top and sprinkle sesame seeds.',
      'Serve at room temperature. Enjoy!',
    ],
  },
];

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/mahmoodriceglobal/',
  instagram: 'https://www.instagram.com/mahmoodriceglobal',
  twitter: 'https://x.com/mahmood_rice',
  youtube: 'https://youtube.com/@mahmoodriceglobal?si=CgtC5LN5aJ9AZDif',
};

export default function RecipesScreen({ navigation }) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(RECIPES.map(() => new Animated.Value(0))).current;
  const [expandedId, setExpandedId] = React.useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 120,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const getDifficultyColor = (d) => {
    if (d === 'Easy') return '#4CAF50';
    if (d === 'Medium') return '#FF9800';
    return '#F44336';
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
          <Text style={styles.headerTitle}>{t(language, 'recipesTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t(language, 'recipesSubtitle')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {RECIPES.map((recipe, index) => (
            <Animated.View
              key={recipe.id}
              style={[
                styles.recipeCard,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={0.85} onPress={() => toggleExpand(recipe.id)}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.emojiCircle}>
                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaTag}>🕒 {recipe.time}</Text>
                      <Text
                        style={[styles.metaTag, { color: getDifficultyColor(recipe.difficulty) }]}
                      >
                        {recipe.difficulty}
                      </Text>
                      <Text style={styles.metaTag}>👥 {recipe.servings}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{expandedId === recipe.id ? '▲' : '▼'}</Text>
                </View>

                {/* Description always visible */}
                <Text style={styles.recipeDesc}>{recipe.description}</Text>
              </TouchableOpacity>

              {/* Expanded content */}
              {expandedId === recipe.id && (
                <View style={styles.expandedContent}>
                  {/* Ingredients */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t(language, 'ingredients')}</Text>
                    {recipe.ingredients.map((ing, i) => (
                      <View key={i} style={styles.ingredientRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Steps */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t(language, 'howToCook')}</Text>
                    {recipe.steps.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          ))}

          {/* More Recipes CTA */}
          <View style={styles.moreRecipesCard}>
            <Text style={styles.moreRecipesTitle}>{t(language, 'wantMoreRecipes')}</Text>
            <Text style={styles.moreRecipesText}>
              {t(language, 'moreRecipesText')}
            </Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => openLink(SOCIAL_LINKS.facebook)}
              >
                <Text style={styles.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#E4405F' }]}
                onPress={() => openLink(SOCIAL_LINKS.instagram)}
              >
                <Text style={styles.socialBtnText}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#000' }]}
                onPress={() => openLink(SOCIAL_LINKS.twitter)}
              >
                <Text style={styles.socialBtnText}>X / Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#FF0000' }]}
                onPress={() => openLink(SOCIAL_LINKS.youtube)}
              >
                <Text style={styles.socialBtnText}>YouTube</Text>
              </TouchableOpacity>
            </View>
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

  /* Recipe Card */
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeEmoji: { fontSize: 26 },
  cardHeaderText: { flex: 1 },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaTag: {
    fontSize: 11,
    color: '#777',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    color: '#7C4DFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recipeDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },

  /* Expanded */
  expandedContent: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 14,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#7C4DFF',
    marginRight: 8,
    lineHeight: 20,
  },
  ingredientText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },

  /* More Recipes */
  moreRecipesCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  moreRecipesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  moreRecipesText: {
    fontSize: 13,
    color: '#D1C4E9',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
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
});

