'use client';

import {
  useCallback,
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import type { Attribute, ThemeProviderProps, UseThemeProps } from './types';
import {
  DEFAULT_BORDER_COLOR,
  DEFAULT_BORDER_COLOR_CSS_VARIABLE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_CSS_VARIABLE,
  DEFAULT_CORRECT_COLOR,
  DEFAULT_CORRECT_COLOR_CSS_VARIABLE,
  DEFAULT_ERROR_COLOR,
  DEFAULT_ERROR_COLOR_CSS_VARIABLE,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_COLOR_CSS_VARIABLE,
  DEFAULT_FONT_DRAFT_COLOR,
  DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE,
  DEFAULT_SELECTED_ADJACENT_COLOR,
  DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_SELECTED_COLOR_CSS_VARIABLE,
  getStyleForCSSVariable,
} from 'lib/utils/color';

const colorSchemes = ['light', 'dark'];
const MEDIA = '(prefers-color-scheme: dark)';
const isServer = typeof window === 'undefined';
const ThemeContext = createContext<UseThemeProps | undefined>(undefined);
const defaultContext: UseThemeProps = {
  setTheme: (_) => {},
  themes: [],
  colors: {
    font: DEFAULT_FONT_COLOR,
    fontDraft: DEFAULT_FONT_DRAFT_COLOR,
    default: DEFAULT_COLOR,
    selected: DEFAULT_SELECTED_COLOR,
    selectedAdjacent: DEFAULT_SELECTED_ADJACENT_COLOR,
    correct: DEFAULT_CORRECT_COLOR,
    error: DEFAULT_ERROR_COLOR,
    border: DEFAULT_BORDER_COLOR,
  },
};

export const Script = (
  attribute: string,
  storageKey: string,
  defaultTheme: any,
  forcedTheme: string,
  themes: any[],
  value: { [x: string]: any },
  enableSystem: any,
  enableColorScheme: any,
) => {
  const el = document.documentElement;
  const systemThemes = ['light', 'dark'];
  const isClass = attribute === 'class';
  const classes =
    isClass && value
      ? themes.map((t: string | number) => value[t] || t)
      : themes;

  function updateDOM(theme: string) {
    if (isClass) {
      el.classList.remove(...classes);
      el.classList.add(theme);
    } else {
      el.setAttribute(attribute, theme);
    }

    setColorScheme(theme);
  }

  function setColorScheme(theme: string) {
    if (enableColorScheme && systemThemes.includes(theme)) {
      el.style.colorScheme = theme;
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  if (forcedTheme) {
    updateDOM(forcedTheme);
  } else {
    try {
      const themeName = localStorage.getItem(storageKey) || defaultTheme;
      const isSystem = enableSystem && themeName === 'system';
      const theme = isSystem ? getSystemTheme() : themeName;
      updateDOM(theme);
    } catch (e) {
      //
    }
  }
};

export const useTheme = () => useContext(ThemeContext) ?? defaultContext;

export const ThemeProvider = (props: ThemeProviderProps): ReactNode => {
  const context = useContext(ThemeContext);

  // Ignore nested context providers, just passthrough children
  if (context) return props.children;
  return <Theme {...props} />;
};

const defaultThemes = ['light', 'dark'];

const Theme = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = defaultThemes,
  defaultTheme = enableSystem ? 'system' : 'light',
  attribute = 'data-theme',
  value,
  children,
  nonce,
}: ThemeProviderProps) => {
  const [colors, setColors] = useState<UseThemeProps['colors']>(
    defaultContext.colors,
  );

  const [theme, setThemeState] = useState(() =>
    getTheme(storageKey, defaultTheme),
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getTheme(storageKey),
  );
  const attrs = !value ? themes : Object.values(value);

  const applyTheme = useCallback(
    (theme: string | undefined) => {
      let resolved = theme;
      if (!resolved) return;

      // If theme is system, resolve it before setting theme
      if (theme === 'system' && enableSystem) {
        resolved = getSystemTheme();
      }

      const name = value ? value[resolved] : resolved;
      const enable = disableTransitionOnChange ? disableAnimation() : null;
      const d = document.documentElement;

      const handleAttribute = (attr: Attribute) => {
        if (attr === 'class') {
          d.classList.remove(...attrs);
          if (name) d.classList.add(name);
        } else if (attr.startsWith('data-')) {
          if (name) {
            d.setAttribute(attr, name);
          } else {
            d.removeAttribute(attr);
          }
        }
      };

      if (Array.isArray(attribute)) attribute.forEach(handleAttribute);
      else handleAttribute(attribute);

      if (enableColorScheme) {
        const fallback = colorSchemes.includes(defaultTheme)
          ? defaultTheme
          : null;
        const colorScheme = colorSchemes.includes(resolved)
          ? resolved
          : fallback;
        // @ts-ignore
        d.style.colorScheme = colorScheme;
      }

      // Set colors for threejs from CSS variables
      setColors({
        font: getStyleForCSSVariable(DEFAULT_FONT_COLOR_CSS_VARIABLE),
        fontDraft: getStyleForCSSVariable(
          DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE,
        ),
        default: getStyleForCSSVariable(DEFAULT_COLOR_CSS_VARIABLE),
        selected: getStyleForCSSVariable(DEFAULT_SELECTED_COLOR_CSS_VARIABLE),
        selectedAdjacent: getStyleForCSSVariable(
          DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE,
        ),
        correct: getStyleForCSSVariable(DEFAULT_CORRECT_COLOR_CSS_VARIABLE),
        error: getStyleForCSSVariable(DEFAULT_ERROR_COLOR_CSS_VARIABLE),
        border: getStyleForCSSVariable(DEFAULT_BORDER_COLOR_CSS_VARIABLE),
      });

      enable?.();
    },
    [
      attribute,
      attrs,
      defaultTheme,
      disableTransitionOnChange,
      enableColorScheme,
      enableSystem,
      value,
    ],
  );

  const setTheme = useCallback(
    (value: string) => {
      setThemeState(value);

      // Save to storage
      try {
        localStorage.setItem(storageKey, value);
      } catch (e) {
        // Unsupported
      }
    },
    [storageKey],
  );

  const handleMediaQuery = useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e);
      setResolvedTheme(resolved);

      if (theme === 'system' && enableSystem && !forcedTheme) {
        applyTheme('system');
      }
    },
    [theme, enableSystem, forcedTheme, applyTheme],
  );

  // Always listen to System preference
  useEffect(() => {
    const media = window.matchMedia(MEDIA);

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleMediaQuery);
    handleMediaQuery(media);

    return () => media.removeListener(handleMediaQuery);
  }, [handleMediaQuery]);

  // localStorage event handling
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return;
      }

      // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
      const theme = e.newValue || defaultTheme;
      setTheme(theme);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [defaultTheme, setTheme, storageKey]);

  // Whenever theme or forcedTheme changes, apply it
  useEffect(() => {
    applyTheme(forcedTheme ?? theme);
  }, [applyTheme, forcedTheme, theme]);

  const providerValue = useMemo<UseThemeProps>(
    () => ({
      theme,
      colors,
      setTheme,
      forcedTheme,
      resolvedTheme: theme === 'system' ? resolvedTheme : theme,
      themes: enableSystem ? [...themes, 'system'] : themes,
      systemTheme: (enableSystem ? resolvedTheme : undefined) as
        | 'light'
        | 'dark'
        | undefined,
    }),
    [theme, colors, setTheme, forcedTheme, resolvedTheme, enableSystem, themes],
  );

  return (
    <ThemeContext.Provider value={providerValue}>
      <ThemeScript
        {...{
          forcedTheme,
          storageKey,
          attribute,
          enableSystem,
          enableColorScheme,
          defaultTheme,
          value,
          themes,
          nonce,
        }}
      />

      {children}
    </ThemeContext.Provider>
  );
};

const ThemeScript = ({
  forcedTheme,
  storageKey,
  attribute,
  enableSystem,
  enableColorScheme,
  defaultTheme,
  value,
  themes,
  nonce,
}: Omit<ThemeProviderProps, 'children'> & { defaultTheme: string }) => {
  const scriptArgs = JSON.stringify([
    attribute,
    storageKey,
    defaultTheme,
    forcedTheme,
    themes,
    value,
    enableSystem,
    enableColorScheme,
  ]).slice(1, -1);

  return (
    <script
      suppressHydrationWarning
      nonce={typeof window === 'undefined' ? nonce : ''}
      dangerouslySetInnerHTML={{
        __html: `(${Script.toString()})(${scriptArgs})`,
      }}
    />
  );
};

// Helpers
const getTheme = (key: string, fallback?: string) => {
  if (isServer) return undefined;
  let theme;
  try {
    theme = localStorage.getItem(key) || undefined;
  } catch (e) {
    // Unsupported
  }
  return theme || fallback;
};

const disableAnimation = () => {
  const css = document.createElement('style');
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
    ),
  );
  document.head.appendChild(css);

  return () => {
    // Force restyle
    (() => window.getComputedStyle(document.body))();

    // Wait for next tick before removing
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  };
};

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA);
  const isDark = e.matches;
  const systemTheme = isDark ? 'dark' : 'light';
  return systemTheme;
};
