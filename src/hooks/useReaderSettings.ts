import { useState, useCallback, useEffect } from 'react';

export type HeaderMode = 'sticky' | 'hidden';
export type DisplayMode = 'longstrip' | 'single' | 'double';
export type FitMode = 'height' | 'width';
export type ReadingDirection = 'rtl' | 'ltr';
export type ProgressPosition = 'bottom' | 'left' | 'none';
export type AdvancedProgressPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface ImageSettings {
  containWidth: boolean;
  containHeight: boolean;
  stretchSmall: boolean;
  limitMaxWidth: boolean;
  limitMaxHeight: boolean;
  greyscale: boolean;
  dim: boolean;
}

interface ReaderSettings {
  headerMode: HeaderMode;
  displayMode: DisplayMode;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  progressPosition: ProgressPosition;
  stripMargin: number;
  showTips: boolean;
  advancedProgressPosition: AdvancedProgressPosition;
  imageSettings: ImageSettings;
}

const STORAGE_KEY = 'grodextt-reader-settings';

const defaultSettings: ReaderSettings = {
  headerMode: 'sticky',
  displayMode: 'longstrip',
  fitMode: 'width',
  readingDirection: 'ltr',
  progressPosition: 'bottom',
  stripMargin: 0,
  showTips: true,
  advancedProgressPosition: 'bottom',
  imageSettings: {
    containWidth: true,
    containHeight: false,
    stretchSmall: false,
    limitMaxWidth: false,
    limitMaxHeight: false,
    greyscale: false,
    dim: false,
  },
};

function loadSettings(): ReaderSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed, imageSettings: { ...defaultSettings.imageSettings, ...parsed.imageSettings } };
    }
  } catch {}
  return defaultSettings;
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback(<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateImage = useCallback(<K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    setSettings(prev => ({ ...prev, imageSettings: { ...prev.imageSettings, [key]: value } }));
  }, []);

  const cycleHeaderMode = useCallback(() => {
    setSettings(prev => ({ ...prev, headerMode: prev.headerMode === 'sticky' ? 'hidden' : 'sticky' }));
  }, []);

  const cycleDisplayMode = useCallback(() => {
    setSettings(prev => {
      const modes: DisplayMode[] = ['longstrip', 'single', 'double'];
      const idx = modes.indexOf(prev.displayMode);
      return { ...prev, displayMode: modes[(idx + 1) % modes.length] };
    });
  }, []);

  const cycleFitMode = useCallback(() => {
    setSettings(prev => {
      const modes: FitMode[] = ['height', 'width'];
      const idx = modes.indexOf(prev.fitMode);
      return { ...prev, fitMode: modes[(idx + 1) % modes.length] };
    });
  }, []);

  const cycleReadingDirection = useCallback(() => {
    setSettings(prev => ({ ...prev, readingDirection: prev.readingDirection === 'ltr' ? 'rtl' : 'ltr' }));
  }, []);

  const cycleProgressPosition = useCallback(() => {
    setSettings(prev => {
      const positions: ProgressPosition[] = ['bottom', 'left', 'none'];
      const idx = positions.indexOf(prev.progressPosition);
      return { ...prev, progressPosition: positions[(idx + 1) % positions.length] };
    });
  }, []);

  return {
    settings,
    update,
    updateImage,
    cycleHeaderMode,
    cycleDisplayMode,
    cycleFitMode,
    cycleReadingDirection,
    cycleProgressPosition,
  };
}
