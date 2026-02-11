# Figma Media Integration Guide

## Required Assets

Export следующие элементы из Figma **с прозрачным фоном** и **БЕЗ текста**:

| Section | Asset Name | Export Size | Save Path |
|---------|-----------|-------------|-----------|
| Development | `development-visual.png` | ~500x568px | `/public/images/3d/` |
| How We Deliver | `sphere-rays.png` | ~250x400px | `/public/images/3d/` |
| Accountability | `spiral-torus.png` | ~350x400px | `/public/images/3d/` |

---

## Integration Steps

### 1. Development Section
**File:** `components/sections/development-section.tsx`

Find `<FigmaAssetPlaceholder>` and replace with:
```tsx
<img 
  src="/images/3d/development-visual.png" 
  alt="Development Layers" 
  className="w-full max-w-[500px]" 
/>
```

### 2. How We Deliver Section  
**File:** `components/sections/how-we-deliver.tsx`

Find `<CenterVisualPlaceholder />` and replace with:
```tsx
<img 
  src="/images/3d/sphere-rays.png" 
  alt="" 
  className="w-[250px] h-auto" 
/>
```

### 3. Accountability Section
**File:** `components/sections/accountability-section.tsx`

Find `<SpiralPlaceholder />` and replace with:
```tsx
<img 
  src="/images/3d/spiral-torus.png" 
  alt="" 
  className="w-full max-w-[350px]" 
/>
```

---

## Figma Export Settings

1. Select the visual element (beam, sphere, spiral)
2. **DO NOT** include text labels — they're already in React code
3. Export Settings:
   - Format: **PNG**
   - Scale: **2x** (for Retina)
   - Background: **Transparent** ☑️
4. Save to `/public/images/3d/`

---

## After Integration

Delete these helper components from the files:
- `FigmaAssetPlaceholder` function (development-section.tsx)
- `CenterVisualPlaceholder` function (how-we-deliver.tsx)  
- `SpiralPlaceholder` function (accountability-section.tsx)
