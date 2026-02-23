import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const StaffsScreen = () => {
    const navigation = useNavigation<any>();
    const [staffs, setStaffs] = useState<StaffUser[]>([]);
    const [filtered, setFiltered] = useState<StaffUser[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStaffs(); }, []);
    useEffect(() => {
        setFiltered(staffs.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            (s.department || '').toLowerCase().includes(query.toLowerCase())
        ));
    }, [query, staffs]);

    const fetchStaffs = async () => {
        try {
            const res = await api.get('/staff/all');
            setStaffs(res.data.staffs || res.data || []);
            setFiltered(res.data.staffs || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch staffs' }); }
        finally { setLoading(false); }
    };

    const getPhoto = (s: StaffUser) => {
        if (!s.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0047AB&color=fff`;
        return s.photo.startsWith('http') ? s.photo : `${CDN_URL}${s.photo}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Faculty Directory</Text>
            </View>
            <View style={styles.searchContainer}>
                <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search by name or dept..." placeholderTextColor={COLORS.textLight} />
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No staff found.</Text>}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StaffProfile', { staff: item })}>
                            <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.dept}>{item.department || 'Department N/A'}</Text>
                                {item.designation && <Text style={styles.designation}>{item.designation}</Text>}
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    )}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    search: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
    list: { padding: 16, gap: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    dept: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
    designation: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
    arrow: { fontSize: 22, color: COLORS.textMuted },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default StaffsScreen;
