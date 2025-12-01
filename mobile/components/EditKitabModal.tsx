import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Title, Button, TextInput } from 'react-native-paper';

const EditKitabModal = ({ visible, onClose, kitab, onUpdate }: any) => {
    const [name, setName] = useState('');
    const [nameArabic, setNameArabic] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (kitab) {
            setName(kitab.name);
            setNameArabic(kitab.nameArabic);
            setDescription(kitab.description || '');
        }
    }, [kitab]);

    const handleSave = async () => {
        if (!kitab) return;
        setLoading(true);
        try {
            await onUpdate(kitab.id, { name, nameArabic, description });
            onClose();
            alert('Kitab updated successfully!');
        } catch (error) {
            alert('Failed to update Kitab');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Title style={{ textAlign: 'center', marginBottom: 20 }}>Edit Kitab</Title>
                    <TextInput label="Name (English)" value={name} onChangeText={setName} style={styles.input} />
                    <TextInput label="Name (Arabic)" value={nameArabic} onChangeText={setNameArabic} style={styles.input} />
                    <TextInput label="Description" value={description} onChangeText={setDescription} style={styles.input} multiline />
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

export default EditKitabModal;
