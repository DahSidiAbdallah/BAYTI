// Central design tokens for spacing, colors, typography, radii, shadows, and icon sizes
export const theme = {
  spacing: {
    base: 4,
    s2: 8,
    s3: 12,
    s4: 16,
    s5: 20,
    s6: 24,
  },
  radii: {
    card: 16,
    image: 16,
    chip: 12,
    button: 14,
  },
  colors: {
    primary: '#1E40AF', // Bayti Blue
    title: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    divider: '#E2E8F0',
    shadow: 'rgba(0,0,0,0.08)'
  },
  typography: {
    screenTitle: 22,
    cardTitle: 18,
    body: 15,
    micro: 13,
  },
  iconSizes: {
    topBar: 22,
    meta: 16,
    inline: 17,
  },
  shadow: {
    ios: {
      shadowColor: 'rgba(0,0,0,0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    androidElevation: 3,
  }
};

export default theme;
