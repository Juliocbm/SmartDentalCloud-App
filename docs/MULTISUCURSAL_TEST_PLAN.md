# Plan de Pruebas — Multi-Sucursal

> Marca cada caso con `[x]` cuando lo valides. Orden recomendado: Secciones 1 → 2 → 8 → 3 → 4 → 5 → 6 → 7

---

## 1. Gestión de Sucursales (Settings → Sucursales)

- [x] **1.1** Crear primera sucursal del tenant → Se marca como **default** automáticamente
- [x] **1.2** Crear segunda sucursal → No es default. Tabla muestra 2 filas. Badge "Predeterminada" solo en la primera
- [x] **1.3** Editar sucursal: cambiar nombre, dirección, teléfono, email → Datos actualizados correctamente
- [x] **1.4** Crear sucursal con nombre duplicado → Error: "Ya existe una ubicación con el nombre..."
- [x] **1.5** Marcar segunda sucursal como default → La anterior pierde el badge, la nueva lo obtiene
- [x] **1.6** Desactivar sucursal no-default → Se desactiva (soft delete). Desaparece de listas activas
- [x] **1.7** Intentar desactivar sucursal default → Error: "No se puede desactivar la ubicación predeterminada"
- [x] **1.8** Asignar doctores a sucursal (checkboxes en el form) → Doctores aparecen listados en la tabla
- [x] **1.9** Editar sucursal y cambiar doctores asignados → Asignaciones se actualizan correctamente

---

## 2. Regla de Oro (UI condicional)

- [x] **2.1** Tenant con **1 sola** sucursal activa → **No** aparece selector de sucursal en ninguna pantalla. **No** aparece columna "Sucursal" en tablas
- [x] **2.2** Tenant con **2+** sucursales activas → Aparecen selectores de sucursal y columnas "Sucursal" en: citas, horarios, inventario, alertas stock
- [x] **2.3** Desactivar segunda sucursal (volver a 1) → Selectores y columnas desaparecen automáticamente

---

## 3. Citas (Appointments)

- [x] **3.1** Crear cita sin seleccionar sucursal → Se asigna la sucursal **default** automáticamente
- [x] **3.2** Crear cita seleccionando sucursal específica → LocationId correcto en la cita
- [x] **3.3** Crear 2 citas para el mismo doctor, misma hora, **misma sucursal** → Error: overlap detectado
- [x] **3.4** Crear 2 citas para el mismo doctor, misma hora, **diferente sucursal** → ✅ Permitido (doctor atiende en 2 sucursales simultáneamente)
- [x] **3.5** Ver detalle de cita (multi-sucursal) → Muestra nombre de sucursal
- [x] **3.6** Lista de citas (multi-sucursal) → Columna "Sucursal" visible con nombre correcto
- [x] **3.7** Calendario: filtrar por sucursal → Solo muestra citas de esa sucursal
- [x] **3.8** Reprogramar cita a otra sucursal → LocationId se actualiza
- [x] **3.9** Dashboard citas: filtrar por sucursal → KPIs y lista se actualizan según filtro

---

## 4. Horarios Laborales (Work Schedules)

- [x] **4.1** Configurar horario de la clínica (sin sucursal) → Horario general del tenant
- [x] **4.2** Configurar horario por sucursal (multi) → Selector de sucursal visible. Horario se guarda con LocationId
- [x] **4.3** Cambiar sucursal en el selector → Recarga horario de esa sucursal
- [x] **4.4** Verificar disponibilidad de cita respeta horario de sucursal → Solo permite agendar en horario configurado de esa sucursal

---

## 5. Excepciones de Horario (Schedule Exceptions)

- [x] **5.1** Crear excepción de cierre para sucursal específica → Se guarda con LocationId. Columna "Sucursal" muestra nombre
- [x] **5.2** Crear excepción global (sin sucursal) → Aplica a todas las sucursales
- [x] **5.3** Editar excepción: cambiar sucursal → LocationId se actualiza correctamente
- [x] **5.4** Verificar disponibilidad respeta excepciones por sucursal → Sucursal cerrada no permite citas, otra sucursal sí

---

## 6. Inventario

- [x] **6.1** Ver dashboard inventario sin filtro → Muestra totales agregados de todas las sucursales
- [x] **6.2** Filtrar dashboard por sucursal → KPIs, top productos y productos por vencer se filtran
- [x] **6.3** Ver detalle de producto (multi-sucursal) → Tabla "Stock por Sucursal" visible con stock desglosado por ubicación
- [x] **6.4** Ver detalle de producto (1 sucursal) → Tabla "Stock por Sucursal" **no** visible
- [x] **6.5** Alertas de stock bajo (multi-sucursal) → Columna "Sucursal" visible. Alerta es por producto+ubicación
- [x] **6.6** Ajuste manual de stock → Movimiento se registra con LocationId correcto
- [x] **6.7** Recepción de orden de compra con sucursal destino → Stock aumenta en la sucursal correcta. MovementType = "Purchase"
- [x] **6.8** Crear orden de compra con selector de sucursal destino → LocationId se guarda en la orden

---

## 7. Cache (verificación técnica)

- [ ] **7.1** Crear segunda sucursal → verificar que selectores aparecen inmediatamente (cache se invalida)
- [ ] **7.2** Cambiar sucursal default → verificar que citas sin sucursal usan la nueva default
- [ ] **7.3** Desactivar sucursal → verificar que desaparece de dropdowns inmediatamente

---

## 8. Backward Compatibility

- [x] **8.1** Citas existentes (sin LocationId) siguen mostrándose → No hay error. LocationId aparece como null
- [x] **8.2** Horarios existentes (sin LocationId) siguen funcionando → Se aplican como horario general
- [x] **8.3** Stock existente migrado correctamente → Cada producto tiene stock en la ubicación default

---

## Resultado

| Sección | Total | Aprobados | Estado |
|---------|-------|-----------|--------|
| 1. Gestión Sucursales | 9 | | |
| 2. Regla de Oro | 3 | | |
| 3. Citas | 9 | | |
| 4. Horarios | 4 | | |
| 5. Excepciones | 4 | | |
| 6. Inventario | 8 | | |
| 7. Cache | 3 | | |
| 8. Backward Compat | 3 | | |
| **TOTAL** | **43** | | |
