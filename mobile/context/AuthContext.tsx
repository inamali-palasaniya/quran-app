import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userData = await SecureStore.getItemAsync('userData');
            if (token && userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
