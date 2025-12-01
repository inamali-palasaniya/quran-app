import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Paragraph, Card, Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from './LoginScreen';

function AdminScreen() {
    const { user, setUser } = useContext(AuthContext);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        setUser(null);
    };

    if (!user) {
        return <LoginScreen onLogin={setUser} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Title style={styles.sectionTitle}>Admin Dashboard</Title>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Welcome, {user.name || 'Admin'}</Title>
                        <Paragraph>Email: {user.email}</Paragraph>
                        <Paragraph>Role: {user.role}</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={handleLogout} color="red">Logout</Button>
                    </Card.Actions>
                </Card>

                <Title style={{ marginTop: 20, marginBottom: 10 }}>Manage Content</Title>
                <Button mode="outlined" style={styles.actionBtn} icon="book" onPress={() => alert('Manage Kitabs')}>Manage Kitabs</Button>
                <Button mode="outlined" style={styles.actionBtn} icon="file-document" onPress={() => alert('Manage Surahs')}>Manage Surahs</Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, flex: 1 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
    card: { marginBottom: 15, backgroundColor: '#fff', elevation: 2 },
    actionBtn: { marginBottom: 10, borderColor: '#1e40af' },
});

export default AdminScreen;
