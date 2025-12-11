import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Title, Button, TextInput } from 'react-native-paper';

const EditKitabModal = ({ visible, onClose, kitab, onUpdate, onCreate }: any) => {
    const [name, setName] = useState('');
    const [nameArabic, setNameArabic] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (kitab) {
            setName(kitab.name);
            setNameArabic(kitab.nameArabic);
            setDescription(kitab.description || '');
        } else {
            setName('');
            setNameArabic('');
            setDescription('');
        }
    }, [kitab, visible]);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (kitab) {
                await onUpdate(kitab.id, { name, nameArabic, description });
                alert('Kitab updated successfully!');
            } else {
                await onCreate({ name, nameArabic, description });
                alert('Kitab created successfully!');
            }
            onClose();
        } catch (error) {
            alert('Failed to save Kitab');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Title style={{ textAlign: 'center', marginBottom: 20 }}>{kitab ? 'Edit Kitab' : 'Add New Kitab'}</Title>
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
