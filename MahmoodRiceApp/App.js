import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './i18n/LanguageContext';

import HomeScreen from './screens/HomeScreen';
import VerifyProductScreen from './screens/VerifyProductScreen';
import ResultScreen from './screens/ResultScreen';
import RecipesScreen from './screens/RecipesScreen';
import ContactScreen from './screens/ContactScreen';
import AboutScreen from './screens/AboutScreen';
import ProductsScreen from './screens/ProductsScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="VerifyProduct" component={VerifyProductScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Recipes" component={RecipesScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
