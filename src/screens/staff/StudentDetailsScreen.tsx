import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

const StudentDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStudents(); }, []);
    useEffect(() => {
        setFiltered(students.filter((s: any) =>
            s.name?.toLowerCase().includes(query.toLowerCase()) ||
            s.registerNumber?.toLowerCase().includes(query.toLowerCase())
        ));
    }, [query, students]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/staff/students');
            setStudents(res.data.students || res.data || []);
            setFiltered(res.data.students || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch students' }); }
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Students</Text>
            </View>
            <View style={styles.searchBox}>
                <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search by name or reg..." placeholderTextColor={COLORS.textLight} />
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id || item.registerNumber}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.sub}>{item.registerNumber} • {item.year} • {item.department}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                        </View>
                    )}
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
    searchBox: { padding: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    search: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1.5, borderColor: COLORS.border },
    list: { padding: 14, gap: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    sub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
    email: { fontSize: 12, color: COLORS.textMuted },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default StudentDetailsScreen;
