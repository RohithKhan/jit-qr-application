export const API_URL = 'https://api.jit.college';
export const CDN_URL = 'https://d2x4fvstvsmor9.cloudfront.net/';

export const COLORS = {
    // Premium Royal Blue palette
    primary: '#4169E1', // Royal Blue
    primaryDark: '#002366', // Deep Royal Navy
    primaryLight: '#E6F0FA', // Light Royal Blue / Ice
    secondary: '#1E90FF', // Dodger Blue for vibrant accents

    // Status colors (refined)
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',

    // Neutrals
    white: '#FFFFFF',
    background: '#f8fafc', // Slate 50
    card: '#FFFFFF',
    surfaceLighter: 'rgba(255, 255, 255, 0.7)',
    surfaceLight: 'rgba(255, 255, 255, 0.15)', // Glassmorphism

    // Text
    border: '#e2e8f0', // Slate 200
    textPrimary: '#0f172a', // Slate 900
    textSecondary: '#334155', // Slate 700
    textMuted: '#64748b', // Slate 500
    textLight: '#94a3b8', // Slate 400
};

export const FONTS = {
    regular: 'System',
    bold: 'System',
    // Could add custom fonts here later if imported (e.g. 'Inter-Regular')
};

// Premium shadow styles across platforms
export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    large: {
        shadowColor: '#4338ca',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
};
