import * as SecureStore from 'expo-secure-store';

import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, IconButton, Searchbar, Card, Paragraph, FAB } from 'react-native-paper';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants';
import ReaderView from './ReaderView';
import EditSurahModal from '../components/EditSurahModal';
import quranData from '../assets/quran_data.json';
import { Audio } from 'expo-av';

function SurahsScreen({ route, navigation }: any) {
    const { kitabId } = route.params;
    const [surahs, setSurahs] = useState<any[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<any>(null);
    const [fatihaData, setFatihaData] = useState<any>(null);
    const [player, setPlayer] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
    const [playingBismillah, setPlayingBismillah] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [currentAudioUri, setCurrentAudioUri] = useState('');
    const playNextAyahRef = useRef<() => void>(() => { });

    useEffect(() => {
        return () => {
            if (player) {
                player.unloadAsync();
            }
        };
    }, [player]);

    useEffect(() => {
        const loadAudio = async () => {
            if (currentAudioUri) {
                try {
                    if (player) {
                        await player.unloadAsync();
                    }
                    const { sound } = await Audio.Sound.createAsync(
                        { uri: currentAudioUri },
                        { shouldPlay: true }
                    );
                    setPlayer(sound);
                    setIsPlaying(true);
                } catch (error) {
                    console.error('Failed to load audio', error);
                }
            }
        };
        loadAudio();
    }, [currentAudioUri]);
    const { user, setUser } = useContext(AuthContext);
    const [editingSurah, setEditingSurah] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

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

    const createSurah = async (data: any) => {
        await axios.post(`${API_URL}/surahs`, { ...data, kitabId });
        fetchSurahs();
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
                player.playAsync();
            }

            const subscription = player.setOnPlaybackStatusUpdate((status: any) => {
                if (status.didJustFinish && !status.isLooping) {
                    if (autoPlay) {
                        playNextAyahRef.current();
                    } else {
                        setIsPlaying(false);
                        setCurrentPlayingAyah(null);
                    }
                }
            });
            return () => { };
        }
    }, [player, isPlaying, autoPlay]);

    const playAyahAudio = async (surahNum: number, ayahNum: number, isBismillah: boolean = false) => {
        let uri = '';

        if (isBismillah && fatihaData?.ayahs?.[0]) {
            uri = fatihaData.ayahs[0].audioUrl || `https://everyayah.com/data/Alafasy_128kbps/001001.mp3`;
        } else {
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

    const stopAudio = async () => {
        if (player) await player.stopAsync();
        setIsPlaying(false);
        setCurrentPlayingAyah(null);
        setPlayingBismillah(false);
        setAutoPlay(false);
    };

    const pauseAudio = async () => {
        if (player) await player.pauseAsync();
        setIsPlaying(false);
        setAutoPlay(false);
    };

    const playNextAyah = () => {
        if (playingBismillah && selectedSurah) {
            const nextAyah = selectedSurah.surahNumber === 1 ? 2 : 1;
            playAyahAudio(selectedSurah.surahNumber, nextAyah, false);
        } else if (selectedSurah && currentPlayingAyah) {
            const nextAyahNum = currentPlayingAyah + 1;
            if (nextAyahNum <= selectedSurah.versesCount) {
                playAyahAudio(selectedSurah.surahNumber, nextAyahNum, false);
            } else {
                // Surah finished, play next Surah
                handleNextSurah();
            }
        }
    };

    const playPrevAyah = () => {
        if (currentPlayingAyah === 1 && !playingBismillah && selectedSurah) {
            playAyahAudio(1, 1, true);
        } else if (selectedSurah && currentPlayingAyah && !playingBismillah) {
            const prevAyahNum = currentPlayingAyah - 1;
            if (selectedSurah.surahNumber === 1 && prevAyahNum === 1) {
                playAyahAudio(1, 1, true);
            } else if (prevAyahNum >= 1) {
                playAyahAudio(selectedSurah.surahNumber, prevAyahNum, false);
            }
        }
    };

    const [pendingAutoPlay, setPendingAutoPlay] = useState(false);

    useEffect(() => {
        if (pendingAutoPlay && selectedSurah) {
            // Play Bismillah (Ayah 1 of Fatiha) if it's not Fatiha itself (Surah 1)
            // Actually, for Surah 1, Bismillah IS Ayah 1.
            // For others, we usually play Bismillah first.
            // The user said "starts every surah with 1st ayah means bismillah then suras 1st ayah"
            // My playAyahAudio handles isBismillah flag.

            // If Surah 1: Play Ayah 1 (which is Bismillah)
            // If Surah > 1: Play Bismillah (from Fatiha) then Ayah 1

            if (selectedSurah.surahNumber === 1) {
                playAyahAudio(1, 1, true);
            } else {
                playAyahAudio(1, 1, true); // Play Bismillah
                // Note: The player listener will handle playing next ayah (Ayah 1 of Surah) after Bismillah finishes if autoPlay is true.
                // playAyahAudio sets autoPlay=true.
            }
            setPendingAutoPlay(false);
        }
    }, [selectedSurah, pendingAutoPlay]);

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

    const handleNextSurah = async () => {
        if (!selectedSurah) return;
        const nextSurahNum = selectedSurah.surahNumber + 1;
        if (nextSurahNum > 114) return;

        stopAudio();

        // Optimistic update or fetch
        try {
            const response = await axios.get(`${API_URL}/surahs/${nextSurahNum}`);
            setSelectedSurah(response.data);
            setPendingAutoPlay(true);
        } catch (e) {
            console.error("Could not fetch next surah", e);
        }
    };

    const handlePrevSurah = async () => {
        if (!selectedSurah) return;
        const prevSurahNum = selectedSurah.surahNumber - 1;
        if (prevSurahNum < 1) return;

        stopAudio();

        try {
            const response = await axios.get(`${API_URL}/surahs/${prevSurahNum}`);
            setSelectedSurah(response.data);
            setPendingAutoPlay(true);
        } catch (e) {
            console.error("Could not fetch prev surah", e);
        }
    };

    const onChangeSearch = (query: string) => setSearchQuery(query);

    const filteredSurahs = surahs.filter(surah =>
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.nameArabic.includes(searchQuery) ||
        surah.surahNumber.toString().includes(searchQuery)
    );

    const createAyah = async (data: any) => {
        if (!selectedSurah) return;
        try {
            await axios.post(`${API_URL}/ayahs`, {
                ...data,
                surahId: selectedSurah.id,
                paraId: 1 // Default to 1 for now, will be updated by script later or user can edit
            });
            // Refresh surah details
            const response = await axios.get(`${API_URL}/surahs/${selectedSurah.id}`);
            setSelectedSurah(response.data);
        } catch (error) {
            console.error('Failed to create ayah', error);
            alert('Failed to create ayah');
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
                onNextSurah={handleNextSurah}
                onPrevSurah={handlePrevSurah}
                onAddAyah={createAyah}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Title>Surahs</Title>
                <IconButton
                    icon={user ? "logout" : "login"}
                    iconColor="#1e40af"
                    size={24}
                    onPress={async () => {
                        if (user) {
                            await SecureStore.deleteItemAsync('userToken');
                            await SecureStore.deleteItemAsync('userData');
                            setUser(null);
                        } else {
                            navigation.navigate('Login');
                        }
                    }}
                />
            </View>
            <Searchbar
                placeholder="Search Surah"
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={styles.searchBar}
            />
            <FlatList
                data={filteredSurahs}
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

            {user?.role === 'admin' && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    onPress={() => setIsCreating(true)}
                />
            )}

            <EditSurahModal
                visible={!!editingSurah || isCreating}
                surah={editingSurah}
                onClose={() => { setEditingSurah(null); setIsCreating(false); }}
                onUpdate={async (id: number, data: any) => {
                    await updateSurah(id, data);
                    fetchSurahs();
                }}
                onCreate={createSurah}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    surahCard: { marginBottom: 10, marginHorizontal: 15, backgroundColor: '#fff' },
    surahCardContent: { flexDirection: 'row', alignItems: 'center' },
    surahNumberBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    surahNumberText: { color: '#1e40af', fontWeight: 'bold' },
    searchBar: { margin: 15, elevation: 2, backgroundColor: '#fff' },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#1e40af',
    },
});

export default SurahsScreen;
