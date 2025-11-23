import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Image,
  ImageBackground,
  Animated,
} from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install if not available, or use Text icons

// Import Local Data
import quranData from './assets/quran_data.json';

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

// --- Tajweed Configuration ---


const toArabicNumerals = (n: number) => {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const [fontsLoaded] = Font.useFonts({
    'NooreHira': require('./assets/fonts/NooreHira-Regular.ttf'),
    'NooreHiraBold': require('./assets/fonts/NooreHira-Bold.ttf'),
  });

  const [kitabs, setKitabs] = useState<any[]>([]);
  const [selectedKitab, setSelectedKitab] = useState<any>(null);
  const [surahs, setSurahs] = useState<any[]>([]);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [selectedAyah, setSelectedAyah] = useState<any>(null);
  const [selectedSurah, setSelectedSurah] = useState<any>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'surahs' | 'reciters'>('home');
  const [view, setView] = useState<'landing' | 'list' | 'reader'>('landing'); // Start with landing
  const [isBold, setIsBold] = useState(false); // Font weight toggle

  const [bismillahTafsir, setBismillahTafsir] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState(28);

  // Audio State
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false); // New: Auto-play state

  const player = useAudioPlayer(currentAudioUri);

  // Animation for Landing
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Effect: Handle Player Events (Auto-play & Playback Status)
  useEffect(() => {
    if (player) {
      // Auto-play when player is ready and isPlaying is true
      if (isPlaying) {
        player.play();
      }

      // Listen for playback completion
      const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish && !status.isLooping) {
          if (autoPlay) {
            playNextAyah();
          } else {
            setIsPlaying(false);
            setCurrentPlayingAyah(null);
          }
        }
      });

      return () => subscription.remove();
    }
  }, [player, isPlaying, autoPlay]);

  // Load Initial Data & Hide Splash Screen
  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        try {
          const data = quranData as any[];
          setKitabs(data);
          // Default to first Kitab's Surahs for the 'Surahs' tab
          if (data.length > 0) {
            setSurahs(data[0].surahs);
          }
          await SplashScreen.hideAsync();

          // Start Landing Animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();

        } catch (e) {
          console.warn(e);
        }
      }
    }
    prepare();
  }, [fontsLoaded]);

  // Audio Logic
  const playAyahAudio = (surahNum: number, ayahNum: number, shouldAutoPlay = false) => {
    const s = surahNum.toString().padStart(3, '0');
    const a = ayahNum.toString().padStart(3, '0');
    const uri = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;

    // Only update URI if it's different to avoid reloading
    if (currentAudioUri !== uri) {
      setCurrentAudioUri(uri);
    }

    setCurrentPlayingAyah(ayahNum);
    setIsPlaying(true);
    if (shouldAutoPlay) setAutoPlay(true);
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
        playAyahAudio(selectedSurah.surahNumber, nextAyahNum, true);
        // Update selected Ayah for Modal view if open
        const nextAyah = ayahs.find(a => a.ayahNumber === nextAyahNum);
        if (nextAyah && selectedAyah) {
          setSelectedAyah(nextAyah);
        }
      } else {
        stopAudio(); // End of Surah
      }
    }
  };

  const playPreviousAyah = () => {
    if (selectedSurah && currentPlayingAyah) {
      const prevAyahNum = currentPlayingAyah - 1;
      if (prevAyahNum >= 1) {
        playAyahAudio(selectedSurah.surahNumber, prevAyahNum, true);
        // Update selected Ayah for Modal view if open
        const prevAyah = ayahs.find(a => a.ayahNumber === prevAyahNum);
        if (prevAyah && selectedAyah) {
          setSelectedAyah(prevAyah);
        }
      }
    }
  };

  const handleSurahPlay = (item: any) => {
    // Start playing from Ayah 1
    setSelectedSurah(item);
    setAyahs(item.ayahs);
    // We don't switch view to 'reader' automatically, just play? 
    // Or maybe we should switch to reader to show progress.
    // Let's switch to reader for better UX
    setView('reader');

    // Small timeout to allow state to update
    setTimeout(() => {
      playAyahAudio(item.surahNumber, 1, true);
    }, 100);
  };

  if (!fontsLoaded) {
    return null; // Splash screen handles this
  }

  const handleSurahPress = (item: any) => {
    setSelectedSurah(item);
    setAyahs(item.ayahs);
    setView('reader');
  };

  const renderSurahItem = ({ item }: any) => (
    <TouchableOpacity style={styles.surahCard} onPress={() => handleSurahPress(item)}>
      <View style={styles.surahNumberContainer}>
        <Text style={styles.surahNumber}>{item.surahNumber}</Text>
      </View>
      <View style={styles.surahText}>
        <Text style={[styles.surahArabic, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>{item.nameArabic}</Text>
        <Text style={styles.surahEnglish}>{item.name}</Text>
        <Text style={styles.surahInfo}>{item.revelation} • {item.versesCount} Ayahs</Text>
      </View>
      <TouchableOpacity style={styles.playButtonList} onPress={() => handleSurahPlay(item)}>
        <Text style={styles.playIcon}>▶</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (view === 'landing') {
      return (
        <ImageBackground source={require('./assets/landing.png')} style={styles.landingContainer} resizeMode="cover">
          <Animated.View style={[styles.landingContent, { opacity: fadeAnim }]}>
            <View style={styles.landingHeader}>
              <Text style={styles.landingTitle}>Quran App</Text>
              <Text style={styles.landingSubtitle}>Read, Listen, Reflect</Text>
            </View>

            <TouchableOpacity style={styles.enterButton} onPress={() => setView('list')}>
              <Text style={styles.enterButtonText}>Enter</Text>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      );
    }

    if (view === 'reader' && selectedSurah) {
      return (
        <View style={{ flex: 1 }}>
          {/* Reader Header */}
          <View style={styles.readerHeader}>
            <TouchableOpacity onPress={() => { setView('list'); stopAudio(); }} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>{selectedSurah.nameArabic}</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity onPress={() => setIsBold(!isBold)} style={styles.boldToggle}>
                <Text style={[styles.fontBtnText, { fontWeight: isBold ? 'bold' : 'normal' }]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize(Math.max(20, fontSize - 2))}><Text style={styles.fontBtnText}>A-</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize(Math.min(60, fontSize + 2))}><Text style={styles.fontBtnText}>A+</Text></TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.quranPage}>
            {/* Surah Info Block */}
            <View style={styles.surahInfoBlock}>
              <Text style={styles.surahInfoText}>
                {selectedSurah.versesCount} Ayahs • {selectedSurah.revelation}
              </Text>
            </View>

            {/* Bismillah */}
            {selectedSurah.surahNumber !== 1 && (
              <TouchableOpacity onPress={() => setBismillahTafsir(true)}>
                <Text style={[styles.bismillahText, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
              </TouchableOpacity>
            )}

            {/* Continuous Text */}
            <Text style={styles.quranText}>
              {ayahs.map((item, index) => {
                const isPlayingThis = currentPlayingAyah === item.ayahNumber;
                return (
                  <Text
                    key={item.id}
                    onPress={() => {
                      setSelectedAyah(item);
                      // Optional: Play audio on tap
                      // playAyahAudio(selectedSurah.surahNumber, item.ayahNumber);
                    }}>
                    <Text style={[styles.arabicText, { fontSize, color: isPlayingThis ? '#059669' : '#000', fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>
                      {item.textArabic}
                    </Text>
                    <Text style={[styles.ayahEndSymbol, { fontSize: fontSize - 4, fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>
                      {' '}۝{toArabicNumerals(item.ayahNumber)}{' '}
                    </Text>
                  </Text>
                );
              })}
            </Text>
          </ScrollView>
        </View>
      );
    }

    // Tab Views
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Holy Books</Text>
            <FlatList
              data={kitabs}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => {
                  setSurahs(item.surahs);
                  setActiveTab('surahs');
                }}>
                  <Text style={[styles.arabicTitle, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>{item.nameArabic}</Text>
                  <Text style={styles.englishTitle}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id.toString()}
            />
          </View>
        );
      case 'surahs':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Surahs</Text>
            <FlatList
              data={surahs}
              renderItem={renderSurahItem}
              keyExtractor={item => item.id.toString()}
            />
          </View>
        );
      case 'reciters':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Reciters</Text>
            <View style={styles.reciterCard}>
              <Text style={styles.reciterName}>Mishary Rashid Alafasy</Text>
              <Text style={styles.reciterInfo}>Default Reciter</Text>
            </View>
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748b' }}>More reciters coming soon...</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* Bottom Navigation (Only show if not in Reader mode and not Landing) */}
      {view !== 'reader' && view !== 'landing' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Kitabs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'surahs' && styles.navItemActive]}
            onPress={() => setActiveTab('surahs')}
          >
            <Text style={styles.navIcon}>📖</Text>
            <Text style={[styles.navText, activeTab === 'surahs' && styles.navTextActive]}>Surahs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'reciters' && styles.navItemActive]}
            onPress={() => setActiveTab('reciters')}
          >
            <Text style={styles.navIcon}>🎧</Text>
            <Text style={[styles.navText, activeTab === 'reciters' && styles.navTextActive]}>Reciters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tafsir Modal */}
      <Modal visible={!!selectedAyah || bismillahTafsir} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => { setSelectedAyah(null); setBismillahTafsir(false); }} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>

          <ScrollView style={styles.modalScroll}>
            {bismillahTafsir ? (
              <>
                <Text style={[styles.modalAyahArabic, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                <Text style={styles.tafsirText}>In the name of Allah, the Entirely Merciful, the Especially Merciful.</Text>
              </>
            ) : selectedAyah && (
              <>
                <Text style={[styles.modalAyahArabic, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>{selectedAyah.textArabic}</Text>
                <Text style={styles.modalAyahNumber}>Ayah {selectedAyah.ayahNumber}</Text>

                {/* Translation Section */}
                {selectedAyah.translation && selectedAyah.translation.length > 0 && (
                  <View style={styles.translationContainer}>
                    <Text style={styles.translationLabel}>Translation ({selectedAyah.translation[0].language}):</Text>
                    <Text style={[styles.modalTranslationText, { fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira' }]}>{selectedAyah.translation[0].text}</Text>
                  </View>
                )}

                {/* Audio Controls */}
                <View style={styles.audioControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={playPreviousAyah}>
                    <Text style={styles.controlIcon}>⏮</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.playPauseButton]}
                    onPress={() => isPlaying && currentPlayingAyah === selectedAyah.ayahNumber ? stopAudio() : playAyahAudio(selectedSurah.surahNumber, selectedAyah.ayahNumber, true)}
                  >
                    <Text style={styles.playPauseIcon}>
                      {isPlaying && currentPlayingAyah === selectedAyah.ayahNumber ? '⏸' : '▶'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlButton} onPress={playNextAyah}>
                    <Text style={styles.controlIcon}>⏭</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.stopButton} onPress={stopAudio}>
                  <Text style={styles.stopButtonText}>Stop Auto-Play</Text>
                </TouchableOpacity>

                {selectedAyah.tafsirs && selectedAyah.tafsirs.length > 0 ? (
                  selectedAyah.tafsirs.map((t: any, i: number) => (
                    <View key={i} style={styles.tafsirCard}>
                      <Text style={styles.tafsirScholar}>{t.scholar}</Text>
                      <Text style={styles.tafsirText}>{t.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20 }}>No tafsir available yet</Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  mainContent: { flex: 1 },
  loadingText: { flex: 1, textAlign: 'center', color: '#059669', fontSize: 18, paddingTop: 50 },

  // Landing
  landingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  landingContent: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 30, borderRadius: 20, width: '90%' },
  landingHeader: { marginBottom: 40, alignItems: 'center' },
  landingTitle: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  landingSubtitle: { fontSize: 20, color: '#e2e8f0', fontStyle: 'italic' },
  enterButton: { backgroundColor: '#059669', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  enterButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Navigation
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 5, paddingTop: 10, height: 70 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { borderTopWidth: 2, borderTopColor: '#059669', marginTop: -12, paddingTop: 10 },
  navIcon: { fontSize: 24, marginBottom: 2 },
  navText: { fontSize: 12, color: '#64748b' },
  navTextActive: { color: '#059669', fontWeight: 'bold' },

  // Tabs
  tabContent: { flex: 1, padding: 20 },
  tabTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },

  // Cards
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  surahCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  surahNumberContainer: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  surahNumber: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  surahText: { flex: 1 },
  surahArabic: { fontSize: 20, color: '#1e293b' },
  surahEnglish: { fontSize: 16, color: '#334155' },
  surahInfo: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  playButtonList: { padding: 10 },
  playIcon: { fontSize: 20, color: '#059669' },

  // Reader
  readerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 10 },
  backText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 20 },
  fontControls: { flexDirection: 'row', alignItems: 'center' },
  fontBtnText: { fontSize: 18, marginHorizontal: 8, color: '#059669' },
  boldToggle: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 5, marginRight: 5 },

  quranPage: { padding: 20, paddingBottom: 50 },
  surahInfoBlock: { alignItems: 'center', marginBottom: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 },
  surahInfoText: { fontSize: 14, color: '#64748b', fontFamily: 'NooreHira' },
  bismillahText: { fontSize: 28, color: '#000', textAlign: 'center', marginBottom: 20 },
  quranText: { textAlign: 'justify', writingDirection: 'rtl', lineHeight: 60 }, // Justified text for Book feel
  arabicText: { color: '#000' },
  ayahEndSymbol: { color: '#059669' },
  translationText: { color: '#334155', fontSize: 16, textAlign: 'right', fontStyle: 'italic', lineHeight: 24, marginTop: 10 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  closeButton: { padding: 20, alignItems: 'flex-end' },
  closeText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  modalAyahArabic: { fontSize: 32, textAlign: 'center', marginBottom: 20, lineHeight: 50 },
  modalAyahNumber: { textAlign: 'center', color: '#64748b', marginBottom: 20 },

  translationContainer: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 8, marginBottom: 20 },
  translationLabel: { fontSize: 14, fontWeight: 'bold', color: '#059669', marginBottom: 5 },
  modalTranslationText: { fontSize: 18, color: '#334155', lineHeight: 28 },

  audioControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  controlButton: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 50, marginHorizontal: 10 },
  playPauseButton: { backgroundColor: '#059669', padding: 15 },
  controlIcon: { fontSize: 24, color: '#1e293b' },
  playPauseIcon: { fontSize: 24, color: '#fff' },

  stopButton: { alignSelf: 'center', padding: 10, marginBottom: 20 },
  stopButtonText: { color: '#ef4444', fontWeight: 'bold' },

  audioButton: { display: 'none' }, // Hide old button
  audioButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  tafsirCard: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 15 },
  tafsirScholar: { fontWeight: 'bold', color: '#059669', marginBottom: 5 },
  tafsirText: { fontSize: 16, color: '#334155', lineHeight: 24 },

  // Reciter
  reciterCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  reciterName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  reciterInfo: { color: '#64748b', marginTop: 5 },

  // Titles
  arabicTitle: { fontSize: 24, color: '#1e293b' },
  englishTitle: { fontSize: 18, color: '#64748b' },
});