import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Paragraph, Card, IconButton } from 'react-native-paper';
import axios from 'axios';
import { useAudioPlayer } from 'expo-audio';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants';
import EditSurahModal from '../components/EditSurahModal';
import ReaderView from './ReaderView';
import quranData from '../assets/quran_data.json'; // Fallback data

function SurahsScreen({ route }: any) {
    const { kitabId } = route.params;
    const [surahs, setSurahs] = useState<any[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<any>(null);
    const [fatihaData, setFatihaData] = useState<any>(null);
    const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
    const [playingBismillah, setPlayingBismillah] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const player = useAudioPlayer(currentAudioUri);
    const playNextAyahRef = useRef(() => { });

    const { user } = useContext(AuthContext);
    const [editingSurah, setEditingSurah] = useState<any>(null);

    const fetchSurahs = async () => {
        try {
            const response = await axios.get(`${API_URL}/surahs?kitabId=${kitabId}`);
            setSurahs(response.data);
        } catch (error) {
            console.error('Failed to fetch surahs', error);
            // Fallback
            const data = quranData as any[];
            if (data.length > 0) {
                setSurahs(data[0].surahs);
            }
        }
    };

    const fetchFatiha = async () => {
        try {
            const response = await axios.get(`${API_URL}/surahs/1`);
            setFatihaData(response.data);
        } catch (error) {
            console.error('Failed to fetch Fatiha', error);
        }
    };

    useEffect(() => {
        fetchSurahs();
        fetchFatiha();
    }, [kitabId]);

    const updateSurah = async (id: number, data: any) => {
        await axios.put(`${API_URL}/surahs/${id}`, data);
    };

    const updateAyah = async (id: number, data: any) => {
        await axios.put(`${API_URL}/ayahs/${id}`, data);
        // Refresh surah details
        if (selectedSurah) {
            const response = await axios.get(`${API_URL}/surahs/${selectedSurah.id}`);
            setSelectedSurah(response.data);
        }
    };

    useEffect(() => {
        if (player) {
            if (isPlaying) {
                player.play();
            }

            const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
                if (status.didJustFinish && !status.isLooping) {
                    if (autoPlay) {
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

    const playAyahAudio = (surahNum: number, ayahNum: number, isBismillah: boolean = false) => {
        let uri = '';

        if (isBismillah && fatihaData?.ayahs?.[0]) {
            uri = fatihaData.ayahs[0].audioUrl || `https://everyayah.com/data/Alafasy_128kbps/001001.mp3`;
        } else {
            // Find the ayah in selectedSurah to check for custom audio
            // Note: selectedSurah might be null if we are just playing from a list, but here we usually have it.
            // If surahNum is different from selectedSurah (unlikely in this view unless playing next surah?), we might fallback.
            const ayah = selectedSurah?.ayahs?.find((a: any) => a.ayahNumber === ayahNum);

            if (ayah?.audioUrl) {
                uri = ayah.audioUrl;
            } else {
                const s = surahNum.toString().padStart(3, '0');
                const a = ayahNum.toString().padStart(3, '0');
                uri = `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
            }
        }

        if (currentAudioUri !== uri) {
            setCurrentAudioUri(uri);
        }
        setPlayingBismillah(isBismillah);
        setCurrentPlayingAyah(ayahNum);
        setIsPlaying(true);
        setAutoPlay(true);
    };

    const stopAudio = () => {
        if (player) player.pause();
        setIsPlaying(false);
        setCurrentPlayingAyah(null);
        setPlayingBismillah(false);
        setAutoPlay(false);
    };

    const pauseAudio = () => {
        if (player) player.pause();
        setIsPlaying(false);
        setAutoPlay(false);
    };

    const playNextAyah = () => {
        if (playingBismillah && selectedSurah) {
            // BUG FIX: For Surah Fatiha (1), after Bismillah (Ayah 1), we should go to Ayah 2.
            // For others, we go to Ayah 1.
            const nextAyah = selectedSurah.surahNumber === 1 ? 2 : 1;
            playAyahAudio(selectedSurah.surahNumber, nextAyah, false);
        } else if (selectedSurah && currentPlayingAyah) {
            const nextAyahNum = currentPlayingAyah + 1;
            if (nextAyahNum <= selectedSurah.versesCount) {
                playAyahAudio(selectedSurah.surahNumber, nextAyahNum, false);
            } else {
                stopAudio();
            }
        }
    };

    const playPrevAyah = () => {
        if (currentPlayingAyah === 1 && !playingBismillah && selectedSurah) {
            // Go back to Bismillah
            playAyahAudio(1, 1, true);
        } else if (selectedSurah && currentPlayingAyah && !playingBismillah) {
            const prevAyahNum = currentPlayingAyah - 1;
            // For Fatiha, if we are at Ayah 2, prev should be Ayah 1 (Bismillah)
            if (selectedSurah.surahNumber === 1 && prevAyahNum === 1) {
                playAyahAudio(1, 1, true);
            } else if (prevAyahNum >= 1) {
                playAyahAudio(selectedSurah.surahNumber, prevAyahNum, false);
            }
        }
    };

    useEffect(() => {
        playNextAyahRef.current = playNextAyah;
    }, [selectedSurah, currentPlayingAyah, playingBismillah]);

    const handleSurahPress = async (item: any) => {
        try {
            const response = await axios.get(`${API_URL}/surahs/${item.id}`);
            setSelectedSurah(response.data);
        } catch (error) {
            console.error('Failed to fetch surah details', error);
            if (item.ayahs) {
                setSelectedSurah(item);
            } else {
                alert('Failed to load Surah details');
            }
        }
    };

    if (selectedSurah) {
        return (
            <ReaderView
                surah={selectedSurah}
                bismillahAyah={fatihaData?.ayahs?.[0]}
                onBack={() => { stopAudio(); setSelectedSurah(null); }}
                isPlaying={isPlaying}
                currentPlayingAyah={currentPlayingAyah}
                playingBismillah={playingBismillah}
                onPlayAyah={playAyahAudio}
                onStop={stopAudio}
                onPause={pauseAudio}
                onUpdate={updateAyah}
                onNext={playNextAyah}
                onPrev={playPrevAyah}
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
                    <Card style={styles.surahCard} onPress={() => handleSurahPress(item)}>
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
                            {user?.role === 'admin' && (
                                <IconButton icon="pencil" onPress={() => setEditingSurah(item)} />
                            )}
                        </Card.Content>
                    </Card>
                )}
            />

            <EditSurahModal
                visible={!!editingSurah}
                surah={editingSurah}
                onClose={() => setEditingSurah(null)}
                onUpdate={async (id: number, data: any) => {
                    await updateSurah(id, data);
                    fetchSurahs();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    surahCard: { marginBottom: 10, marginHorizontal: 15, backgroundColor: '#fff' },
    surahCardContent: { flexDirection: 'row', alignItems: 'center' },
    surahNumberBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    surahNumberText: { color: '#1e40af', fontWeight: 'bold' },
});

export default SurahsScreen;
