'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/Themecontext';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-2 w-9 h-9" />;
  }

  return (
    <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'light'
            ? 'bg-card text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'dark'
            ? 'bg-card text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded transition-colors ${
          theme === 'system'
            ? 'bg-card text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="System Preference"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
