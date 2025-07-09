interface Window {
  __INITIAL_COOKIES__?: { name: string; value: string }[];
  isSpace?: (code: number) => boolean;
}

declare module 'next-themes' {
  interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    children: React.ReactNode;
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
} 