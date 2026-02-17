# Kimi UI Improvements Documentation

This document outlines all the UI improvements and animations added to the Mubble project.

---

## Part 1: Animation System (Phantom.com Inspired)

### Philosophy
The animation system is designed around:
- **Simplifying**: Conveying transparency and confidence
- **Ease with playfulness**: Blending smooth intuitive movement with engaging interactions
- **Exploration with dynamic movement**: Elements feel alive and responsive
- **Mainstream accessibility**: Making the app intuitive for all users

---

## Files Created

### 1. Animation Library

#### `apps/desktop/src/renderer/styles/animations.css`
Complete animation inventory with:

**Easing Curves:**
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-expressive: cubic-bezier(0.16, 1, 0.3, 1);
--ease-entrance: cubic-bezier(0, 0, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
--ease-ghost: cubic-bezier(0.45, 0, 0.55, 1);
```

**Animation Types:**

| Animation | Class | Duration | Use Case |
|-----------|-------|----------|----------|
| Fade In | `.animate-fade-in` | 400ms | General entrance |
| Fade In Up | `.animate-fade-in-up` | 500ms | Content reveal |
| Fade In Down | `.animate-fade-in-down` | 500ms | Dropdowns, toasts |
| Fade In Left | `.animate-fade-in-left` | 500ms | Slide in from left |
| Fade In Right | `.animate-fade-in-right` | 500ms | Slide in from right |
| Scale In | `.animate-scale-in` | 400ms | Cards, modals |
| Scale In Bounce | `.animate-scale-in-bounce` | 600ms | Icons, celebrations |
| Float | `.animate-float` | 4s infinite | Mascot elements |
| Float Gentle | `.animate-float-gentle` | 3s infinite | Subtle floating |
| Float Wiggle | `.animate-float-wiggle` | 2.5s infinite | Playful elements |
| Bob | `.animate-bob` | 2s infinite | Status indicators |
| Breathe | `.animate-breathe` | 3s infinite | Subtle pulse |
| Pulse Glow | `.animate-pulse-glow` | 2s infinite | Active states |
| Pulse Ring | `.animate-pulse-ring` | 1.5s infinite | Recording states |
| Gradient Shift | `.animate-gradient-shift` | 8s infinite | Backgrounds |
| Shimmer | `.animate-shimmer` | 2s infinite | Loading states |
| Skeleton | `.animate-skeleton` | 1.5s infinite | Placeholders |
| Wave | `.waveform-bar` | 1s infinite | Audio visualization |
| Ripple | `.ripple` | 600ms | Button clicks |
| Spin | `.animate-spin` | 1s infinite | Loading spinners |
| Spin Slow | `.animate-spin-slow` | 8s infinite | Decorative |
| Heartbeat | `.animate-heartbeat` | 1.5s infinite | Urgent states |
| Shake | `.animate-shake` | 500ms | Error states |
| Bounce | `.animate-bounce` | 1s infinite | Attention |
| Confetti Fall | `.confetti-fall` | 3s | Celebrations |
| Blur Reveal | `.animate-blur-reveal` | 600ms | Content reveal |
| Button Pulse | `.animate-button-pulse` | 2s infinite | CTA buttons |
| Glow Pulse | `.animate-glow-pulse` | 2s infinite | Highlights |

**Stagger Delays:**
`.stagger-1` through `.stagger-12` (50ms increments)

**Interactive States:**
- `.hover-lift` - Card lift on hover
- `.hover-scale` - Scale on hover (1.05)
- `.hover-scale-sm` - Subtle scale (1.02)
- `.hover-glow` - Glow effect on hover
- `.hover-brighten` - Brightness increase
- `.focus-ring` - Focus state ring
- `.active-scale` - Press feedback
- `.btn-transition` - Button transitions
- `.link-underline` - Underline slide animation
- `.card-tilt` - 3D tilt effect
- `.magnetic` - Magnetic cursor attraction
- `.ripple-container` - Click ripple container

**Loading States:**
- `.loading-skeleton` - Skeleton placeholder
- `.loading-dots` - Animated dots

**Page Transitions:**
- `.page-enter` - Page enter animation
- `.page-exit` - Page exit animation

**Toast/Notification:**
- `.toast-enter` - Slide in from right
- `.toast-exit` - Slide out to right

**Modal:**
- `.modal-enter` - Scale in
- `.modal-exit` - Scale out
- `.overlay-enter` - Fade in
- `.overlay-exit` - Fade out

**Success/Celebration:**
- `.animate-success-pop` - Checkmark pop
- `.animate-checkmark` - SVG draw animation

**Delay Utilities:**
`.delay-100` through `.delay-1000` (100ms increments)

**Duration Utilities:**
`.duration-200` through `.duration-1000`

---

#### `apps/desktop/src/renderer/hooks/useScrollAnimation.ts`
Custom hooks for scroll-based animations:

**`useScrollAnimation(options)`**
```typescript
const { ref, isInView } = useScrollAnimation({
  threshold: 0.1,      // Trigger point (0-1)
  rootMargin: '0px',   // Margin around root
  triggerOnce: true,   // Only trigger once
})
```

**`useParallax(speed)`**
```typescript
const { ref, offset } = useParallax(0.5)  // Speed multiplier
```

**`useScrollProgress()`**
```typescript
const progress = useScrollProgress()  // 0 to 1
```

**`useStaggerAnimation(itemCount, baseDelay)`**
```typescript
const getDelay = useStaggerAnimation(10, 50)
// getDelay(0) => { animationDelay: '0ms' }
// getDelay(1) => { animationDelay: '50ms' }
```

**`useMousePosition()`**
```typescript
const { x, y } = useMousePosition()
```

**`useMagneticEffect(strength)`**
```typescript
const { ref, transform } = useMagneticEffect(0.3)
// transform => { x: number, y: number }
```

**`useCountUp(end, duration, start)`**
```typescript
const { count, startAnimation, isAnimating } = useCountUp(1000, 1500, 0)
```

**`useTypewriter(text, speed)`**
```typescript
const { displayText, startTyping, reset, isTyping, isComplete } = 
  useTypewriter('Hello World', 50)
```

---

#### `apps/desktop/src/renderer/components/ui/Animated.tsx`
React animation components:

**`Animated`** - Declarative animation wrapper
```tsx
<Animated 
  animation="fade-in-up" 
  delay={100} 
  duration={500}
  trigger="in-view"
>
  <Content />
</Animated>
```

**`StaggerContainer`** - Sequential child animations
```tsx
<StaggerContainer staggerDelay={50} animation="fade-in-up">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</StaggerContainer>
```

**`AnimatedNumber`** - Counting animation
```tsx
<AnimatedNumber value={1000} duration={1500} trigger="in-view" />
```

**`RippleButton`** - Material-style ripple
```tsx
<RippleButton variant="primary" onClick={handleClick}>
  Click Me
</RippleButton>
```

**`PulseRing`** - Status indicator
```tsx
<PulseRing size={12} color="#8b5cf6" variant="pulse" />
```

**`Waveform`** - Audio visualization
```tsx
<Waveform bars={12} isActive={true} color="#8b5cf6" height={24} />
```

**`HoverScale`** - Scale wrapper
```tsx
<HoverScale scale={1.05}>
  <Card>Content</Card>
</HoverScale>
```

**`FadeTransition`** - Conditional render
```tsx
<FadeTransition show={isVisible} duration={200}>
  <Content />
</FadeTransition>
```

**`MagneticButton`** - Cursor following
```tsx
<MagneticButton strength={0.3} onClick={handleClick}>
  Magnetic
</MagneticButton>
```

**`FloatingElement`** - Ghost-like floating
```tsx
<FloatingElement variant="gentle" duration={3}>
  <Mascot />
</FloatingElement>
```

**`TextReveal`** - Text animation
```tsx
<TextReveal text="Hello" delay={100} trigger="in-view" />
```

**`BlurReveal`** - Blur to clear
```tsx
<BlurReveal delay={200}>
  <Content />
</BlurReveal>
```

**`Skeleton`** - Loading placeholder
```tsx
<Skeleton width="100%" height={20} circle={false} />
```

**`Confetti`** - Celebration effect
```tsx
<Confetti active={showCelebration} count={50} />
```

---

### 2. UI Components

#### `apps/desktop/src/renderer/components/ui/Button.tsx`

**Features:**
- Ripple effect on click
- Magnetic cursor attraction (optional)
- Pulse animation for CTAs
- Phantom-style variants:
  - `primary` - White bg, black text, rounded-full
  - `secondary` - Transparent, white border, rounded-full
  - `ghost` - Subtle hover
  - `outline` - Bordered
  - `danger` - Red accent

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  showArrow?: boolean      // Chevron right
  magnetic?: boolean       // Magnetic effect
  pulse?: boolean          // Idle pulse
  loading?: boolean
  fullWidth?: boolean
}
```

**Usage:**
```tsx
<Button variant="primary" magnetic pulse>
  Start Dictating
</Button>
<Button variant="secondary" showArrow>
  Configure
</Button>
```

---

#### `apps/desktop/src/renderer/components/ui/Card.tsx`

**Features:**
- Gradient backgrounds
- Glow effect
- 3D tilt on hover
- Magnetic effect
- Entrance animations

**Props:**
```typescript
interface CardProps {
  gradient?: boolean      // Dark gradient bg
  glow?: boolean          // Violet glow
  tilt?: boolean          // 3D tilt on hover
  magnetic?: boolean      // Magnetic effect
  hover?: boolean         // Lift on hover
  animate?: boolean       // Entrance animation
  animationDelay?: number
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}
```

**Additional Components:**
- `CardHeader` - Header with icon, title, description
- `FeatureCard` - Feature showcase card
- `StatCard` - Analytics stat card

---

## Part 2: CryptoFi/Phantom Design Update

### Color Palette

```css
/* Backgrounds */
--color-mubble-bg: #0a0a0a;           /* Deep black */
--color-mubble-surface: #111111;      /* Card bg */
--color-mubble-surface-hover: #1a1a1a;

/* Primary */
--color-mubble-primary: #ffffff;      /* White on dark */
--color-mubble-primary-hover: #e5e5e5;

/* Accent */
--color-mubble-accent: #8b5cf6;       /* Violet */
--color-mubble-accent-hover: #a78bfa;

/* Text */
--color-mubble-text: #ffffff;         /* Primary */
--color-mubble-text-secondary: #a3a3a3;
--color-mubble-text-muted: #737373;

/* Status */
--color-mubble-success: #22c55e;      /* Emerald */
--color-mubble-error: #ef4444;        /* Red */
--color-mubble-warning: #f59e0b;      /* Amber */
```

---

### Page-Specific Animations

#### Home Page (`HomePage.tsx`)

**Animations:**
1. Background gradient pulse (ambient)
2. Floating particle elements (mascot-like)
3. Hero card blur reveal
4. Icon scale-in-bounce
5. Headline staggered fade-in-up
6. Subtitle fade-in-up
7. CTA buttons fade-in-up
8. Trust indicators fade-in
9. Quick actions staggered grid

**Effects:**
- Glow behind hero card
- Floating decorative dots
- Violet accent animations

---

#### Flow Bar (`FlowBarView.tsx`)

**Animations:**
1. Scale-in on mount
2. Hover scale effect
3. Recording glow pulse
4. Double ping rings when recording
5. Waveform bars animation
6. Status text transitions
7. Transcript fade-in
8. Status dot gentle float

---

#### History Page (`HistoryPage.tsx`)

**Animations:**
1. Header blur reveal on scroll
2. Search input focus effects
3. Loading spinner with glow
4. Empty state bounce + float
5. Entry cards staggered reveal
6. Hover accent line (scale-y)
7. Action buttons slide + fade on hover
8. Copy success pop animation

---

#### Analytics Page (`AnalyticsPage.tsx`)

**Animations:**
1. Header blur reveal
2. Loading spinner with pulse
3. Stat cards staggered scale-in
4. AnimatedNumber counting
5. Progress bars width animation
6. Provider cards staggered
7. Daily trend bars staggered
8. Hover tooltips on bars

---

### Navigation (`MainLayout.tsx`)

**Animations:**
1. Title bar fade-in-down
2. Logo gentle float
3. Nav icons staggered reveal
4. Active state scale + shadow
5. Hover scale + rotate
6. Active indicator dot
7. Bottom decoration pulse
8. Page transition fade-in-up

---

## Usage Examples

### Basic Entrance Animation
```tsx
<Animated animation="fade-in-up" delay={100}>
  <Content />
</Animated>
```

### Scroll-Triggered Animation
```tsx
<Animated animation="fade-in-up" trigger="in-view" threshold={0.2}>
  <Content />
</Animated>
```

### Staggered List
```tsx
<StaggerContainer staggerDelay={50} animation="fade-in-up">
  {items.map((item, i) => (
    <Card key={item.id} animate animationDelay={i * 50}>
      {item.content}
    </Card>
  ))}
</StaggerContainer>
```

### Magnetic Button
```tsx
<Button magnetic pulse variant="primary">
  CTA Button
</Button>
```

### 3D Tilt Card
```tsx
<Card tilt gradient glow>
  <Content />
</Card>
```

### Floating Elements
```tsx
<FloatingElement variant="gentle" duration={3}>
  <DecorativeDot />
</FloatingElement>
```

---

## Accessibility

- All animations respect `prefers-reduced-motion: reduce`
- Focus states are visible
- High contrast maintained
- Interactive elements have clear hover/focus states
- Animation durations are reasonable (not distracting)

---

## Performance Notes

- Uses `transform` and `opacity` for GPU acceleration
- `will-change` hints used sparingly
- Intersection Observer for scroll triggers
- `requestAnimationFrame` for smooth animations
- Debounced scroll handlers
- Passive event listeners where possible

---

## Notes for Claude

All UI improvements are purely presentational and do not affect:
- Core application logic
- IPC communication
- Data models or types
- Business logic in handlers

All changes are additive and backward-compatible.
