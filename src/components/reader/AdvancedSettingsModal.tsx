import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

import type { DisplayMode, FitMode, ReadingDirection, AdvancedProgressPosition, ImageSettings } from '@/hooks/useReaderSettings';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayMode: DisplayMode;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  stripMargin: number;
  showTips: boolean;
  advancedProgressPosition: AdvancedProgressPosition;
  imageSettings: ImageSettings;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onReadingDirectionChange: (dir: ReadingDirection) => void;
  onStripMarginChange: (val: number) => void;
  onShowTipsChange: (val: boolean) => void;
  onAdvancedProgressChange: (pos: AdvancedProgressPosition) => void;
  onImageSettingChange: <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => void;
}

type Tab = 'layout' | 'image' | 'shortcuts';

export default function AdvancedSettingsModal({
  isOpen,
  onClose,
  displayMode,
  readingDirection,
  stripMargin,
  showTips,
  advancedProgressPosition,
  imageSettings,
  onDisplayModeChange,
  onReadingDirectionChange,
  onStripMarginChange,
  onShowTipsChange,
  onAdvancedProgressChange,
  onImageSettingChange,
}: AdvancedSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('layout');
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
      activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  const displayBtn = (mode: DisplayMode, label: string) => (
    <button
      onClick={() => onDisplayModeChange(mode)}
      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
        displayMode === mode ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const dirBtn = (dir: ReadingDirection, label: string) => (
    <button
      onClick={() => onReadingDirectionChange(dir)}
      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
        readingDirection === dir ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const progressBtn = (pos: AdvancedProgressPosition, label: string) => (
    <button
      onClick={() => onAdvancedProgressChange(pos)}
      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
        advancedProgressPosition === pos ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between py-2.5 px-1 text-sm text-gray-300 hover:text-white transition-colors"
    >
      <span>{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-blue-500' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative w-[90vw] max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Advanced Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Icon icon="ph:x-bold" className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-white/5">
          <button className={tabClass('layout')} onClick={() => setActiveTab('layout')}>Page Layout</button>
          <button className={tabClass('image')} onClick={() => setActiveTab('image')}>Image</button>
          <button className={tabClass('shortcuts')} onClick={() => setActiveTab('shortcuts')}>Shortcuts</button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {activeTab === 'layout' && (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Page Display Style</label>
                <div className="flex gap-2">
                  {displayBtn('single', 'Single Page')}
                  {!isMobile && displayBtn('double', 'Double Page')}
                  {displayBtn('longstrip', 'Long Strip')}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Strip Margin</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={stripMargin}
                    onChange={(e) => onStripMarginChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => onStripMarginChange(0)}
                    className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Reading Direction</label>
                <div className="flex gap-2">
                  {dirBtn('ltr', 'Left To Right')}
                  {dirBtn('rtl', 'Right To Left')}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Progress Bar Position</label>
                <div className="flex gap-2 flex-wrap">
                  {progressBtn('top', 'Top')}
                  {progressBtn('bottom', 'Bottom')}
                  {progressBtn('left', 'Left')}
                  {progressBtn('right', 'Right')}
                  {progressBtn('none', 'None')}
                </div>
              </div>
              {toggle('Show tips when header and sidebar are hidden', showTips, onShowTipsChange)}
            </>
          )}

          {activeTab === 'image' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Image Sizing</label>
                {toggle('Contain to width', imageSettings.containWidth, (v) => onImageSettingChange('containWidth', v))}
                {toggle('Contain to height', imageSettings.containHeight, (v) => onImageSettingChange('containHeight', v))}
                {toggle('Stretch small pages', imageSettings.stretchSmall, (v) => onImageSettingChange('stretchSmall', v))}
                {toggle('Limit max width', imageSettings.limitMaxWidth, (v) => onImageSettingChange('limitMaxWidth', v))}
                {toggle('Limit max height', imageSettings.limitMaxHeight, (v) => onImageSettingChange('limitMaxHeight', v))}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Image Coloring</label>
                {toggle('Greyscale pages', imageSettings.greyscale, (v) => onImageSettingChange('greyscale', v))}
                {toggle('Dim pages', imageSettings.dim, (v) => onImageSettingChange('dim', v))}
              </div>
            </>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Keyboard Shortcuts</label>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">H</kbd>
                  <span>Toggle show/hide header</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">M</kbd>
                  <span>Toggle show/hide menu</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">N</kbd>
                  <span>Skip forward a chapter</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">B</kbd>
                  <span>Skip backward a chapter</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">→</kbd>
                  <span>Skip a page forward in LTR or backward in RTL</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">←</kbd>
                  <span>Skip a page backward in LTR or forward in RTL</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
