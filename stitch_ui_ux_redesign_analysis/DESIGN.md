---
name: Autonomous Talent Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#3130c0'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b4dd8'
  on-tertiary-container: '#d9d8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  surface-canvas: '#F8FAFC'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E8F0'
  border-muted: '#F1F5F9'
  text-primary: '#0F172A'
  text-secondary: '#64748B'
  text-muted: '#94A3B8'
  success-emerald: '#10B981'
  warning-amber: '#F59E0B'
  error-rose: '#EF4444'
  ai-gradient-start: '#4F46E5'
  ai-gradient-end: '#9333EA'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  metric-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-velocity executive clarity, computational precision, and quiet confidence for an enterprise AI Applicant Tracking and Talent Intelligence Suite. Designed for Chief People Officers, Talent Acquisition Directors, and specialized recruiters, the interface balances dense algorithmic insight with cognitive ease. 

The aesthetic marries **Modern Corporate SaaS** with **Minimalist AI Aura**. Clean, structured canvas planes prevent cognitive fatigue during extended pipeline reviews, while subtle electric-indigo luminous gradients designate autonomous, generative AI actions and candidate matching synthesis. The visual environment communicates surgical accuracy, reliability, and forward-leaning technological capability without drifting into experimental or noisy novelty.

## Colors

The palette establishes an enterprise-grade hierarchical foundation:

- **Primary & AI Spectrum:** `#4F46E5` serves as the primary action and anchor tone, paired with secondary `#2563EB` for systematic workflows and pipeline milestones. `#6366F1` acts as the tertiary highlight. An autonomous gradient blending `#4F46E5` to `#9333EA` is strictly reserved for copilot surfaces, match score highlights, and automated candidate summaries.
- **Neutrals & Surfaces:** Built on a tailored Slate matrix. The canvas base sits at `#F8FAFC`, allowing `#FFFFFF` card layers to project subtle physical elevation. Structural boundaries utilize `#E2E8F0` for active containers and `#F1F5F9` for secondary dividers. Primary body and metric text rely on `#0F172A` to ensure maximum legibility and strict WCAG AAA conformance.
- **Domain Accents:** Emerald (`#10B981`) denotes positive match ratings, target offers, and healthy velocity. Amber (`#F59E0B`) highlights pipeline stalls and interview flags. Rose (`#EF4444`) reflects rejected states or SLA breaches.

## Typography

The typography pairs **Plus Jakarta Sans** for display surfaces, high-level structural headlines, and KPI metric counters with **Inter** for all interactive components, dense tabular candidate views, and conversational copilot outputs.

- **KPI Metrics & Data Integrity:** Key indicators and numerical values use `metric-stat` with CSS `font-variant-numeric: tabular-nums` enabled. This guarantees perfectly aligned numeric columns across high-frequency data grids and pipeline reports.
- **Labels & Micro-copy:** Uppercase tags, match probability badges, and pipeline stages rely on `label-sm` with slight positive tracking to ensure instant legibility against neutral backgrounds.

## Layout & Spacing

The system enforces a flexible 12-column grid layout across desktop environments with structured density variations:

- **Desktop (1280px+):** Fluid 12-column grid with a `2rem` outer margin and `1.5rem` gutters. High-density table displays and multi-stage kanban boards collapse gutters to `1rem` via scoped grid modifiers.
- **Tablet (768px - 1279px):** 8-column layout with `1.5rem` outer margins. Multi-column tables collapse to prioritized master-detail panes or horizontal scroll containers.
- **Mobile (< 768px):** 4-column layout with `1rem` outer margins and `0.75rem` gutters. Complex dashboard widgets reflow into vertically stacked single-column cards.
- **Rhythm & Proportions:** Internal card padding scales strictly between `space-md` (`1rem`) for dense information components (such as interview stage cards) and `space-lg` (`1.5rem`) for high-level analytical widgets and copilot dialogs.

## Elevation & Depth

Visual hierarchy combines low-contrast hairline outlines with multi-layered, ultra-diffused ambient drop shadows:

- **Level 0 (Canvas):** Flat base surface (`#F8FAFC`). No border, no shadow.
- **Level 1 (Card & Modular Widgets):** Pure white fill (`#FFFFFF`) with a 1px border (`#E2E8F0`). Shadow: `0px 1px 3px rgba(15, 23, 42, 0.04), 0px 4px 8px -2px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Hover States, Candidate Cards & Popovers):** Elevated white fill with a border shifted to `#CBD5E1`. Shadow: `0px 4px 12px -2px rgba(15, 23, 42, 0.08), 0px 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals & Flyout Candidate Dossiers):** Pure white surface floating above a backdrop scrim (`rgba(15, 23, 42, 0.4)` with 4px backdrop blur). Shadow: `0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 8px 10px -6px rgba(15, 23, 42, 0.06)`.
- **AI Glowing Elevation (Active Copilot & Match Insight):** Elements driven by AI actions feature a dual-ring glow: a 1px inner stroke colored with an indigo-to-violet gradient, and an ambient aura cast via `0px 0px 16px -2px rgba(99, 102, 241, 0.25)`.

## Shapes

The design system maintains a modern, balanced curvature level of `2` (`0.5rem` or `8px` default radius):

- **Inputs, Buttons, and Select Menus:** Bound to `0.5rem` (8px) corners, providing a crisp, modern tool aesthetic.
- **Cards, Modals, and Dashboard Containers:** Scaled to `rounded-lg` (`0.75rem` / 12px) to softly frame high-density internal content.
- **Pills and Status Chips:** Employ full border-radius (`9999px`) to create clear differentiation between actionable, square-cornered UI elements and passive state indicators.

## Components

### Buttons
- **Primary:** Solid `#4F46E5` background, `#FFFFFF` text, `0.5rem` radius, subtle top-edge inner highlight (`inset 0 1px 0 rgba(255,255,255,0.15)`). Hover shifts background to `#4338CA`.
- **Secondary / Outline:** Background `#FFFFFF`, 1px border `#E2E8F0`, text `#0F172A`. Hover shifts background to `#F8FAFC` and border to `#CBD5E1`.
- **AI Action Button:** Gradient fill from `#4F46E5` to `#7C3AED`, `#FFFFFF` text, glowing ambient hover state with smooth 200ms scale transition (1.01x).

### Form Inputs & Copilot Bar
- **Standard Input:** Height 40px, `#FFFFFF` fill, 1px `#E2E8F0` border, `0.5rem` radius, placeholder `#94A3B8`. Focus applies a 1px border `#6366F1` and a `0 0 0 3px rgba(99, 102, 241, 0.15)` focus ring.
- **Intelligent Copilot Field:** Floating conversational prompt bar with `#FFFFFF` background, glassmorphism backdrop blur (12px), 1px gradient border (`#6366F1` to `#A855F7`), accompanied by an internal sparkling AI icon and prompt shortcut tags.

### Badges & Chips
- **Match Score Badge:** Pill shape (`9999px`), `11px` uppercase tracking, composed of tonal tint backgrounds:
  - High Match (>85%): Background `rgba(16, 185, 129, 0.12)`, text `#047857`.
  - Moderate Match (60–84%): Background `rgba(79, 70, 229, 0.12)`, text `#4338CA`.
  - Review Needed: Background `rgba(245, 158, 11, 0.12)`, text `#B45309`.

### Cards & Pipeline Columns
- **Candidate Stage Card:** High-density surface, `#FFFFFF` fill, 1px `#E2E8F0` border, `12px` padding. Contains candidate avatar, name in `label-md`, target role, stage duration tag, and dynamic fit percentage badge. Hover displays a subtle drag handle and lifts elevation to Level 2.
- **Analytics KPI Card:** Contains stat value in `metric-stat` (`Plus Jakarta Sans`), label in `label-sm`, and an inline trend badge displaying month-over-month percentage change.

### Segmented Controls & Tabs
- Encapsulated within a `#F1F5F9` container with `4px` padding. Active tab features a `#FFFFFF` pill/rounded background with 1px border `#E2E8F0` and micro-shadow `0 1px 2px rgba(0,0,0,0.05)`, creating tactile separation from unselected text options.