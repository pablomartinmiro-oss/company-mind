# Exporting the Brand Kit

How to copy the Company Mind brand kit into a new project (e.g., Ops Hub).

## Steps

1. **Copy the `/brand` folder** to the target repo root:
   ```bash
   cp -r brand/ /path/to/target/brand/
   ```

2. **Copy the Tailwind brand tokens** from `src/app/globals.css` — the `/* Brand tokens */` block inside `@theme inline`:
   ```css
   --color-brand-bg: #0a0a0b;
   --color-brand-surface: #111113;
   /* ... etc */
   ```

3. **Copy the globals.css base layer** — the `:root` variables, `@layer base` styles, and utility classes (`.text-gradient-accent`, `.bg-gradient-accent`).

4. **Install dependencies**:
   ```bash
   npm install framer-motion
   ```
   Fonts (Inter, JetBrains Mono) are loaded via `next/font/google` in `layout.tsx`.

5. **Copy the layout.tsx font setup**:
   ```tsx
   import { Inter, JetBrains_Mono } from "next/font/google";
   const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
   const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
   ```

6. **Done.** All tokens, logos, and voice rules are now available. Use `bg-brand-bg`, `text-brand-primary`, etc. in Tailwind classes.

## What you get

- `/brand/tokens/` — TypeScript design tokens (import via `@/brand/tokens`)
- `/brand/logo/` — 6 SVG variants (gradient, light, dark for mark + wordmark)
- `/brand/voice/` — writing guidelines for UI copy
- Brand CSS variables usable as Tailwind classes (`bg-brand-surface`, `text-brand-secondary`, etc.)
