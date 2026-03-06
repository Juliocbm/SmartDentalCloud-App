# Candidatos para Migración al Patrón Medical List

## Listas Ya Migradas ✅

### Patient Detail (`patient-detail.html`)
- ✅ **Alergias** - `.medical-list` + `.medical-list-item`
- ✅ **Consentimientos Informados** - `.medical-list` + `.medical-list-item`
- ✅ **Diagnósticos** - `.medical-list` + `.medical-list-item`
- ✅ **Archivos Adjuntos** - `.medical-list` + `.medical-list-item` + `.file-icon-inline`

---

## Candidatos Prioritarios para Migración

### 1. Treatment Detail - Sessions List
**Archivo:** `treatments/components/treatment-detail/treatment-detail.html`
**Línea:** ~491
**Clase actual:** `.sessions-list` con `.session-card`
**Razón:** Lista de sesiones de tratamiento con estructura similar (título + badges + metadata)
**Prioridad:** Alta

### 2. User Detail - Roles List
**Archivo:** `users/components/user-detail/user-detail.html`
**Línea:** ~165
**Clase actual:** `.roles-list` con `.role-item`
**Razón:** Lista de roles asignados con badges
**Prioridad:** Media

### 3. User Detail - Permissions List
**Archivo:** `users/components/user-detail/user-detail.html`
**Línea:** ~200
**Clase actual:** `.permissions-list` con `.permission-item`
**Razón:** Lista de permisos con iconos y agrupación
**Prioridad:** Baja (estructura diferente, más simple)

---

## Listas de Dashboard (NO migrar)

Las siguientes listas son específicas de dashboards y tienen diseño diferente (cards clickeables, avatars, métricas):

### Dentist Dashboard
- `.dentist-list` con `.dentist-item` - Cards con avatares y métricas
- **NO migrar** - Diseño específico de dashboard

### Treatment Dashboard
- `.treatment-list` con `.treatment-item` - Cards clickeables con info compacta
- **NO migrar** - Diseño específico de dashboard

### Treatment Plan Dashboard
- `.plan-list` con `.plan-item` - Cards clickeables con progreso
- **NO migrar** - Diseño específico de dashboard

---

## Análisis de Candidatos

### ✅ Sessions List (Alta Prioridad)

**Estructura actual:**
```html
<div class="sessions-list">
  @for (s of sessions(); track s.id) {
    <div class="session-card">
      <div class="session-number">#{{ s.sessionNumber }}</div>
      <!-- metadata -->
    </div>
  }
</div>
```

**Beneficios de migración:**
- Consistencia con otras listas médicas
- Reducción de código CSS específico
- Mejor mantenibilidad

**Estructura propuesta:**
```html
<div class="medical-list">
  @for (s of sessions(); track s.id) {
    <div class="medical-list-item">
      <div class="medical-list-item__main">
        <div class="medical-list-item__info">
          <span class="medical-list-item__title">Sesión #{{ s.sessionNumber }}</span>
          <span class="badge badge-sm badge-primary">{{ s.date }}</span>
          <!-- más badges/metadata -->
        </div>
        <div class="medical-list-item__actions">
          <!-- botones de acción -->
        </div>
      </div>
    </div>
  }
</div>
```

### ⚠️ Roles List (Media Prioridad)

**Estructura actual:**
```html
<div class="roles-list">
  @for (role of currentUser.roles; track role.id) {
    <div class="role-item">
      <span class="role-badge">{{ role.name }}</span>
    </div>
  }
</div>
```

**Consideración:** Es una lista muy simple (solo badges). Podría usar el patrón estándar pero quizás es overkill.

**Recomendación:** Evaluar si realmente necesita la estructura completa o si un diseño más simple es suficiente.

---

## Listas que NO deben migrar

### 1. Listas de Dashboard
- **Razón:** Diseño específico con cards clickeables, avatares, métricas
- **Ejemplos:** `.dentist-list`, `.treatment-list`, `.plan-list`

### 2. Tablas de datos
- **Razón:** Usan `<table>` con estructura tabular
- **Ejemplos:** Treatment reports, invoice lists

### 3. Listas de selección/modal
- **Razón:** Diseño específico para selección interactiva
- **Ejemplos:** `.selection-list` en perio-comparison-modal

---

## Plan de Migración Recomendado

### Fase 1: Sessions List (Inmediato)
1. Migrar `.sessions-list` en `treatment-detail.html`
2. Eliminar estilos específicos de `.session-card`
3. Verificar funcionalidad y diseño

### Fase 2: Roles List (Opcional)
1. Evaluar si el patrón completo aporta valor
2. Si sí, migrar `.roles-list` en `user-detail.html`
3. Si no, mantener diseño simple actual

### Fase 3: Nuevas Listas
- Usar `.medical-list-item` como estándar para todas las nuevas listas de items médicos
- Documentar en guías de desarrollo

---

## Criterios para Usar el Patrón

### ✅ Usar `.medical-list-item` cuando:
- Lista de items médicos/clínicos (alergias, diagnósticos, tratamientos, sesiones)
- Cada item tiene: título + badges/metadata + acciones opcionales
- Se requiere diseño compacto (1-2 líneas)
- Información secundaria opcional en 2da línea

### ❌ NO usar `.medical-list-item` cuando:
- Lista de dashboard con cards clickeables grandes
- Tabla de datos con múltiples columnas
- Lista de selección en modal
- Diseño específico con avatares/imágenes prominentes
- Lista muy simple (solo badges o texto)

---

## Actualizado
2026-03-06 - Análisis inicial de candidatos para migración
