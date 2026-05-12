import { useColorScheme as useRNColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export function useColorScheme(): ColorScheme {
  const scheme = useRNColorScheme();
  if (scheme === 'dark') return 'dark';
  return 'light';
}
