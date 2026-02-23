import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL } from '../../constants/config';

interface Props { endpoint: string; color: string; }

const StudentListView = ({ endpoint, color }: Props) => {
    const navigation = useNavigation<any>();
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStudents(); }, []);
    useEffect(() => {
        setFiltered(students.filter((s: any) => s.name?.toLowerCase().includes(query.toLowerCase()) || s.registerNumber?.toLowerCase().includes(query.toLowerCase())));
    }, [query, students]);

    const fetchStudents = async () => {
        try {
            const res = await api.get(endpoint);
            setStudents(res.data.students || res.data || []);
            setFiltered(res.data.students || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to load students' }); }
        finally { setLoading(false); }
    };

    const getPhoto = (s: any) => {
        if (!s.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'S')}&background=0047AB&color=fff`;
        return s.photo.startsWith('http') ? s.photo : `${CDN_URL}${s.photo}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Student View</Text>
            </View>
            <View style={styles.searchRow}>
                <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search students..." placeholderTextColor={COLORS.textLight} />
            </View>
            {loading ? <ActivityIndicator size="large" color={color} style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered} keyExtractor={(item) => item._id || item.registerNumber}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.sub}>{item.registerNumber} • {item.year}</Text>
                                <Text style={styles.sub}>{item.department}</Text>
                                <Text style={styles.residence}>{item.residencetype}</Text>
                            </View>
                        </View>
                    )}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
    searchRow: { padding: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    search: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1.5, borderColor: COLORS.border, color: COLORS.textPrimary },
    list: { padding: 14, gap: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    sub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    residence: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export const WardenStudentViewScreen = () => <StudentListView endpoint="/warden/students" color="#1a6b4a" />;
export const WatchmanStudentViewScreen = () => <StudentListView endpoint="/watchman/students" color="#4a3728" />;
export const YIStudentViewScreen = () => <StudentListView endpoint="/year-incharge/students" color="#7c3aed" />;

export default StudentListView;
