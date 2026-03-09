import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>📢 Notices</Text>
                        <Text style={styles.headerSubtitle}>View and manage staff announcements</Text>
                    </View>
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
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 18, paddingTop: 10, gap: 12 },
    headerBack: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },

    // List
    list: { padding: 16, gap: 14, paddingBottom: 120 },
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    title: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
    content: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 12 },
    meta: { fontSize: 12, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 80, fontSize: 16, fontWeight: '500' },
});

export default StaffNoticesScreen;
