import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, withSpring, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/config';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const RoleButton = ({ icon, title, onPress, delay, ghost = false }: any) => (
    <AnimatedTouchableOpacity
        entering={FadeInDown.delay(delay).springify().damping(15)}
        style={[ghost ? styles.btnGhost : styles.btnOutline]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        {!ghost && (
            <View style={styles.btnIconContainer}>
                <MaterialCommunityIcons name={icon} size={22} color={COLORS.white} />
            </View>
        )}
        <Text style={ghost ? styles.btnGhostText : styles.btnOutlineText}>
            {title}
        </Text>
        {!ghost && <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />}
    </AnimatedTouchableOpacity>
);

const WelcomeScreen = () => {
    const navigation = useNavigation<any>();
    const pulseValue = useSharedValue(1);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }]
    }));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

            {/* Background Decorative Elements */}
            <View style={styles.bgCircleTop} />
            <View style={styles.bgCircleBottom} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Animated.View entering={FadeInUp.delay(200).springify().damping(15)} style={styles.headerContainer}>
                        <Animated.View style={[styles.logoContainer, pulseStyle]}>
                            <Ionicons name="school" size={48} color={COLORS.primary} />
                        </Animated.View>
                        <Text style={styles.title}>JIT Portal</Text>
                        <Text style={styles.subtitle}>
                            Your Academic Journey, Streamlined.{'\n'}Access resources and connect seamlessly.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(300).springify().damping(15)} style={styles.statsRow}>
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
                    </Animated.View>

                    <View style={styles.actionsContainer}>
                        <AnimatedTouchableOpacity
                            entering={FadeInDown.delay(400).springify().damping(15)}
                            style={styles.btnPrimary}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.btnPrimaryContent}>
                                <Ionicons name="people-circle-outline" size={28} color={COLORS.primaryDark} style={{ marginRight: 12 }} />
                                <Text style={styles.btnPrimaryText}>Student / Staff Login</Text>
                            </View>
                            <View style={styles.btnPrimaryArrow}>
                                <Ionicons name="arrow-forward" size={22} color={COLORS.white} />
                            </View>
                        </AnimatedTouchableOpacity>

                        <Animated.Text entering={FadeInDown.delay(500)} style={styles.sectionDivider}>
                            Other Portals
                        </Animated.Text>

                        <View style={styles.secondaryActions}>
                            <RoleButton icon="shield-account" title="Warden Login" onPress={() => navigation.navigate('WardenLogin')} delay={550} />
                            <RoleButton icon="security" title="Watchman Login" onPress={() => navigation.navigate('WatchmanLogin')} delay={650} />
                            <RoleButton icon="account-tie" title="Year Incharge Login" onPress={() => navigation.navigate('YearInchargeLogin')} delay={750} />
                            <RoleButton icon="laptop" title="Administrator Login" onPress={() => navigation.navigate('AdminLogin')} delay={850} ghost={true} />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    bgCircleTop: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        top: -width * 0.8,
        left: -width * 0.2,
    },
    bgCircleBottom: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width * 0.5,
        backgroundColor: 'rgba(30, 144, 255, 0.05)',
        bottom: -width * 0.4,
        right: -width * 0.3,
    },
    hero: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.large,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginBottom: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        ...SHADOWS.medium,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: COLORS.white },
    statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '600' },
    divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
    actionsContainer: { width: '100%', alignItems: 'center' },
    btnPrimary: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        height: 64,
        width: '100%',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 8,
        marginBottom: 24,
        ...SHADOWS.large,
    },
    btnPrimaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnPrimaryText: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '700' },
    btnPrimaryArrow: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    sectionDivider: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 16,
    },
    secondaryActions: {
        width: '100%',
        gap: 10,
    },
    btnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    btnIconContainer: {
        width: 36,
        alignItems: 'center',
    },
    btnOutlineText: { color: COLORS.white, fontSize: 16, fontWeight: '600', flex: 1, marginLeft: 8 },
    btnGhost: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 4,
    },
    btnGhostText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

export default WelcomeScreen;
