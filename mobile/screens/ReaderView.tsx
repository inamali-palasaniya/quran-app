import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, IconButton, Button, FAB, Divider } from 'react-native-paper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { AuthContext } from '../context/AuthContext';
import { toArabicNumerals } from '../utils';
import AudioControlBar from '../components/AudioControlBar';
import AyahDetailsModal from '../components/AyahDetailsModal';
import AddAyahModal from '../components/AddAyahModal';

function ReaderView({ surah, bismillahAyah, onBack, isPlaying, currentPlayingAyah, playingBismillah, onPlayAyah, onStop, onPause, onUpdate, onNext, onPrev, onNextSurah, onPrevSurah, onAddAyah }: any) {
    const [fontSize, setFontSize] = useState(24);
    const [isBold, setIsBold] = useState(false);
    const { user } = useContext(AuthContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedAyah, setSelectedAyah] = useState<any>(null);
    const [textLayout, setTextLayout] = useState<{ height: number } | null>(null);
    const lineHeight = Math.round(fontSize * 2.6); // Increased line height for better spacing and alignment

    const handleAyahPress = (ayah: any) => {
        setSelectedAyah(ayah);
        setModalVisible(true);
    };

    const decreaseFontSize = () => setFontSize(Math.max(16, fontSize - 2));

    const exportSurahToPDF = async () => {
        try {
            const html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
              body { font-family: 'Amiri', serif; text-align: center; padding: 40px; border: 5px double #1e40af; min-height: 90vh; }
              h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
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

    // Filter ayahs if Surah 1 (remove first ayah as it's in header)
    const ayahsToRender = surah.surahNumber === 1 ? surah.ayahs.slice(1) : surah.ayahs;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.readerHeader}>
                <IconButton icon="arrow-left" onPress={onBack} iconColor="#1e40af" />

                <View style={styles.headerControls}>
                    <IconButton
                        icon="skip-previous"
                        onPress={onPrevSurah}
                        disabled={surah.surahNumber === 1}
                        iconColor="#1e40af"
                    />
                    <IconButton
                        icon={isPlaying ? "pause-circle" : "play-circle"}
                        size={40}
                        onPress={() => isPlaying ? onPause() : (playingBismillah ? onPlayAyah(1, 1, true) : onPlayAyah(surah.surahNumber, currentPlayingAyah || 1, false))}
                        iconColor="#1e40af"
                    />
                    <IconButton
                        icon="skip-next"
                        onPress={onNextSurah}
                        disabled={surah.surahNumber === 114}
                        iconColor="#1e40af"
                    />
                </View>

                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="minus" onPress={() => setFontSize(Math.max(16, fontSize - 2))} iconColor="#64748b" />
                    <IconButton icon="plus" onPress={() => setFontSize(Math.min(40, fontSize + 2))} iconColor="#64748b" />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.readerContent}>
                {/* Background Lines */}
                <View style={[StyleSheet.absoluteFill, styles.linesContainer]} pointerEvents="none">
                    {Array.from({ length: 200 }).map((_, i) => (
                        <View key={i} style={{ height: lineHeight, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', width: '100%' }} />
                    ))}
                </View>

                {/* Professional Blue Header (CSS-based) */}
                <View style={styles.blueHeaderContainer}>
                    <View style={styles.blueHeaderInner}>
                        <Text style={styles.blueHeaderSurahName}>{surah.nameArabic}</Text>
                        <View style={styles.blueHeaderDivider} />
                        <View style={styles.blueHeaderDetails}>
                            <Text style={styles.blueHeaderText}>{surah.revelation} • {surah.versesCount} Ayahs</Text>
                        </View>
                    </View>
                </View>

                {bismillahAyah ? (
                    // Universal Bismillah header for all Surahs
                    <TouchableOpacity onPress={() => handleAyahPress(bismillahAyah)} style={styles.bismillahContainer}>
                        <Text style={[styles.bismillah, { fontFamily: 'NooreHiraBold', color: playingBismillah ? '#1e40af' : '#000' }]}>
                            {bismillahAyah.textArabic} ۝١
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <Text style={[styles.quranText, { lineHeight, textAlign: 'justify', writingDirection: 'rtl' }]}>
                    {ayahsToRender.map((ayah: any) => {
                        const isActive = currentPlayingAyah === ayah.ayahNumber && !playingBismillah;
                        return (
                            <Text
                                key={ayah.id}
                                onPress={() => handleAyahPress(ayah)}
                                style={[
                                    styles.arabicText,
                                    { fontSize, fontFamily: isBold ? 'NooreHiraBold' : 'NooreHira', color: isActive ? '#1e40af' : '#000' }
                                ]}>
                                {ayah.textArabic}
                                <Text style={[styles.ayahEnd, { fontSize: fontSize - 5, fontFamily: 'NooreHira' }]}>
                                    {' '}۝{toArabicNumerals(ayah.ayahNumber)}{' '}
                                </Text>
                            </Text>
                        );
                    })}
                </Text>
            </ScrollView>

            {/* Audio Control Bar (Sticky at bottom if playing) */}
            {(currentPlayingAyah || playingBismillah) && (
                <AudioControlBar
                    isPlaying={isPlaying}
                    currentAyahNum={currentPlayingAyah}
                    playingBismillah={playingBismillah}
                    onPlayPause={() => isPlaying ? onPause() : (playingBismillah ? onPlayAyah(1, 1, true) : onPlayAyah(surah.surahNumber, currentPlayingAyah, false))}
                    onNext={onNext}
                    onPrev={onPrev}
                />
            )}

            {/* Ayah Details Modal */}
            <AyahDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                ayah={selectedAyah}
                onPlay={() => {
                    const ayahToPlay = selectedAyah?.id === bismillahAyah?.id ? 1 : surah.surahNumber;
                    const ayahNum = selectedAyah?.ayahNumber || 1;
                    const isBismillah = selectedAyah?.id === bismillahAyah?.id;
                    onPlayAyah(ayahToPlay, ayahNum, isBismillah);
                }}
                onUpdate={onUpdate}
            />

            {user?.role === 'admin' && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    onPress={() => setAddModalVisible(true)}
                />
            )}

            <AddAyahModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                nextAyahNumber={surah.ayahs.length + (surah.surahNumber === 1 ? 2 : 1)} // Simple estimation, backend should handle real logic or we pass exact
                onAdd={onAddAyah}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    readerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerControls: { flexDirection: 'row', alignItems: 'center' },
    readerContent: { padding: 15, paddingBottom: 100 },
    bismillahContainer: { marginBottom: 20, alignItems: 'center' },
    bismillah: { fontSize: 28, color: '#000' },
    quranText: {
        textAlign: 'justify',
        writingDirection: 'rtl',
        includeFontPadding: false,
        textAlignVertical: 'top', // Anchor to top to prevent centering drift
    },
    arabicText: { color: '#000' },
    ayahEnd: { color: '#1e40af' },

    // Blue Header Styling
    blueHeaderContainer: {
        backgroundColor: '#eff6ff',
        borderWidth: 2,
        borderColor: '#1e40af',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        marginHorizontal: 10,
    },
    blueHeaderInner: {
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderStyle: 'dashed',
    },
    blueHeaderSurahName: {
        fontFamily: 'NooreHiraBold',
        fontSize: 32,
        color: '#1e40af',
        marginBottom: 8,
    },
    blueHeaderDivider: {
        height: 2,
        width: 60,
        backgroundColor: '#bfdbfe',
        marginBottom: 8,
    },
    blueHeaderDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    blueHeaderText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    linesContainer: {
        zIndex: -1,
        marginTop: 180, // Offset for header + bismillah
        paddingHorizontal: 15,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 100, // Above audio bar
        backgroundColor: '#1e40af',
    },
});

export default ReaderView;
