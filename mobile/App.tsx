import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Screens
import HomeScreen from './screens/HomeScreen';
import SurahsScreen from './screens/SurahsScreen';
import AdminScreen from './screens/AdminScreen';

const Tab = createBottomTabNavigator();
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

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="Library" component={HomeScreen} />
      <Stack.Screen name="Surahs" component={SurahsScreen} />
    </Stack.Navigator>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: any;
            if (route.name === 'Home') iconName = 'book-open-variant';
            else if (route.name === 'Admin') iconName = 'shield-account';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1e40af',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Admin" component={AdminScreen} />
      </Tab.Navigator>
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