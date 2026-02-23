import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

const WelcomeScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={styles.hero}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🎓</Text>
                </View>
                <Text style={styles.title}>JIT Student Portal</Text>
                <Text style={styles.subtitle}>
                    Your Academic Journey, Streamlined.{'\n'}Access your subjects and connect with faculty.
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>1000+</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>50+</Text>
                        <Text style={styles.statLabel}>Faculty</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>100%</Text>
                        <Text style={styles.statLabel}>Digital</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.btnPrimaryText}>Student / Staff Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('WardenLogin')}>
                        <Text style={styles.btnOutlineText}>Warden Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('WatchmanLogin')}>
                        <Text style={styles.btnOutlineText}>Watchman Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('YearInchargeLogin')}>
                        <Text style={styles.btnOutlineText}>Year Incharge Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.navigate('AdminLogin')}>
                        <Text style={styles.btnGhostText}>Admin Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    hero: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 40,
    },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoIcon: { fontSize: 44 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 36,
        width: '100%',
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: COLORS.white },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
    actions: { width: '100%', gap: 12 },
    btnPrimary: {
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    btnPrimaryText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
    btnOutline: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    btnOutlineText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
    btnGhost: {
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    btnGhostText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
});

export default WelcomeScreen;
