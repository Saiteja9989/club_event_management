// src/components/common/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center justify-center size-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      {isDark ? (
        // Sun icon — switch to light
        <span className="material-symbols-outlined text-xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
          light_mode
        </span>
      ) : (
        // Moon icon — switch to dark
        <span className="material-symbols-outlined text-xl text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>
          dark_mode
        </span>
      )}
    </button>
  );
}
