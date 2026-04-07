import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Palette, Layout, Type } from 'lucide-react';
import { ChartConfig } from '../../types/charts';
import { cn } from '../../utils/cn';

interface ChartConfigPanelProps {
  config: Partial<ChartConfig>;
  onChange: (config: Partial<ChartConfig>) => void;
  onReset?: () => void;
  onSave?: () => void;
  className?: string;
}

const DEFAULT_COLORS = {
  primary: '#0d9488',
  trend: '#f59e0b',
  confidence: 'rgba(13, 148, 136, 0.2)',
  prediction: '#8b5cf6',
  reference: '#ef4444',
};

const COLOR_PRESETS = [
  { name: 'Teal', primary: '#0d9488', trend: '#f59e0b', prediction: '#8b5cf6' },
  { name: 'Blue', primary: '#3b82f6', trend: '#f59e0b', prediction: '#8b5cf6' },
  { name: 'Purple', primary: '#8b5cf6', trend: '#f59e0b', prediction: '#3b82f6' },
  { name: 'Green', primary: '#10b981', trend: '#f59e0b', prediction: '#3b82f6' },
  { name: 'Red', primary: '#ef4444', trend: '#f59e0b', prediction: '#8b5cf6' },
];

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
  config,
  onChange,
  onReset,
  onSave,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'display' | 'colors' | 'advanced'>('display');
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = <K extends keyof ChartConfig>(
    key: K,
    value: ChartConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  const updateColor = (colorKey: keyof ChartConfig['colors'], value: string) => {
    const currentColors = config.colors || DEFAULT_COLORS;
    onChange({
      ...config,
      colors: {
        ...currentColors,
        [colorKey]: value,
      } as ChartConfig['colors'],
    });
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    const currentColors = config.colors || DEFAULT_COLORS;
    onChange({
      ...config,
      colors: {
        ...currentColors,
        primary: preset.primary,
        trend: preset.trend,
        prediction: preset.prediction,
      } as ChartConfig['colors'],
    });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
          isOpen
            ? 'bg-teal-600 text-white'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
        )}
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Chart Settings</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold">Chart Configuration</h3>

            <div className="flex items-center gap-2">
              {onReset && (
                <button
                  onClick={onReset}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {onSave && (
                <button
                  onClick={onSave}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-teal-600"
                  title="Save as default"
                >
                  <Save className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('display')}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2',
                activeTab === 'display'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Layout className="w-4 h-4" />
              Display
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2',
                activeTab === 'colors'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Palette className="w-4 h-4" />
              Colors
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2',
                activeTab === 'advanced'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Type className="w-4 h-4" />
              Advanced
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Display tab */}
            {activeTab === 'display' && (
              <div className="space-y-4">
                {/* Toggle options */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Show trend line</span>
                    <input
                      type="checkbox"
                      checked={config.showTrendLine ?? true}
                      onChange={(e) => updateConfig('showTrendLine', e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Show confidence interval</span>
                    <input
                      type="checkbox"
                      checked={config.showConfidenceInterval ?? true}
                      onChange={(e) => updateConfig('showConfidenceInterval', e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Show predictions</span>
                    <input
                      type="checkbox"
                      checked={config.showPredictions ?? true}
                      onChange={(e) => updateConfig('showPredictions', e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Show reference range</span>
                    <input
                      type="checkbox"
                      checked={config.showReferenceRange ?? true}
                      onChange={(e) => updateConfig('showReferenceRange', e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Enable zoom</span>
                    <input
                      type="checkbox"
                      checked={config.enableZoom ?? true}
                      onChange={(e) => updateConfig('enableZoom', e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Enable pan</span>
                    <input
                      type="checkbox"
                      checked={config.enablePan ?? true}
                      onChange={(e) => updateConfig('enablePan', e.target.checked)}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Colors tab */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* Color presets */}
                <div>
                  <label className="block text-sm font-medium mb-2">Color Presets</label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyColorPreset(preset)}
                        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom colors */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary</label>
                    <input
                      type="color"
                      value={config.colors?.primary ?? DEFAULT_COLORS.primary}
                      onChange={(e) => updateColor('primary', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Trend</label>
                    <input
                      type="color"
                      value={config.colors?.trend ?? DEFAULT_COLORS.trend}
                      onChange={(e) => updateColor('trend', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Prediction</label>
                    <input
                      type="color"
                      value={config.colors?.prediction ?? DEFAULT_COLORS.prediction}
                      onChange={(e) => updateColor('prediction', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Reference</label>
                    <input
                      type="color"
                      value={config.colors?.reference ?? DEFAULT_COLORS.reference}
                      onChange={(e) => updateColor('reference', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Advanced tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                {/* Trend line type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Trend Line Type</label>
                  <select
                    value={config.trendLineType ?? 'moving-average'}
                    onChange={(e) =>
                      updateConfig('trendLineType', e.target.value as ChartConfig['trendLineType'])
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-900"
                  >
                    <option value="linear">Linear Regression</option>
                    <option value="moving-average">Moving Average</option>
                    <option value="polynomial">Polynomial</option>
                  </select>
                </div>

                {/* Moving average window */}
                {config.trendLineType === 'moving-average' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Moving Average Window: {config.movingAverageWindow ?? 3}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={config.movingAverageWindow ?? 3}
                      onChange={(e) => updateConfig('movingAverageWindow', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Prediction periods */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prediction Periods: {config.predictionPeriods ?? 5}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={config.predictionPeriods ?? 5}
                    onChange={(e) => updateConfig('predictionPeriods', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
