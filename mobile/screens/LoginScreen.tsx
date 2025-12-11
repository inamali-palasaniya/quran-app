import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Button, Text, Title } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setUser } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { token, user } = response.data;

            // Store token securely
            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userData', JSON.stringify(user));

            setUser(user);
            navigation.goBack();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Login failed. Please check your connection.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Admin Login</Title>

            <RNTextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <RNTextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Login
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#059669',
    },
    input: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#059669',
    },
});
