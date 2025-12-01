import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Title, Button, TextInput } from 'react-native-paper';

const EditSurahModal = ({ visible, onClose, surah, onUpdate }: any) => {
    const [name, setName] = useState('');
    const [nameArabic, setNameArabic] = useState('');
    const [versesCount, setVersesCount] = useState('');
    const [revelation, setRevelation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (surah) {
            setName(surah.name);
            setNameArabic(surah.nameArabic);
            setVersesCount(surah.versesCount ? surah.versesCount.toString() : '');
            setRevelation(surah.revelation || '');
        }
    }, [surah]);

    const handleSave = async () => {
        if (!surah) return;
        setLoading(true);
        try {
            await onUpdate(surah.id, {
                name,
                nameArabic,
                versesCount: parseInt(versesCount),
                revelation
            });
            onClose();
            alert('Surah updated successfully!');
        } catch (error) {
            alert('Failed to update Surah');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Title style={{ textAlign: 'center', marginBottom: 20 }}>Edit Surah</Title>
                    <TextInput label="Name (English)" value={name} onChangeText={setName} style={styles.input} />
                    <TextInput label="Name (Arabic)" value={nameArabic} onChangeText={setNameArabic} style={styles.input} />
                    <TextInput label="Verses Count" value={versesCount} onChangeText={setVersesCount} keyboardType="numeric" style={styles.input} />
                    <TextInput label="Revelation (Meccan/Medinan)" value={revelation} onChangeText={setRevelation} style={styles.input} />
                    <Button mode="contained" onPress={handleSave} loading={loading} style={styles.modalButton}>Save</Button>
                    <Button mode="text" onPress={onClose}>Cancel</Button>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 },
    modalButton: { marginTop: 20, backgroundColor: '#1e40af' },
    input: { marginBottom: 15, backgroundColor: '#fff' },
});

export default EditSurahModal;
