# Required Dependencies for Constellation UI Components

## Installation

Install all required dependencies for the component library:

```bash
npm install framer-motion lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @types/node
```

## Package Versions

Add these to your `package.json`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "typescript": "^5.3.3"
  }
}
```

## Tailwind Configuration

Create or update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          glow: 'rgba(59, 130, 246, 0.5)',
        },
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        bg: {
          primary: '#0A0A0F',
          secondary: '#12121A',
          tertiary: '#1A1A24',
        },
        border: {
          DEFAULT: '#1E1E2E',
          focus: '#3B82F6',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        'gradient-glow': 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
```

## PostCSS Configuration

Create `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/renderer/components/*"],
      "@/utils/*": ["./src/renderer/utils/*"],
      "@/styles/*": ["./src/renderer/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Vite Configuration (for Electron)

Update `vite.config.ts` if using Vite:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/renderer/components'),
      '@/utils': path.resolve(__dirname, './src/renderer/utils'),
      '@/styles': path.resolve(__dirname, './src/renderer/styles'),
    },
  },
  build: {
    outDir: 'dist-renderer',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
```

## Import Example

Once configured, import components like this:

```typescript
// Common components
import {
  Button,
  Card,
  Badge,
  Input,
  Dialog,
  Tabs,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Dropdown,
  ScrollArea,
  useToast,
  ToastContainer,
} from '@/components/common';

// Layout components
import {
  AppShell,
  Sidebar,
  Header,
  StatusBar,
} from '@/components/layout';

// Icons
import { Play, Pause, Settings, Zap } from 'lucide-react';
```

## Global Styles Import

In your main entry file (e.g., `src/main.tsx` or `src/renderer/index.tsx`):

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/globals.css'; // Import global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Font Recommendations

For the best visual experience, use system fonts as defined in the global CSS:

- **Sans-serif**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'
- **Monospace**: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas

These fonts provide a native feel on macOS, Windows, and Linux.

## Browser Support

The component library supports:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Note: Electron typically uses a recent Chromium version, so all features should work perfectly.

## Troubleshooting

### Components not styled properly
- Ensure `globals.css` is imported in your entry file
- Verify Tailwind config includes the correct content paths
- Check that PostCSS is configured correctly

### Animations not working
- Verify `framer-motion` is installed
- Check browser console for errors
- Ensure React 18+ is being used

### Icons not displaying
- Confirm `lucide-react` is installed
- Import icons from 'lucide-react', not 'lucide'
- Check icon size props are valid numbers

### TypeScript errors
- Run `npm install` to ensure all @types packages are installed
- Check path aliases in tsconfig.json match your project structure
- Verify React types are compatible with your React version
