import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Provider as PaperProvider, Button, Card, Title, Paragraph, IconButton, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Import Local Data
import quranData from './assets/quran_data.json';
import LoginScreen from './screens/LoginScreen';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

// --- Theme ---
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#059669',
    secondary: '#10b981',
    background: '#f8fafc',
  },
};

// --- Auth Context ---
const AuthContext = createContext<any>(null);

// --- Tajweed Helper ---
const toArabicNumerals = (n: number) => {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          'NooreHira': require('./assets/fonts/NooreHira-Regular.ttf'),
          'NooreHiraBold': require('./assets/fonts/NooreHira-Bold.ttf'),
        });

        // Check for stored user
        const storedUser = await SecureStore.getItemAsync('userData');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    loadResources();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthContext.Provider>
  );
}

// --- Navigation ---
const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Home') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Surahs') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Admin') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Surahs" component={SurahsScreen} />
      <Tab.Screen name="Admin" component={AdminScreen} />
    </Tab.Navigator>
  );
}

// --- Screens ---

function HomeScreen({ navigation }: any) {
  const [kitabs, setKitabs] = useState<any[]>([]);

  useEffect(() => {
    setKitabs(quranData as any[]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('./assets/quran_header.png')} style={styles.headerImage} resizeMode="cover">
        <View style={styles.overlay}>
          <Title style={styles.headerTitle}>Quran App</Title>
          <Paragraph style={styles.headerSubtitle}>Read, Listen, Reflect</Paragraph>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Title style={styles.sectionTitle}>Holy Books</Title>
        <FlatList
          data={kitabs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate('Surahs', { kitabId: item.id })}>
              <Card.Content style={styles.cardContent}>
                <View>
                  <Title style={{ fontFamily: 'NooreHiraBold' }}>{item.nameArabic}</Title>
                  <Paragraph>{item.name}</Paragraph>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#059669" />
              </Card.Content>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function SurahsScreen({ route }: any) {
  const [surahs, setSurahs] = useState<any[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<any>(null);

  // Audio State
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  const player = useAudioPlayer(currentAudioUri);

  useEffect(() => {
    const data = quranData as any[];
    if (data.length > 0) {
      setSurahs(data[0].surahs);
    }
  }, []);

  // Audio Logic Fix
  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.play();
      }

      const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish && !status.isLooping) {
          // IMPORTANT: We must use the functional update or ref to get the latest state
          // But here we rely on the effect dependency [autoPlay]
          if (autoPlay) {
            // Logic to play next is handled by a separate function, but we need to trigger it.
            // We can't call playNextAyah directly easily if it depends on state that isn't in dependency array.
            // Let's use a ref or simple logic here.
            playNextAyahRef.current();
          } else {
            setIsPlaying(false);
            setCurrentPlayingAyah(null);
          }
        }
      });
      return () => subscription.remove();
    }
  }, [player, isPlaying, autoPlay]);

  // Ref to access latest state in callback
  const playNextAyahRef = useRef(() => { });

  const playAyahAudio = (surahNum: number, ayahNum: number) => {
    const s = surahNum.toString().padStart(3, '0');
    const a = ayahNum.toString().padStart(3, '0');
    const uri = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;

    if (currentAudioUri !== uri) {
      setCurrentAudioUri(uri);
    }
    setCurrentPlayingAyah(ayahNum);
    setIsPlaying(true);
    setAutoPlay(true);
  };

  const stopAudio = () => {
    if (player) player.pause();
    setIsPlaying(false);
    setCurrentPlayingAyah(null);
    setAutoPlay(false);
  };

  const playNextAyah = () => {
    if (selectedSurah && currentPlayingAyah) {
      const nextAyahNum = currentPlayingAyah + 1;
      if (nextAyahNum <= selectedSurah.versesCount) {
        playAyahAudio(selectedSurah.surahNumber, nextAyahNum);
      } else {
        stopAudio();
      }
    }
  };

  // Update ref whenever dependencies change
  useEffect(() => {
    playNextAyahRef.current = playNextAyah;
  }, [selectedSurah, currentPlayingAyah]);


  if (selectedSurah) {
    return (
      <ReaderView
        surah={selectedSurah}
        onBack={() => { stopAudio(); setSelectedSurah(null); }}
        isPlaying={isPlaying}
        currentPlayingAyah={currentPlayingAyah}
        onPlayAyah={playAyahAudio}
        onStop={stopAudio}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Surahs</Title>
      </View>
      <FlatList
        data={surahs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.surahCard} onPress={() => setSelectedSurah(item)}>
            <Card.Content style={styles.surahCardContent}>
              <View style={styles.surahNumberBadge}>
                <Text style={styles.surahNumberText}>{item.surahNumber}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Title style={{ fontFamily: 'NooreHiraBold' }}>{item.nameArabic}</Title>
                  <Paragraph>{item.name}</Paragraph>
                </View>
                <Paragraph style={{ color: '#64748b', fontSize: 12 }}>{item.revelation} • {item.versesCount} Ayahs</Paragraph>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

function ReaderView({ surah, onBack, isPlaying, currentPlayingAyah, onPlayAyah, onStop }: any) {
  const [fontSize, setFontSize] = useState(24);
  const [isBold, setIsBold] = useState(false);
  const { user } = useContext(AuthContext);

  const decreaseFontSize = () => setFontSize(Math.max(16, fontSize - 2));

  const exportSurahToPDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
              body { font-family: 'Amiri', serif; text-align: center; padding: 40px; border: 5px double #059669; min-height: 90vh; }
              h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
              .bismillah { font-size: 30px; margin-bottom: 30px; }
              .ayah { font-size: 24px; margin-bottom: 15px; direction: rtl; line-height: 2; }
            </style>
          </head>
          <body>
            <h1>${surah.nameArabic}</h1>
            ${surah.surahNumber !== 1 ? '<div class="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : ''}
            ${surah.ayahs.map((a: any) => `<div class="ayah">${a.textArabic} ۝${toArabicNumerals(a.ayahNumber)}</div>`).join('')}
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      alert('Error exporting PDF');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.readerHeader}>
        <IconButton icon="arrow-left" onPress={onBack} iconColor="#059669" />
        <Title style={{ fontFamily: 'NooreHiraBold' }}>{surah.nameArabic}</Title>
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="file-pdf-box" onPress={exportSurahToPDF} iconColor="#059669" />
          <IconButton icon="minus" onPress={decreaseFontSize} />
          <IconButton icon="format-size" onPress={() => setFontSize(Math.min(40, fontSize + 2))} />
          <IconButton icon={isBold ? "format-bold" : "format-text"} onPress={() => setIsBold(!isBold)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.readerContent}>
        <View style={styles.ornamentalBorder}>
          <View style={styles.ornamentalHeader}>
            <ImageBackground source={require('./assets/quran_header.png')} style={styles.surahHeaderImage} resizeMode="cover">
              <View style={styles.surahHeaderOverlay}>
                <Text style={styles.surahHeaderTitle}>{surah.nameArabic}</Text>
                <Text style={styles.surahHeaderSubtitle}>{surah.name}</Text>
              </View>
            </ImageBackground>
          </View>

          {surah.surahNumber !== 1 && (
            <Text style={[styles.bismillah, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
          )}

          <Text style={styles.quranText}>
            {surah.ayahs.map((ayah: any) => {
              const isActive = currentPlayingAyah === ayah.ayahNumber;
              return (
                <Text key={ayah.id} onPress={() => onPlayAyah(surah.surahNumber, ayah.ayahNumber)}>
                  <Text style={[
                    styles.arabicText,
                    { fontSize, fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira', color: isActive ? '#059669' : '#000' }
                  ]}>
                    {ayah.textArabic}
                  </Text>
                  <Text style={[styles.ayahEnd, { fontSize: fontSize - 5, fontFamily: 'NooreHira' }]}>
                    {' '}۝{toArabicNumerals(ayah.ayahNumber)}{' '}
                  </Text>
                </Text>
              );
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Admin Controls (Floating) */}
      {user && user.role === 'admin' && (
        <View style={styles.adminFab}>
          <Button mode="contained" icon="pencil" onPress={() => alert('Edit Mode Coming Soon')}>Edit Surah</Button>
        </View>
      )}
    </SafeAreaView>
  );
}

function AdminScreen() {
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.sectionTitle}>Admin Dashboard</Title>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome, {user.name || 'Admin'}</Title>
            <Paragraph>Email: {user.email}</Paragraph>
            <Paragraph>Role: {user.role}</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleLogout} color="red">Logout</Button>
          </Card.Actions>
        </Card>

        <Title style={{ marginTop: 20, marginBottom: 10 }}>Manage Content</Title>
        <Button mode="outlined" style={styles.actionBtn} icon="book" onPress={() => alert('Manage Kitabs')}>Manage Kitabs</Button>
        <Button mode="outlined" style={styles.actionBtn} icon="file-document" onPress={() => alert('Manage Surahs')}>Manage Surahs</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerImage: { height: 200, justifyContent: 'flex-end' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { color: '#e2e8f0', fontSize: 16 },
  content: { padding: 20, flex: 1 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  card: { marginBottom: 15, backgroundColor: '#fff', elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Surah List
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  surahCard: { marginBottom: 10, marginHorizontal: 15, backgroundColor: '#fff' },
  surahCardContent: { flexDirection: 'row', alignItems: 'center' },
  surahNumberBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  surahNumberText: { color: '#059669', fontWeight: 'bold' },

  // Reader
  readerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#fff', elevation: 2 },
  readerContent: { padding: 20, paddingBottom: 80 },
  bismillah: { textAlign: 'center', fontSize: 28, marginBottom: 20, color: '#000' },
  quranText: { textAlign: 'justify', writingDirection: 'rtl', lineHeight: 50 },
  arabicText: { color: '#000' },
  ayahEnd: { color: '#059669' },

  adminFab: { position: 'absolute', bottom: 20, right: 20 },
  actionBtn: { marginBottom: 10, borderColor: '#059669' },

  // Ornamental UI
  ornamentalBorder: {
    borderWidth: 3,
    borderColor: '#059669',
    borderStyle: 'solid',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  ornamentalHeader: {
    height: 150,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  surahHeaderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahHeaderOverlay: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },
  surahHeaderTitle: {
    fontFamily: 'NooreHiraBold',
    fontSize: 28,
    color: '#059669',
  },
  surahHeaderSubtitle: {
    fontSize: 16,
    color: '#334155',
  },
});