# Yappie — Brand Kit

## Tipografía

| Uso                             | Font                                   | Weights            | Dónde                                |
| ------------------------------- | -------------------------------------- | ------------------ | ------------------------------------ |
| Headings, logo, nav, CTAs       | Sora                                   | 500, 600, 700, 800 | `font-family: 'Sora', sans-serif`    |
| Body, UI, descripciones, badges | DM Sans                                | 400, 500, 700      | `font-family: 'DM Sans', sans-serif` |
| Código                          | JetBrains Mono o monospace del sistema | 400                | `font-family: var(--font-mono)`      |

## Paleta de colores

### Core

| Nombre        | Hex                   | Variable CSS     | Uso                                               |
| ------------- | --------------------- | ---------------- | ------------------------------------------------- |
| Yappie Orange | `#E8612F` / `#FF6B35` | `--yp-primary`   | Primary: CTAs, logo, enlaces activos (dark/light) |
| Warm Amber    | `#FFB347`             | `--yp-secondary` | Highlights, badges hover, gradientes con orange   |
| Success Green | `#15803D` / `#16A34A` | `--yp-success`   | Completado, exportado, status OK (dark/light)     |
| Error Red     | `#FF4757`             | `--yp-error`     | Errores, fallos, destructive actions              |
| Info Blue     | `#5B86E5`             | `--yp-info`      | Informativos, draft status, links secundarios     |

### Dark mode

| Nombre         | Hex                      | Variable CSS   | Uso                                                |
| -------------- | ------------------------ | -------------- | -------------------------------------------------- |
| Deep Navy      | `#1C1C28`                | `--yp-navy`    | Fondo principal dark mode (neutral con toque azul) |
| Surface        | `#2A2A38`                | `--yp-surface` | Cards, sidebars, surfaces elevadas                 |
| Text Primary   | `#F5F5F5`                | —              | Texto principal sobre dark bg                      |
| Text Secondary | `#A0A0B8`                | —              | Texto secundario, hints                            |
| Border         | `rgba(255,255,255,0.08)` | —              | Bordes sutiles                                     |

### Light mode

| Nombre           | Hex                | Variable CSS    | Uso                                                |
| ---------------- | ------------------ | --------------- | -------------------------------------------------- |
| Light Background | `#FFFAF5`          | `--yp-light-bg` | Fondo principal (off-white cálido, no blanco puro) |
| Card White       | `#FFFFFF`          | —               | Cards, modales, surfaces                           |
| Text Primary     | `#1B1B2F`          | —               | Texto principal (mismo navy que el dark bg)        |
| Text Secondary   | `#6B6B80`          | —               | Texto secundario                                   |
| Border           | `rgba(0,0,0,0.08)` | —               | Bordes sutiles                                     |

### Estados semánticos (backgrounds con opacidad)

| Estado       | Background               | Texto     |
| ------------ | ------------------------ | --------- |
| Processing   | `rgba(255,107,53, 0.12)` | `#FF6B35` |
| Completed    | `rgba(46,212,122, 0.12)` | `#2ED47A` |
| Error/Failed | `rgba(255,71,87, 0.12)`  | `#FF4757` |
| Draft/Info   | `rgba(91,134,229, 0.12)` | `#5B86E5` |
| Warning      | `rgba(255,179,71, 0.12)` | `#D4940A` |

## Variables CSS

```css
:root {
  /* Colors */
  --yp-orange: #e8612f; /* dark */ / #ff6b35; /* light */
  --yp-amber: #ffb347;
  --yp-green: #15803d; /* dark */ / #16a34a; /* light */
  --yp-red: #ff4757;
  --yp-blue: #5b86e5;
  --yp-navy: #1c1c28;
  --yp-surface: #2a2a38;
  --yp-light-bg: #fffaf5;

  /* Typography */
  --yp-font-heading: "Sora", sans-serif;
  --yp-font-body: "DM Sans", sans-serif;

  /* Radii */
  --yp-radius-sm: 6px;
  --yp-radius-md: 8px;
  --yp-radius-lg: 12px;
  --yp-radius-xl: 16px;
}
```

## Tailwind config (extracto)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        yp: {
          orange: "#FF6B35",
          amber: "#FFB347",
          green: "#2ED47A",
          red: "#FF4757",
          blue: "#5B86E5",
          navy: "#1C1C28",
          surface: "#2A2A38",
          "light-bg": "#FFFAF5",
        },
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
};
```

## Componentes de referencia

### Botones

- **Primary:** bg yp-orange, texto blanco, font Sora 600, radius 8px
- **Secondary:** borde yp-orange 1.5px, texto yp-orange, bg transparente
- **Ghost:** borde border-tertiary 1px, texto secondary, bg transparente

### Badges de status

- Font DM Sans 500, 11px
- Padding 4px 10px, radius 6px
- Background semántico al 12% opacidad + texto del color sólido

### Barra de quota

- Track: bg-secondary, height 6px, radius 3px
- Fill: gradiente de yp-orange a yp-amber
- Texto: Sora 600 12px, color yp-orange

## Reglas generales

- Dark-first: diseñar primero para dark mode, adaptar a light
- Off-white cálido (#FFFAF5) en light mode, nunca blanco puro (#FFF)
- NUNCA usar Inter, Roboto, Arial o fonts genéricas
- Bordes sutiles (0.08 opacity), no bordes duros
- Esquinas redondeadas consistentes: 8px por defecto, 12px para cards
- El naranja es el acento — usarlo con intención, no en todas partes
