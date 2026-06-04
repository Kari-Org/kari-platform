/** Design tokens shared by the Kari rider + driver apps. Mirror of the
 *  Tailwind preset for use where NativeWind classes can't reach (native props). */
export const colors = {
  brand: '#FFFF00',
  bg: '#070707',
  surface: '#121212',
  card: '#181818',
  hairline: '#2A2A2A',
  text: '#FFFFFF',
  muted: '#CBCBCB',
  subtle: '#888888',
  success: '#3BD17A',
  danger: '#FF5A5F',
} as const;

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;
