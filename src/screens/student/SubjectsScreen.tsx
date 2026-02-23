import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Subject } from '../../types';
import { COLORS } from '../../constants/config';

const SubjectsScreen = () => {
    const navigation = useNavigation<any>();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filtered, setFiltered] = useState<Subject[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchSubjects(); }, []);
    useEffect(() => {
        setFiltered(subjects.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.code.toLowerCase().includes(query.toLowerCase())
        ));
    }, [query, subjects]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/api/subjects');
            if (res.status === 200) { setSubjects(res.data.subjects || res.data); setFiltered(res.data.subjects || res.data); }
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch subjects' }); }
        finally { setLoading(false); }
    };

    const renderSubject = ({ item }: { item: Subject }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SubjectDetails', { subject: item })}>
            <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>📚</Text>
                </View>
                <View>
                    <Text style={styles.subjectName}>{item.name}</Text>
                    <Text style={styles.subjectCode}>{item.code}</Text>
                    {item.staffId && <Text style={styles.staffName}>👨‍🏫 {item.staffId.name}</Text>}
                </View>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📚 My Subjects</Text>
            </View>
            <View style={styles.searchContainer}>
                <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search subjects..." placeholderTextColor={COLORS.textLight} />
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered}
                    renderItem={renderSubject}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No subjects found.</Text>}
                    showsVerticalScrollIndicator={false}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    search: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
    list: { padding: 16, gap: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 22 },
    subjectName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    subjectCode: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    staffName: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
    arrow: { fontSize: 22, color: COLORS.textMuted },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default SubjectsScreen;
