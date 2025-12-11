import React, { useState } from 'react';
import { View, Modal, StyleSheet, ScrollView } from 'react-native';
import { Title, Button, TextInput } from 'react-native-paper';

const AddAyahModal = ({ visible, onClose, onAdd, nextAyahNumber }: any) => {
    const [textArabic, setTextArabic] = useState('');
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!textArabic) {
            alert('Arabic text is required');
            return;
        }
        setLoading(true);
        try {
            await onAdd({
                textArabic,
                ayahNumber: nextAyahNumber,
                translation: translation ? [{ language: 'gu', text: translation }] : []
            });
            setTextArabic('');
            setTranslation('');
            onClose();
            alert('Ayah added successfully!');
        } catch (error) {
            alert('Failed to add Ayah');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <Title style={{ textAlign: 'center', marginBottom: 20 }}>Add Ayah {nextAyahNumber}</Title>
                        <TextInput
                            label="Arabic Text"
                            value={textArabic}
                            onChangeText={setTextArabic}
                            style={[styles.input, { textAlign: 'right' }]}
                            multiline
                            numberOfLines={3}
                        />
                        <TextInput
                            label="Translation (Gujarati)"
                            value={translation}
                            onChangeText={setTranslation}
                            style={styles.input}
                            multiline
                            numberOfLines={2}
                        />
                        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.modalButton}>Save</Button>
                        <Button mode="text" onPress={onClose}>Cancel</Button>
                    </ScrollView>
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

export default AddAyahModal;
