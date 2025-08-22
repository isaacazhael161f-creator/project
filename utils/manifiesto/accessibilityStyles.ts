/**
 * Estilos de accesibilidad para el escáner de manifiestos
 * Incluye soporte para alto contraste, modo oscuro y diferentes tamaños de fuente
 */

export const accessibilityStyles = `
/* Estilos base de accesibilidad */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Estilos de alto contraste */
.high-contrast {
  --primary-color: #000000;
  --secondary-color: #ffffff;
  --accent-color: #0000ff;
  --error-color: #ff0000;
  --success-color: #008000;
  --warning-color: #ff8c00;
  --border-color: #000000;
  --background-color: #ffffff;
  --text-color: #000000;
  --disabled-color: #808080;
}

.high-contrast * {
  border-color: var(--border-color) !important;
  color: var(--text-color) !important;
  background-color: var(--background-color) !important;
}

.high-contrast button,
.high-contrast input,
.high-contrast select,
.high-contrast textarea {
  border: 2px solid var(--border-color) !important;
  background-color: var(--background-color) !important;
  color: var(--text-color) !important;
}

.high-contrast button:focus,
.high-contrast input:focus,
.high-contrast select:focus,
.high-contrast textarea:focus {
  outline: 3px solid var(--accent-color) !important;
  outline-offset: 2px !important;
}

.high-contrast .error {
  color: var(--error-color) !important;
  border-color: var(--error-color) !important;
}

.high-contrast .success {
  color: var(--success-color) !important;
  border-color: var(--success-color) !important;
}

.high-contrast .warning {
  color: var(--warning-color) !important;
  border-color: var(--warning-color) !important;
}

/* Estilos de modo oscuro */
.dark-mode {
  --primary-color: #ffffff;
  --secondary-color: #1a1a1a;
  --accent-color: #4a9eff;
  --error-color: #ff6b6b;
  --success-color: #51cf66;
  --warning-color: #ffd43b;
  --border-color: #404040;
  --background-color: #1a1a1a;
  --surface-color: #2d2d2d;
  --text-color: #ffffff;
  --text-secondary: #b0b0b0;
  --disabled-color: #666666;
}

.dark-mode {
  background-color: var(--background-color);
  color: var(--text-color);
}

.dark-mode button,
.dark-mode input,
.dark-mode select,
.dark-mode textarea {
  background-color: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);
}

.dark-mode button:hover {
  background-color: var(--accent-color);
}

.dark-mode .surface {
  background-color: var(--surface-color);
}

/* Tamaños de fuente */
.font-small {
  font-size: 14px;
}

.font-small h1 { font-size: 1.5rem; }
.font-small h2 { font-size: 1.3rem; }
.font-small h3 { font-size: 1.1rem; }
.font-small button { font-size: 14px; }
.font-small input { font-size: 14px; }

.font-medium {
  font-size: 16px;
}

.font-medium h1 { font-size: 1.8rem; }
.font-medium h2 { font-size: 1.5rem; }
.font-medium h3 { font-size: 1.2rem; }
.font-medium button { font-size: 16px; }
.font-medium input { font-size: 16px; }

.font-large {
  font-size: 18px;
}

.font-large h1 { font-size: 2.2rem; }
.font-large h2 { font-size: 1.8rem; }
.font-large h3 { font-size: 1.5rem; }
.font-large button { font-size: 18px; }
.font-large input { font-size: 18px; }

/* Movimiento reducido */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* Estilos de foco mejorados */
*:focus {
  outline: 2px solid var(--accent-color, #4a9eff);
  outline-offset: 2px;
}

button:focus,
input:focus,
select:focus,
textarea:focus,
[tabindex]:focus {
  outline: 3px solid var(--accent-color, #4a9eff);
  outline-offset: 2px;
}

/* Estilos para elementos interactivos */
button,
[role="button"],
input,
select,
textarea,
[tabindex="0"],
[tabindex="-1"] {
  min-height: 44px;
  min-width: 44px;
}

/* Estilos para indicadores de estado */
[aria-invalid="true"] {
  border-color: var(--error-color, #ff6b6b) !important;
}

[aria-required="true"]::after {
  content: " *";
  color: var(--error-color, #ff6b6b);
}

/* Estilos para elementos ocultos pero accesibles */
[aria-hidden="true"] {
  display: none !important;
}

/* Estilos para regiones en vivo */
[aria-live="polite"],
[aria-live="assertive"] {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Estilos para tooltips accesibles */
[role="tooltip"] {
  position: absolute;
  z-index: 1000;
  padding: 8px 12px;
  background-color: var(--secondary-color, #333);
  color: var(--primary-color, #fff);
  border-radius: 4px;
  font-size: 14px;
  max-width: 250px;
  word-wrap: break-word;
}

/* Estilos para navegación por teclado */
.keyboard-navigation *:focus {
  outline: 3px solid var(--accent-color, #4a9eff);
  outline-offset: 2px;
}

/* Estilos para skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--accent-color, #4a9eff);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 0 0 4px 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 0;
}

/* Estilos para indicadores de progreso accesibles */
[role="progressbar"] {
  background-color: var(--border-color, #ddd);
  border-radius: 4px;
  overflow: hidden;
}

[role="progressbar"]::before {
  content: '';
  display: block;
  height: 100%;
  background-color: var(--accent-color, #4a9eff);
  transition: width 0.3s ease;
}

/* Estilos para alertas */
[role="alert"] {
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
  border-left: 4px solid var(--error-color, #ff6b6b);
  background-color: var(--error-color, #ff6b6b)10;
}

/* Estilos para navegación */
[role="navigation"] {
  border-bottom: 1px solid var(--border-color, #ddd);
  padding-bottom: 8px;
  margin-bottom: 16px;
}

/* Estilos para breadcrumbs */
[aria-label*="breadcrumb"] ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
}

[aria-label*="breadcrumb"] li:not(:last-child)::after {
  content: " / ";
  margin: 0 8px;
  color: var(--text-secondary, #666);
}

/* Media queries para preferencias del sistema */
@media (prefers-color-scheme: dark) {
  :root:not(.light-mode) {
    --primary-color: #ffffff;
    --secondary-color: #1a1a1a;
    --accent-color: #4a9eff;
    --background-color: #1a1a1a;
    --text-color: #ffffff;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  :root {
    --primary-color: #000000;
    --secondary-color: #ffffff;
    --accent-color: #0000ff;
    --border-color: #000000;
    --text-color: #000000;
  }
}
`;

export const injectAccessibilityStyles = () => {
  const styleId = 'accessibility-styles';
  
  // Remove existing styles if they exist
  const existingStyles = document.getElementById(styleId);
  if (existingStyles) {
    existingStyles.remove();
  }
  
  // Create and inject new styles
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = accessibilityStyles;
  document.head.appendChild(styleElement);
};

export const removeAccessibilityStyles = () => {
  const styleElement = document.getElementById('accessibility-styles');
  if (styleElement) {
    styleElement.remove();
  }
};