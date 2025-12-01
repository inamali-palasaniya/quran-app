import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Paragraph, Card, IconButton } from 'react-native-paper';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants';
import EditKitabModal from '../components/EditKitabModal';
import quranData from '../assets/quran_data.json';

function HomeScreen({ navigation }: any) {
    const [kitabs, setKitabs] = useState<any[]>([]);
    const { user } = useContext(AuthContext);
    const [editingKitab, setEditingKitab] = useState<any>(null);

    const fetchKitabs = async () => {
        try {
            const response = await axios.get(`${API_URL}/kitabs`);
            setKitabs(response.data);
        } catch (error) {
            console.error('Failed to fetch kitabs', error);
            // Fallback
            if (quranData) {
                setKitabs([{ id: 1, name: "Quran", nameArabic: "القرآن الكريم", description: "The Holy Quran" }]);
            }
        }
    };

    useEffect(() => {
        fetchKitabs();
    }, []);

    const updateKitab = async (id: number, data: any) => {
        await axios.put(`${API_URL}/kitabs/${id}`, data);
        fetchKitabs();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1000&auto=format&fit=crop' }}
                style={styles.headerImage}
            >
                <View style={styles.overlay}>
                    <Title style={styles.headerTitle}>Quran App</Title>
                    <Paragraph style={styles.headerSubtitle}>Read, Listen, and Reflect</Paragraph>
                </View>
            </ImageBackground>

            <View style={styles.content}>
                <Title style={styles.sectionTitle}>Library</Title>
                <FlatList
                    data={kitabs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Card style={styles.card} onPress={() => navigation.navigate('Surahs', { kitabId: item.id })}>
                            <Card.Content style={styles.cardContent}>
                                <View>
                                    <Title>{item.nameArabic}</Title>
                                    <Paragraph>{item.name}</Paragraph>
                                </View>
                                {user?.role === 'admin' && (
                                    <IconButton icon="pencil" onPress={() => setEditingKitab(item)} />
                                )}
                            </Card.Content>
                        </Card>
                    )}
                />
            </View>

            <EditKitabModal
                visible={!!editingKitab}
                kitab={editingKitab}
                onClose={() => setEditingKitab(null)}
                onUpdate={updateKitab}
            />
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
});

export default HomeScreen;
