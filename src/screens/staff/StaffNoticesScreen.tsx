import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Notice } from '../../types';
import { COLORS } from '../../constants/config';

const StaffNoticesScreen = () => {
    const navigation = useNavigation<any>();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchNotices(); }, []);

    const fetchNotices = async () => {
        try {
            const res = await api.get('/staff/notices');
            setNotices(res.data.notices || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch notices' }); }
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>📢 Notices</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={notices}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.content}>{item.content}</Text>
                            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No notices.</Text>}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    list: { padding: 14, gap: 12 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, elevation: 2 },
    title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
    content: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 8 },
    meta: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default StaffNoticesScreen;
