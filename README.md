# EduCRM Part 3 — Shared UI Components

## Overview
All shared UI components for the EduCRM frontend (desktop/tablet layouts).  
Part of a 7-part series. Requires Parts 1 (config) and 2 (services/stores).

---

## Dependencies required

```bash
# Core
npm install framer-motion @radix-ui/react-dialog @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-switch
npm install @radix-ui/react-radio-group @radix-ui/react-tabs @radix-ui/react-tooltip
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
npm install @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-progress
npm install class-variance-authority clsx tailwind-merge

# Charts
npm install recharts

# Forms
npm install react-dropzone date-fns

# Search
npm install cmdk

# i18n
npm install next-intl

# Theme
npm install next-themes

# Icons
npm install lucide-react
```

---

## tailwind.config.ts — add keyframes

```ts
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      'accordion-down': {
        from: { height: '0' },
        to: { height: 'var(--radix-accordion-content-height)' },
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: '0' },
      },
    },
    animation: {
      shimmer: 'shimmer 1.5s infinite',
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
},
```

---

## Required CSS variables (globals.css)

```css
:root {
  --bg-sidebar: #ffffff;
  --bg-sidebar-item-active: #eff6ff;
  --bg-sidebar-item-hover: #f8fafc;
  --color-sidebar-item-text: #64748b;
  --color-sidebar-item-active-text: #1e40af;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --bg-table-header: #f8fafc;
  --bg-tooltip: #0f172a;
  --color-tooltip-text: #f8fafc;
  --color-border: #e2e8f0;
  --color-border-hover: #94a3b8;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-accent: #3b82f6;
  --color-accent-dark: #2563eb;
  --color-accent-subtle: #eff6ff;
  --color-ring: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-error-dark: #dc2626;
  --color-warning: #f59e0b;
  --color-info: #06b6d4;
  --color-skeleton: #e2e8f0;
  --shadow-md: rgba(0,0,0,0.08);
  --role-student: #3b82f6;
  --role-teacher: #10b981;
  --role-admin: #f59e0b;
  --role-owner: #8b5cf6;
  --sidebar-width: 260px;
  --sidebar-width-collapsed: 72px;
}

.dark {
  --bg-sidebar: #0f172a;
  --bg-sidebar-item-active: #1e3a5f;
  --bg-sidebar-item-hover: #1e293b;
  --bg-surface: #0f172a;
  --bg-card: #1e293b;
  --bg-table-header: #1e293b;
  --color-border: #334155;
  --color-border-hover: #475569;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #64748b;
  --color-skeleton: #334155;
  --shadow-md: rgba(0,0,0,0.4);
}
```

---

## Path aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## File structure

```
src/shared/
├── components/
│   ├── index.ts                 ← barrel export for everything
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileHeader.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── MobileDrawer.tsx
│   ├── data-display/
│   │   ├── DataTable.tsx
│   │   ├── KPICard.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx       ← also exports ErrorState
│   │   ├── ErrorState.tsx       ← re-export
│   │   └── AvatarWithRole.tsx
│   ├── feedback/
│   │   ├── Toast.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── PageLoader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ErrorBoundary.tsx
│   ├── forms/
│   │   ├── FormField.tsx
│   │   ├── FileUploadZone.tsx
│   │   ├── RichTextEditor.tsx   ← use dynamic import, ssr:false
│   │   ├── DateRangePicker.tsx
│   │   └── SearchInput.tsx
│   ├── navigation/
│   │   ├── ThemeToggle.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── UserMenu.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── GlobalSearch.tsx
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx         ← also exports PieChart, AreaChart, SparklineChart
│   │   ├── PieChart.tsx         ← re-export
│   │   ├── AreaChart.tsx        ← re-export
│   │   └── SparklineChart.tsx   ← re-export
│   ├── animations/
│   │   ├── PageTransition.tsx   ← also exports FadeIn, StaggerList, CountUp
│   │   ├── FadeIn.tsx           ← re-export
│   │   ├── StaggerList.tsx      ← re-export
│   │   └── CountUp.tsx          ← re-export
│   └── ui/
│       ├── button.tsx           ← also exports Input, Label, Badge, Card*
│       ├── input.tsx            ← re-export
│       ├── label.tsx            ← re-export
│       ├── badge.tsx            ← re-export
│       ├── card.tsx             ← re-export
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── select.tsx
│       ├── checkbox.tsx         ← also exports RadioGroup*, Switch
│       ├── radio-group.tsx      ← re-export
│       ├── switch.tsx           ← re-export
│       ├── tabs.tsx
│       ├── tooltip.tsx          ← also exports Popover*, Separator, Avatar*, Progress, Skeleton
│       ├── popover.tsx          ← re-export
│       ├── separator.tsx        ← re-export
│       ├── avatar.tsx           ← re-export
│       ├── progress.tsx         ← re-export
│       ├── skeleton.tsx         ← re-export
│       ├── accordion.tsx        ← also exports Alert*, AlertDialog*
│       ├── alert.tsx            ← re-export
│       ├── alert-dialog.tsx     ← re-export
│       ├── sheet.tsx            ← also exports Command*, ScrollArea*
│       ├── command.tsx          ← re-export
│       └── scroll-area.tsx      ← re-export
├── hooks/
│   ├── useIsMobile.ts
│   ├── useDebounce.ts
│   └── useNotificationCount.ts
├── styles/
│   └── animations.css
├── types/
│   └── index.ts
└── utils/
    ├── cn.ts
    └── format.ts
```

---

## Notes for consuming pages

- `DataTable` is desktop-only. Use `MobileCardList` (Part 4) for mobile.
- `RichTextEditor` must be loaded with `dynamic(..., { ssr: false })`.
- `GlobalSearch` registers `Cmd+K` automatically — no extra setup needed.
- All chart components use `useIsMobile()` for responsive height (300–400px desktop, 180–220px mobile).
- `ConfirmDialog` renders as a bottom sheet on mobile (< sm breakpoint) automatically.
- `FileUploadZone` handles mobile camera capture automatically when `accept` includes image/* types.
