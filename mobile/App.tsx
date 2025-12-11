import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Screens
// Screens
import HomeScreen from './screens/HomeScreen';
import SurahsScreen from './screens/SurahsScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1e40af',
    accent: '#3b82f6',
    background: '#f8fafc',
  },
};

import { StatusBar } from 'expo-status-bar';

// ... imports

import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Surahs" component={SurahsScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'NooreHira': require('./assets/fonts/NooreHira-Regular.ttf'),
    'NooreHiraBold': require('./assets/fonts/NooreHira-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}