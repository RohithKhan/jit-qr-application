import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Notice } from '../../types';
import { COLORS } from '../../constants/config';

const NoticesScreen = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchNotices(); }, []);

    const fetchNotices = async () => {
        try {
            const res = await api.get('/api/notices');
            setNotices(res.data.notices || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch notices' }); }
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}><Text style={styles.headerTitle}>📢 Notices</Text></View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={notices}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.content}>{item.content}</Text>
                            <Text style={styles.meta}>{item.staffId?.name ? `By ${item.staffId.name} • ` : ''}{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No notices available.</Text>}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    list: { padding: 16, gap: 12 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
    title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
    content: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 10 },
    meta: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default NoticesScreen;
