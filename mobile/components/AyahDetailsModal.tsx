import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, Modal, StyleSheet } from 'react-native';
import { Title, Paragraph, Button, IconButton, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const AyahDetailsModal = ({ visible, onClose, ayah, onPlay, onUpdate }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [translation, setTranslation] = useState('');
    const [tafsir, setTafsir] = useState('');
    const [scholar, setScholar] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ayah) {
            setTranslation(ayah.translation.find((t: any) => t.language === 'gu')?.text || '');
            setAudioUrl(ayah.audioUrl || '');
            if (ayah.tafsirs && ayah.tafsirs.length > 0) {
                setTafsir(ayah.tafsirs[0].text);
                setScholar(ayah.tafsirs[0].scholar || '');
            } else {
                setTafsir('');
                setScholar('');
            }
        }
    }, [ayah]);

    const handleSave = async () => {
        if (!ayah) return;
        setLoading(true);
        try {
            await onUpdate(ayah.id, {
                translation: translation,
                tafsir: tafsir,
                scholar: scholar,
                audioUrl: audioUrl
            });

            setIsEditing(false);
            alert('Ayah updated successfully!');
        } catch (error) {
            alert('Failed to update Ayah');
        } finally {
            setLoading(false);
        }
    };

    if (!ayah) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <Title style={styles.modalArabicText}>{ayah.textArabic}</Title>
                        <View style={styles.divider} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title style={styles.modalSectionTitle}>Details</Title>
                            {user?.role === 'admin' && (
                                <IconButton icon={isEditing ? "close" : "pencil"} onPress={() => setIsEditing(!isEditing)} />
                            )}
                        </View>

                        {isEditing ? (
                            <>
                                <TextInput
                                    label="Translation (Gujarati)"
                                    mode="outlined"
                                    value={translation}
                                    onChangeText={setTranslation}
                                    multiline
                                    numberOfLines={3}
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Tafseer"
                                    mode="outlined"
                                    value={tafsir}
                                    onChangeText={setTafsir}
                                    multiline
                                    numberOfLines={4}
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Scholar Name"
                                    mode="outlined"
                                    value={scholar}
                                    onChangeText={setScholar}
                                    style={styles.input}
                                />
                                <TextInput
                                    label="Audio URL (MP3)"
                                    mode="outlined"
                                    value={audioUrl}
                                    onChangeText={setAudioUrl}
                                    style={styles.input}
                                    placeholder="https://example.com/audio.mp3"
                                />
                            </>
                        ) : (
                            <>
                                <Title style={{ fontSize: 16, marginTop: 10 }}>Translation</Title>
                                <Paragraph style={styles.modalText}>{translation || 'No translation available'}</Paragraph>

                                <View style={styles.divider} />
                                <Title style={{ fontSize: 16, marginTop: 10 }}>Tafseer {scholar ? `(${scholar})` : ''}</Title>
                                <Paragraph style={styles.modalText}>{tafsir || 'No Tafseer available'}</Paragraph>
                                {audioUrl ? (
                                    <>
                                        <View style={styles.divider} />
                                        <Title style={{ fontSize: 16, marginTop: 10 }}>Custom Audio</Title>
                                        <Paragraph style={styles.modalText} numberOfLines={1}>{audioUrl}</Paragraph>
                                    </>
                                ) : null}
                            </>
                        )}
                    </ScrollView>

                    {isEditing ? (
                        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.modalButton}>
                            Save Changes
                        </Button>
                    ) : (
                        <Button mode="contained" onPress={() => { onPlay(); onClose(); }} style={styles.modalButton} icon="play">
                            Play Audio
                        </Button>
                    )}

                    <Button mode="text" onPress={onClose} style={{ marginTop: 10 }}>Close</Button>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 },
    modalArabicText: { fontFamily: 'NooreHiraBold', fontSize: 28, color: '#1e40af', textAlign: 'center', marginBottom: 15 },
    modalSectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#334155' },
    modalText: { fontSize: 16, lineHeight: 24, color: '#475569' },
    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
    modalButton: { marginTop: 20, backgroundColor: '#1e40af' },
    input: { marginBottom: 15, backgroundColor: '#fff' },
});

export default AyahDetailsModal;
