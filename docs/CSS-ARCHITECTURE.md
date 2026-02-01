# Arquitectura y Estándares CSS - SmartDentalCloud

> **IMPORTANTE**: Este documento es la fuente única de verdad para todos los estilos CSS en el proyecto. Cualquier desviación de este estándar debe ser rechazada en code review.

---

## 📋 Tabla de Contenidos

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Sistema de Variables Globales](#sistema-de-variables-globales)
3. [Nomenclatura Estándar](#nomenclatura-estándar)
4. [Arquitectura de Estilos](#arquitectura-de-estilos)
5. [Guía de Uso](#guía-de-uso)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Antipatrones y Errores Comunes](#antipatrones-y-errores-comunes)
8. [Checklist de Code Review](#checklist-de-code-review)

---

## 🎯 Filosofía de Diseño

### Principios Fundamentales

1. **Un Solo Estándar**: Existe una única forma correcta de nombrar y usar variables CSS
2. **Variables Globales First**: Siempre usar variables globales, nunca valores hardcodeados
3. **Consistencia Absoluta**: 100% de los componentes siguen el mismo patrón
4. **Mantenibilidad**: Cambios centralizados en `_variables.scss`
5. **Escalabilidad**: Sistema preparado para múltiples themes

### Objetivos

- ✅ Zero duplicación de estilos
- ✅ Zero valores hardcodeados
- ✅ Zero inconsistencias entre componentes
- ✅ Facilitar cambios globales de diseño
- ✅ Soportar múltiples themes (claro, oscuro, alto contraste)

---

## 🌐 Sistema de Variables Globales

### Ubicación

```
src/
└── styles/
    ├── _variables.scss    ← FUENTE ÚNICA DE VERDAD
    ├── _layout.scss
    ├── _components.scss
    └── styles.scss        ← Importa todo
```

### Estructura de `_variables.scss`

```scss
:root {
  // ===== BACKGROUNDS (Superficies) =====
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-tertiary: #f1f5f9;
  
  // ===== TEXT COLORS =====
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  
  // ===== PRIMARY COLOR =====
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1e40af;
  
  // ===== SUCCESS COLOR =====
  --success-50: #f0fdf4;
  --success-100: #dcfce7;
  --success-500: #10b981;
  --success-600: #059669;
  --success-700: #047857;
  
  // ===== ERROR/DANGER COLOR =====
  --error-50: #fef2f2;
  --error-100: #fee2e2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;
  
  // ===== WARNING COLOR =====
  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;
  
  // ===== INFO COLOR =====
  --info-50: #f0f9ff;
  --info-100: #e0f2fe;
  --info-500: #06b6d4;
  --info-600: #0891b2;
  --info-700: #0e7490;
  
  // ===== BORDERS =====
  --border-primary: #e2e8f0;
  --border-secondary: #f1f5f9;
  --border-medium: #d1d5db;
  
  // ===== BORDER RADIUS =====
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;
  
  // ===== SPACING =====
  --spacing-xs: 4px;
  --spacing-sm: 6px;
  --spacing-md: 10px;
  --spacing-lg: 14px;
  --spacing-xl: 20px;
  --spacing-2xl: 28px;
  --spacing-3xl: 36px;
  --spacing-4xl: 44px;
  
  // ===== TYPOGRAPHY =====
  --font-size-xs: 0.6875rem;    // 11px
  --font-size-sm: 0.8125rem;    // 13px
  --font-size-base: 0.875rem;   // 14px
  --font-size-lg: 1rem;         // 16px
  --font-size-xl: 1.125rem;     // 18px
  --font-size-2xl: 1.25rem;     // 20px
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  // ===== TRANSITIONS =====
  --transition-fast: all 0.15s ease;
  --transition-base: all 0.2s ease;
  --transition-slow: all 0.3s ease;
  
  // ===== SHADOWS =====
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

---

## 📖 Nomenclatura Estándar

### ❌ INCORRECTO (NO USAR)

```scss
// Prefijos "color-" NO SE USAN en este proyecto
--color-text-primary       ❌
--color-background-primary ❌
--color-primary           ❌
--color-border            ❌
--border-radius-md        ❌
--transition-normal       ❌
```

### ✅ CORRECTO (USAR SIEMPRE)

```scss
// Nombres directos sin prefijo redundante
--text-primary            ✅
--surface-primary         ✅
--primary-500             ✅
--border-primary          ✅
--radius-md               ✅
--transition-base         ✅
```

### Patrones de Nomenclatura

#### 1. Backgrounds/Superficies
```scss
--surface-{nivel}
  Ejemplos: --surface-primary, --surface-secondary, --surface-tertiary
```

#### 2. Textos
```scss
--text-{nivel}
  Ejemplos: --text-primary, --text-secondary, --text-tertiary, --text-muted
```

#### 3. Colores de Estado
```scss
--{estado}-{intensidad}
  Ejemplos: 
  - --primary-500, --primary-600, --primary-700
  - --success-100, --success-500, --success-700
  - --error-100, --error-500, --error-700
```

#### 4. Bordes
```scss
--border-{tipo}
  Ejemplos: --border-primary, --border-secondary, --border-medium
```

#### 5. Border Radius
```scss
--radius-{tamaño}
  Ejemplos: --radius-sm, --radius-md, --radius-lg, --radius-full
```

#### 6. Spacing
```scss
--spacing-{tamaño}
  Ejemplos: --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg
```

#### 7. Transiciones
```scss
--transition-{velocidad}
  Ejemplos: --transition-fast, --transition-base, --transition-slow
```

---

## 🏗️ Arquitectura de Estilos

### Jerarquía de Archivos

```
src/
├── styles/                      ← Estilos globales
│   ├── _variables.scss          ← Variables CSS (FUENTE ÚNICA)
│   ├── _layout.scss             ← Layouts globales
│   ├── _components.scss         ← Componentes reutilizables
│   └── styles.scss              ← Punto de entrada
│
├── app/
│   ├── features/                ← Features específicas
│   │   ├── users/
│   │   │   └── components/
│   │   │       ├── user-list/
│   │   │       │   ├── user-list.ts
│   │   │       │   ├── user-list.html
│   │   │       │   └── user-list.scss  ← Estilos específicos del componente
│   │   │       └── ...
│   │   └── ...
│   │
│   └── shared/                  ← Componentes compartidos
│       └── components/
│           ├── header/
│           │   └── header.scss
│           └── ...
```

### Reglas de Ubicación

1. **Variables Globales**: SOLO en `src/styles/_variables.scss`
2. **Estilos Globales**: En `src/styles/*.scss`
3. **Estilos de Componente**: Al lado del componente `.ts`
4. **NO crear** archivos de variables por feature/componente

---

## 📘 Guía de Uso

### Paso 1: Importar Variables (Automático)

Las variables CSS están disponibles globalmente. NO necesitas importar nada.

```scss
// ❌ NO HACER - No es necesario
@import 'variables';

// ✅ Las variables ya están disponibles
.my-component {
  background: var(--surface-primary);
}
```

### Paso 2: Usar Variables SIEMPRE

```scss
// ❌ INCORRECTO - Valores hardcodeados
.component {
  background: #ffffff;
  color: #1e293b;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

// ✅ CORRECTO - Variables globales
.component {
  background: var(--surface-primary);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}
```

### Paso 3: Colores de Estado

```scss
// Estados: success, error, warning, info
.success-message {
  background: var(--success-100);  // Background claro
  color: var(--success-700);       // Texto oscuro
  border: 1px solid var(--success-500);
}

.error-message {
  background: var(--error-100);
  color: var(--error-700);
  border: 1px solid var(--error-500);
}
```

### Paso 4: Responsive con Variables

```scss
.container {
  padding: var(--spacing-xl);
  max-width: var(--layout-max-width);
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Card Component

```scss
// ✅ CORRECTO
.card {
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  
  .card-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }
  
  .card-text {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-normal);
  }
}
```

### Ejemplo 2: Button Component

```scss
.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-fast);
  border: none;
  cursor: pointer;
  
  &.btn-primary {
    background: var(--primary-500);
    color: white;
    
    &:hover {
      background: var(--primary-600);
      box-shadow: var(--shadow-md);
    }
  }
  
  &.btn-success {
    background: var(--success-500);
    color: white;
    
    &:hover {
      background: var(--success-600);
    }
  }
}
```

### Ejemplo 3: Form Component

```scss
.form-group {
  margin-bottom: var(--spacing-md);
  
  .form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }
  
  .form-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    background: var(--surface-primary);
    color: var(--text-primary);
    transition: var(--transition-base);
    
    &:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px var(--primary-100);
    }
    
    &.error {
      border-color: var(--error-500);
      
      &:focus {
        box-shadow: 0 0 0 3px var(--error-100);
      }
    }
  }
  
  .error-message {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--error-500);
    margin-top: var(--spacing-xs);
  }
}
```

---

## 🚫 Antipatrones y Errores Comunes

### Error #1: Valores Hardcodeados

```scss
// ❌ NUNCA HACER ESTO
.component {
  background: #ffffff;
  color: #1e293b;
  padding: 16px;
  border-radius: 8px;
}

// ✅ SIEMPRE HACER ESTO
.component {
  background: var(--surface-primary);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}
```

### Error #2: Nomenclatura Inconsistente

```scss
// ❌ INCORRECTO - Prefijos incorrectos
.component {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
}

// ✅ CORRECTO - Nomenclatura del proyecto
.component {
  background: var(--surface-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}
```

### Error #3: Crear Variables Locales

```scss
// ❌ NUNCA crear variables por componente
:host {
  --my-component-bg: #ffffff;
  --my-component-color: #1e293b;
}

.component {
  background: var(--my-component-bg);
  color: var(--my-component-color);
}

// ✅ USAR variables globales
.component {
  background: var(--surface-primary);
  color: var(--text-primary);
}
```

### Error #4: Mezclar Sistemas

```scss
// ❌ NO mezclar valores directos con variables
.component {
  background: var(--surface-primary);
  color: #1e293b;              // ❌ Hardcoded
  padding: var(--spacing-lg);
  border-radius: 8px;          // ❌ Hardcoded
}

// ✅ TODO con variables
.component {
  background: var(--surface-primary);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}
```

### Error #5: Importar Variables en Componentes

```scss
// ❌ NO HACER - No es necesario
@import '../../../styles/variables';

.component {
  background: var(--surface-primary);
}

// ✅ Las variables CSS ya están disponibles globalmente
.component {
  background: var(--surface-primary);
}
```

---

## ✅ Checklist de Code Review

### Para Revisores

Al revisar código CSS, verificar:

- [ ] ¿Se usan variables CSS en lugar de valores hardcodeados?
- [ ] ¿La nomenclatura coincide con el estándar del proyecto?
- [ ] ¿NO hay prefijos como `--color-`, `--border-radius-`?
- [ ] ¿NO se crean variables locales por componente?
- [ ] ¿Los colores de estado usan las intensidades correctas?
- [ ] ¿El spacing usa las variables predefinidas?
- [ ] ¿Las transiciones usan variables globales?
- [ ] ¿NO hay imports de archivos de variables?

### Para Desarrolladores

Antes de crear un PR con estilos CSS:

- [ ] Revisé que uso variables en el 100% del código
- [ ] Verifiqué la nomenclatura contra este documento
- [ ] No creé variables nuevas sin consultar
- [ ] No usé valores hardcodeados
- [ ] Probé que funciona con theme oscuro (si aplica)
- [ ] El código sigue los ejemplos de este documento

---

## 🎨 Soporte de Themes

El sistema de variables soporta múltiples themes:

```scss
// Theme Claro (default)
:root {
  --surface-primary: #ffffff;
  --text-primary: #1e293b;
}

// Theme Oscuro
[data-theme="dark"] {
  --surface-primary: #1e293b;
  --text-primary: #f8fafc;
}

// Theme Alto Contraste
[data-theme="high-contrast"] {
  --surface-primary: #ffffff;
  --text-primary: #000000;
}
```

**Importante**: Al usar las variables correctamente, tu componente funcionará automáticamente con todos los themes sin cambios adicionales.

---

## 🔄 Proceso de Cambios

### Agregar Nueva Variable

1. **Evaluar**: ¿Es realmente necesaria o puedo usar una existente?
2. **Documentar**: Agregar en este documento
3. **Implementar**: Agregar en `_variables.scss`
4. **Comunicar**: Notificar al equipo
5. **Revisar**: Actualizar componentes que podrían beneficiarse

### Modificar Variable Existente

1. **Impacto**: Evaluar qué componentes afecta
2. **Testing**: Probar todos los themes
3. **Documentar**: Actualizar este documento si cambia el uso
4. **Comunicar**: PR con descripción clara del cambio

---

## 📚 Referencias Rápidas

### Variables Más Usadas

```scss
// Backgrounds
--surface-primary, --surface-secondary

// Text
--text-primary, --text-secondary

// Colors
--primary-500, --success-500, --error-500, --warning-500

// Spacing
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl

// Radius
--radius-sm, --radius-md, --radius-lg

// Shadows
--shadow-sm, --shadow-md, --shadow-lg
```

### Intensidades de Color

```scss
// Regla general:
50-100:  Backgrounds claros, badges
500:     Color principal del estado
600-700: Textos, bordes, hovers oscuros
```

---

## 🎓 Capacitación para Nuevos Desarrolladores

### Onboarding Checklist

- [ ] Leer este documento completo
- [ ] Revisar `src/styles/_variables.scss`
- [ ] Estudiar 3-5 componentes existentes como referencia
- [ ] Practicar creando un componente de prueba
- [ ] Tener este documento siempre abierto durante desarrollo

### Componentes de Referencia

Buenos ejemplos para estudiar:
- `src/app/features/users/components/user-list/user-list.scss`
- `src/app/features/appointments/components/appointment-calendar/appointment-calendar.scss`
- `src/app/shared/components/header/header.scss`

---

## 📞 Soporte

¿Dudas sobre estilos CSS?

1. Revisar este documento
2. Ver ejemplos en componentes existentes
3. Consultar en code review
4. Proponer mejoras a este documento

---

## 📝 Historial de Cambios

| Fecha | Versión | Cambio |
|-------|---------|--------|
| 2026-02-01 | 1.0 | Documento inicial - Estandarización post-corrección de inconsistencias |

---

## ⚖️ Licencia de Uso

Este documento es parte del proyecto SmartDentalCloud y debe ser respetado por todos los contribuidores.

**Regla de Oro**: Si tienes dudas, usa este documento. Si el documento no cubre tu caso, pregunta antes de implementar.
