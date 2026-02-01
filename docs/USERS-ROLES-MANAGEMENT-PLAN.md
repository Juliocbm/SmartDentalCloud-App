# 🔐 PLAN DE GESTIÓN DE USUARIOS, ROLES Y PERMISOS

**Fecha:** 01/02/2026  
**Estado:** Análisis y Planificación  
**Contexto:** Sistema de administración completo para usuarios y permisos del consultorio

---

## 📊 ANÁLISIS DEL BACKEND ACTUAL

### ✅ ENDPOINTS DISPONIBLES

#### **UsersController** (`/api/users`)
```http
GET    /api/users                    # Lista todos los usuarios
GET    /api/users/{id}               # Usuario por ID
GET    /api/users/doctors            # ✅ NUEVO - Lista doctores activos
POST   /api/users                    # Crear usuario
PUT    /api/users/{id}               # Actualizar usuario
DELETE /api/users/{id}               # Eliminar usuario (soft delete)
PATCH  /api/users/{id}/toggle-active # Activar/Desactivar

# Gestión de Roles del Usuario
GET    /api/users/{id}/roles         # Roles asignados
POST   /api/users/{id}/roles         # Asignar rol
DELETE /api/users/{id}/roles/{roleId} # Remover rol
PUT    /api/users/{id}/roles         # Actualizar todos los roles

# Permisos y Perfil
GET    /api/users/{id}/permissions   # Permisos efectivos
GET    /api/users/{id}/profile       # Perfil completo
PUT    /api/users/{id}/profile       # Actualizar perfil
```

#### **RolesController** (`/api/roles`)
```http
GET    /api/roles                    # Lista todos los roles
GET    /api/roles/{id}               # Rol por ID
POST   /api/roles                    # Crear rol
PUT    /api/roles/{id}               # Actualizar rol
DELETE /api/roles/{id}               # Eliminar rol

# Gestión de Permisos del Rol
GET    /api/roles/{id}/permissions   # Permisos del rol
PUT    /api/roles/{id}/permissions   # Actualizar permisos (reemplaza todos)
```

#### **PermissionsController** (`/api/permissions`)
```http
GET    /api/permissions              # Lista todos los permisos disponibles (55+)
```

#### **OnboardingController** (`/api/onboarding`)
```http
POST   /api/onboarding/register      # Registro de nuevo consultorio
                                      # ↳ Crea: Tenant + Roles base + Usuario admin
```

---

## 🏗️ ARQUITECTURA DEL BACKEND

### **Estructura de Datos**

```
┌─────────────────────────────────────┐
│           TENANT                    │
│  (Consultorio/Clínica)              │
└────────────┬────────────────────────┘
             │ 1:N
             ▼
┌─────────────────────────────────────┐
│           USERS                     │
│  - Name, Email, PasswordHash        │
│  - IsActive                         │
└────────────┬────────────────────────┘
             │ N:M
             ▼
┌─────────────────────────────────────┐
│           ROLES                     │
│  - Name (Doctor, Admin, etc.)       │
│  - Description                      │
└────────────┬────────────────────────┘
             │ N:M
             ▼
┌─────────────────────────────────────┐
│        PERMISSIONS                  │
│  - Key (patients.view)              │
│  - Description                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        USER PROFILE                 │
│  - PhoneNumber, Address             │
│  - Specialty, ProfessionalLicense   │
│  - Education, YearsOfExperience     │
└─────────────────────────────────────┘
```

### **DTOs Disponibles**

**Input (Creación/Actualización):**
- `CreateUserDto`: name, email, password, roleIds[], phoneNumber?, specialty?
- `UpdateUserDto`: name, email, phoneNumber?, specialty?
- `CreateRoleDto`: name, description?, permissionKeys[]
- `UpdateRoleDto`: name, description?
- `UpdateRolePermissionsDto`: permissionKeys[]
- `AssignRoleDto`: roleId
- `UserRolesDto`: roleIds[]

**Output (Respuestas):**
- `UserDto`: id, name, email, isActive, roles[], permissions[], profile?
- `RoleDto`: id, name, description?, permissions[]
- `PermissionDto`: id, key, description
- `DoctorListDto`: id, name, specialization?

### **Sistema de Permisos**

**55+ Permisos Disponibles** (Categorías):
- **Pacientes** (9): `patients.view`, `patients.create`, `patients.edit`, etc.
- **Citas** (7): `appointments.view`, `appointments.create`, etc.
- **Tratamientos** (4): `treatments.*`
- **Facturas** (4): `invoices.*`
- **Pagos** (2): `payments.*`
- **Usuarios** (4): `users.view`, `users.create`, `users.edit`, `users.delete`
- **Roles** (4): `roles.view`, `roles.create`, `roles.edit`, `roles.delete`
- **Notas de Consulta** (3): `consultation_notes.*`
- **Archivos** (3): `attached_files.*`
- **Configuración** (2): `settings.*`
- **Reportes** (2): `reports.*`
- **Tenants** (2): `tenants.*` (para super admin)

---

## 🎯 FLUJOS DE TRABAJO IDENTIFICADOS

### **Flujo 1: Onboarding (Primer Uso)** ✅ Ya existe

```
1. Usuario visita landing page
2. Llena formulario de registro:
   - Nombre del consultorio
   - Subdomain único
   - Datos del administrador (nombre, email, password)
3. Backend ejecuta:
   ✅ Crear Tenant
   ✅ Crear Roles predeterminados (Admin, Doctor, Recepcionista, Asistente)
   ✅ Asignar 55 permisos a tabla global
   ✅ Crear usuario administrador
   ✅ Asignar rol "Administrador" al usuario
   ✅ Generar token JWT
4. Usuario redirigido a dashboard con sesión activa
```

**Estado:** ✅ **Backend implementado completamente**

---

### **Flujo 2: Alta de Usuario por Administrador** ⏳ Por implementar UI

**Actores:** Administrador del consultorio  
**Requisito:** Permiso `users.create`

**Pasos:**
```
1. Admin navega a sección "Usuarios"
2. Click en "Nuevo Usuario"
3. Formulario muestra:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DATOS BÁSICOS (obligatorio)
   - Nombre completo
   - Email
   - Contraseña temporal
   
   ROLES (obligatorio - selección múltiple)
   ☐ Administrador
   ☑ Doctor
   ☐ Recepcionista
   ☐ Asistente
   
   PERFIL PROFESIONAL (opcional)
   - Teléfono
   - Especialidad (si es Doctor)
   - Cédula profesional
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Al guardar → POST /api/users
5. Sistema crea usuario + asigna roles
6. Notificación: "Usuario creado. Se envió email con credenciales."
7. Lista de usuarios se actualiza
```

**Consideraciones:**
- ✅ Backend ya soporta asignación de roles en creación
- ⚠️ Contraseña temporal: debe cambiarla en primer login
- 💡 Email de bienvenida (opcional pero recomendado)
- 🔐 Validación: email único por tenant

---

### **Flujo 3: Edición de Usuario** ⏳ Por implementar UI

**Pasos:**
```
1. Admin selecciona usuario de la lista
2. Modal/página muestra:
   - Datos básicos (editable)
   - Roles actuales (modificable)
   - Estado activo/inactivo (toggle)
   - Perfil profesional (editable)

3. Secciones independientes:
   
   A) EDITAR DATOS BÁSICOS
      PUT /api/users/{id}
      
   B) GESTIONAR ROLES
      Opción 1: PUT /api/users/{id}/roles (reemplazar todos)
      Opción 2: POST/DELETE individual por rol
      
   C) ACTIVAR/DESACTIVAR
      PATCH /api/users/{id}/toggle-active
      
   D) EDITAR PERFIL
      PUT /api/users/{id}/profile

4. Confirmación y actualización en lista
```

**UI Recomendada:** Modal con tabs o acordeón

---

### **Flujo 4: Gestión de Roles** ⏳ Por implementar UI

**Casos de Uso:**

#### **A) Crear Rol Personalizado**
```
Ejemplo: "Auxiliar de Ortodoncia"

1. Admin → Sección "Roles"
2. Click "Crear Rol"
3. Formulario:
   - Nombre: "Auxiliar de Ortodoncia"
   - Descripción: "Asistente especializado en ortodoncia"
   - Selección de permisos (checklist agrupado):
   
   📋 PACIENTES
   ☑ Ver pacientes
   ☐ Crear pacientes
   ☐ Editar pacientes
   
   📅 CITAS
   ☑ Ver citas
   ☑ Crear citas
   ☑ Cancelar citas propias
   
   📝 NOTAS
   ☑ Ver notas de consulta
   ☑ Crear notas de consulta
   
   [55 permisos organizados por categoría]

4. POST /api/roles
5. Rol creado y disponible para asignar
```

#### **B) Editar Permisos de Rol Existente**
```
1. Admin selecciona rol "Doctor"
2. Ve permisos actuales
3. Modifica checkboxes
4. PUT /api/roles/{id}/permissions
5. Usuarios con ese rol obtienen nuevos permisos automáticamente
```

**⚠️ Importante:** Cambios en rol afectan a TODOS los usuarios con ese rol.

---

### **Flujo 5: Visualización y Auditoría** ⏳ Por implementar UI

**Vistas Necesarias:**

#### **A) Lista de Usuarios**
```
┌─────────────────────────────────────────────────────────┐
│ 👥 Usuarios del Consultorio                       [+ Nuevo] │
├─────────────────────────────────────────────────────────┤
│ 🔍 Buscar... [Filtro: Todos ▾] [Rol: Todos ▾]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ● Juan Pérez                    🩺 Doctor              │
│   juan@clinica.com              ✅ Activo              │
│   Especialidad: Ortodoncia      [Ver] [Editar]         │
│                                                         │
│ ● María González                👨‍💼 Admin, Recep.       │
│   maria@clinica.com             ✅ Activo              │
│                                 [Ver] [Editar]         │
│                                                         │
│ ● Carlos López                  🩺 Doctor              │
│   carlos@clinica.com            ❌ Inactivo            │
│   Especialidad: Endodoncia      [Ver] [Activar]        │
└─────────────────────────────────────────────────────────┘
```

#### **B) Vista de Detalle de Usuario**
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Dr. Juan Pérez                          [Editar]     │
├─────────────────────────────────────────────────────────┤
│ INFORMACIÓN BÁSICA                                      │
│ Email: juan@clinica.com                                 │
│ Teléfono: 555-1234                                      │
│ Estado: ✅ Activo                                       │
│ Creado: 15/01/2026                                      │
│                                                         │
│ ROLES ASIGNADOS                                         │
│ 🩺 Doctor                                               │
│                                                         │
│ PERMISOS EFECTIVOS (24)                                 │
│ ✓ Ver pacientes      ✓ Crear citas      ✓ Ver facturas │
│ ✓ Crear tratamientos ✓ Ver reportes     ... (ver todos)│
│                                                         │
│ PERFIL PROFESIONAL                                      │
│ Especialidad: Ortodoncia                                │
│ Cédula: 123456                                          │
│ Años de experiencia: 8                                  │
└─────────────────────────────────────────────────────────┘
```

#### **C) Gestión de Roles**
```
┌─────────────────────────────────────────────────────────┐
│ 🔑 Roles y Permisos                           [+ Nuevo] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📌 Administrador                     👥 2 usuarios      │
│    Acceso total al sistema           [Ver] [Editar]    │
│    ✓ 55 permisos                                        │
│                                                         │
│ 🩺 Doctor                            👥 5 usuarios      │
│    Profesional que atiende pacientes [Ver] [Editar]    │
│    ✓ 28 permisos                                        │
│                                                         │
│ 👨‍💼 Recepcionista                    👥 3 usuarios      │
│    Gestión de citas y recepción      [Ver] [Editar]    │
│    ✓ 15 permisos                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 ARQUITECTURA FRONTEND PROPUESTA

### **Estructura de Módulos**

```
src/app/
├── features/
│   ├── users/                          # MÓDULO NUEVO
│   │   ├── models/
│   │   │   ├── user.models.ts          # User, CreateUser, UpdateUser
│   │   │   └── role.models.ts          # Role, Permission
│   │   ├── services/
│   │   │   ├── users.service.ts        # CRUD usuarios
│   │   │   └── roles.service.ts        # CRUD roles
│   │   ├── components/
│   │   │   ├── user-list/              # Lista de usuarios
│   │   │   ├── user-form/              # Crear/Editar usuario
│   │   │   ├── user-detail/            # Vista detalle
│   │   │   ├── role-list/              # Lista de roles
│   │   │   ├── role-form/              # Crear/Editar rol
│   │   │   └── permission-selector/    # Selector de permisos (componente compartido)
│   │   └── users.routes.ts
│   │
│   ├── auth/                           # Ya existe
│   │   └── login/
│   │
│   └── dashboard/                      # Existente
│
├── shared/
│   └── components/
│       ├── role-badge/                 # Badge visual de rol
│       └── permission-chip/            # Chip de permiso
│
└── core/
    ├── models/
    │   └── user.models.ts              # Ya existe - mover a features/users
    └── services/
        └── users.service.ts            # Ya existe - mover a features/users
```

### **Servicios Angular**

#### **UsersService**
```typescript
@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);
  
  // CRUD básico
  getAll(): Observable<User[]>
  getById(id: string): Observable<User>
  create(data: CreateUserRequest): Observable<User>
  update(id: string, data: UpdateUserRequest): Observable<User>
  delete(id: string): Observable<void>
  toggleActive(id: string): Observable<User>
  
  // Roles del usuario
  getUserRoles(id: string): Observable<Role[]>
  assignRole(userId: string, roleId: string): Observable<void>
  removeRole(userId: string, roleId: string): Observable<void>
  updateUserRoles(userId: string, roleIds: string[]): Observable<void>
  
  // Permisos
  getUserPermissions(id: string): Observable<string[]>
  
  // Perfil
  getUserProfile(id: string): Observable<UserProfile>
  updateUserProfile(id: string, data: UpdateProfileRequest): Observable<UserProfile>
  
  // Filtros especiales
  getDoctors(): Observable<DoctorListItem[]>  // ✅ Ya implementado
}
```

#### **RolesService**
```typescript
@Injectable({ providedIn: 'root' })
export class RolesService {
  private api = inject(ApiService);
  
  // CRUD
  getAll(): Observable<Role[]>
  getById(id: string): Observable<Role>
  create(data: CreateRoleRequest): Observable<Role>
  update(id: string, data: UpdateRoleRequest): Observable<Role>
  delete(id: string): Observable<void>
  
  // Permisos del rol
  getRolePermissions(roleId: string): Observable<Permission[]>
  updateRolePermissions(roleId: string, permissionKeys: string[]): Observable<void>
  
  // Catálogo de permisos
  getAllPermissions(): Observable<Permission[]>  // → /api/permissions
}
```

### **Modelos TypeScript**

```typescript
// features/users/models/user.models.ts

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  roles: Role[];
  permissions: string[];
  profile?: UserProfile;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleIds?: string[];
  phoneNumber?: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface UserProfile {
  phoneNumber?: string;
  alternateEmail?: string;
  address?: string;
  professionalLicense?: string;
  specialty?: string;
  yearsOfExperience?: number;
  education?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bio?: string;
}

// features/users/models/role.models.ts

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionKeys?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

export interface Permission {
  id: string;
  key: string;  // "patients.view"
  description: string;
}

export interface PermissionGroup {
  category: string;  // "Pacientes", "Citas", etc.
  permissions: Permission[];
}
```

---

## 📋 PLAN DE EJECUCIÓN

### **FASE 1: Fundamentos (2-3 días)**

**Objetivo:** Crear estructura base y servicios

**Tareas:**
1. ✅ Crear módulo `features/users/`
2. ✅ Crear modelos TypeScript (user.models.ts, role.models.ts)
3. ✅ Implementar `UsersService` con todos los métodos
4. ✅ Implementar `RolesService` con todos los métodos
5. ✅ Crear rutas lazy-loaded en `users.routes.ts`
6. ✅ Configurar rutas en `app.routes.ts`

**Entregables:**
- Servicios completos y testeables
- Estructura de carpetas clara
- Lazy loading configurado

---

### **FASE 2: Lista de Usuarios (2 días)**

**Objetivo:** Vista principal de gestión de usuarios

**Tareas:**
1. ✅ Crear `UserListComponent`
   - Tabla con usuarios
   - Filtros: buscar, estado, rol
   - Botón "Nuevo Usuario"
   - Acciones: ver, editar, activar/desactivar

2. ✅ Crear componentes auxiliares:
   - `RoleBadgeComponent`: Badge visual de rol
   - Estilos con variables globales

3. ✅ Integrar con `UsersService.getAll()`

4. ✅ Manejo de estados:
   - Loading spinner
   - Empty state
   - Error handling

**UI Reference:**
```
┌─────────────────────────────────────────────┐
│ [Buscar...] [Estado ▾] [Rol ▾]    [+ Nuevo]│
├─────────────────────────────────────────────┤
│ Dr. Juan Pérez                    🩺 Doctor │
│ juan@clinica.com                  ✅ Activo │
│                          [Ver] [Editar]     │
└─────────────────────────────────────────────┘
```

---

### **FASE 3: Formulario de Usuario (3 días)**

**Objetivo:** Crear/Editar usuarios con asignación de roles

**Tareas:**
1. ✅ Crear `UserFormComponent`
   - Modo: create | edit
   - FormGroup reactivo
   - Validaciones

2. ✅ Secciones del formulario:
   ```
   A) Datos Básicos
      - Nombre (requerido)
      - Email (requerido, email, único)
      - Contraseña (solo en create, min 8 chars)
      
   B) Asignación de Roles
      - Checkboxes de roles disponibles
      - Al menos un rol requerido
      
   C) Perfil Profesional (opcional)
      - Teléfono
      - Especialidad (si tiene rol Doctor)
      - Cédula profesional
   ```

3. ✅ Integración:
   - GET /api/roles (para listar roles disponibles)
   - POST /api/users (crear)
   - PUT /api/users/{id} (actualizar)

4. ✅ UX:
   - Validación en tiempo real
   - Mensajes de error claros
   - Confirmación de éxito
   - Navegación de regreso

**Componente Reutilizable:** `RoleSelectorComponent`

---

### **FASE 4: Vista de Detalle (1-2 días)**

**Objetivo:** Ver información completa del usuario

**Tareas:**
1. ✅ Crear `UserDetailComponent`
   - Información básica
   - Roles asignados con badges
   - Lista de permisos efectivos
   - Perfil profesional
   - Acciones: editar, activar/desactivar

2. ✅ Layout organizado:
   - Cards por sección
   - Responsive
   - Botón de edición flotante

**Vista:**
```
┌─────────────────────────────────────────┐
│ 👤 Dr. Juan Pérez          [✏️ Editar] │
├─────────────────────────────────────────┤
│ 📧 juan@clinica.com                     │
│ 📱 555-1234                             │
│ 🩺 Doctor                               │
│ ✅ Activo desde 15/01/2026              │
│                                         │
│ PERMISOS (24)                           │
│ ✓ Ver pacientes  ✓ Crear citas         │
│ ✓ Editar tratamientos ...              │
└─────────────────────────────────────────┘
```

---

### **FASE 5: Gestión de Roles (3-4 días)**

**Objetivo:** CRUD completo de roles con asignación de permisos

**Tareas:**
1. ✅ Crear `RoleListComponent`
   - Lista de roles del tenant
   - Contador de usuarios por rol
   - Botón "Nuevo Rol"

2. ✅ Crear `RoleFormComponent`
   - Nombre y descripción
   - Selector de permisos (componente especial)

3. ✅ Crear `PermissionSelectorComponent` ⭐
   - Checkboxes agrupados por categoría
   - "Seleccionar todos" por categoría
   - Búsqueda/filtro de permisos
   - Vista compacta y expandida

4. ✅ Integración:
   - GET /api/permissions (55 permisos)
   - POST /api/roles
   - PUT /api/roles/{id}/permissions

**Componente Clave:** `PermissionSelectorComponent`
```typescript
@Component({
  selector: 'app-permission-selector',
  inputs: ['selectedPermissions'],
  outputs: ['permissionsChange']
})
export class PermissionSelectorComponent {
  permissionGroups: PermissionGroup[] = [
    {
      category: 'Pacientes',
      permissions: [
        { key: 'patients.view', description: 'Ver pacientes', selected: true },
        { key: 'patients.create', description: 'Crear pacientes', selected: false },
        ...
      ]
    },
    ...
  ];
  
  toggleAll(group: PermissionGroup): void { }
  togglePermission(permission: Permission): void { }
  getSelectedKeys(): string[] { }
}
```

---

### **FASE 6: Refinamientos y UX (2 días)**

**Objetivo:** Pulir experiencia de usuario

**Tareas:**
1. ✅ Confirmaciones para acciones destructivas
   - Eliminar usuario
   - Desactivar usuario
   - Eliminar rol (si tiene usuarios)

2. ✅ Notificaciones toast
   - Éxito: "Usuario creado correctamente"
   - Error: "El email ya está en uso"
   - Info: "Se envió email con credenciales"

3. ✅ Estados visuales
   - Usuarios inactivos (opacidad)
   - Roles predeterminados (badge especial)
   - Acciones deshabilitadas según permisos

4. ✅ Responsive design
   - Mobile: lista colapsable
   - Tablet: grid de 2 columnas
   - Desktop: tabla completa

5. ✅ Accesibilidad
   - Labels ARIA
   - Navegación por teclado
   - Contraste de colores

---

### **FASE 7: Testing y Documentación (1-2 días)**

**Tareas:**
1. ⏳ Unit tests para servicios
2. ⏳ Component tests para formularios
3. ⏳ E2E test: flujo completo de crear usuario
4. ⏳ Documentar componentes principales
5. ⏳ Actualizar README con nuevas rutas

---

## 🎯 CASOS DE USO DETALLADOS

### **Caso 1: Contratar nueva recepcionista**

**Escenario:** Consultorio contrata a Ana como recepcionista

**Flujo:**
```
1. Admin → Usuarios → [+ Nuevo Usuario]
2. Llena formulario:
   Nombre: Ana García
   Email: ana@clinica.com
   Contraseña: temporal123
   Roles: ☑ Recepcionista
   Teléfono: 555-9876
3. [Guardar]
4. Sistema:
   - Crea usuario
   - Asigna rol "Recepcionista" (15 permisos)
   - Envía email a ana@clinica.com
5. Ana recibe email:
   "Bienvenida a Clínica Sonrisas
    Usuario: ana@clinica.com
    Contraseña temporal: temporal123
    Debes cambiarla en tu primer login"
6. Ana hace login → Cambio de contraseña obligatorio
```

**Permisos que obtiene Ana:**
- ✓ Ver pacientes
- ✓ Crear citas
- ✓ Ver citas
- ✓ Modificar citas
- ✓ Cancelar citas
- ❌ Ver historial médico
- ❌ Crear facturas

---

### **Caso 2: Doctor que también es administrador**

**Escenario:** Dr. Pérez es dueño de la clínica (Admin + Doctor)

**Configuración:**
```
Usuario: Dr. Juan Pérez
Roles: 
  ☑ Administrador (55 permisos)
  ☑ Doctor (28 permisos)

Resultado: 55 permisos efectivos (unión de ambos roles)
```

**Ventajas:**
- Puede hacer todo administrativamente
- Aparece en selector de doctores para citas
- Su especialidad se muestra en perfil

---

### **Caso 3: Crear rol personalizado "Auxiliar"**

**Escenario:** Clínica necesita rol específico para auxiliares

**Flujo:**
```
1. Admin → Roles → [+ Nuevo Rol]
2. Formulario:
   Nombre: Auxiliar Dental
   Descripción: Asistente de consultorio
   
   Permisos:
   📋 PACIENTES
   ☑ Ver pacientes
   
   📅 CITAS
   ☑ Ver citas
   
   📝 NOTAS
   ☑ Ver notas de consulta
   ☑ Crear notas de consulta
   
   📎 ARCHIVOS
   ☑ Ver archivos
   ☑ Subir archivos
   
   Total: 6 permisos

3. [Crear Rol]
4. Ahora "Auxiliar Dental" está disponible para asignar
```

---

### **Caso 4: Auditoría de permisos**

**Pregunta:** ¿Qué puede hacer el usuario carlos@clinica.com?

**Flujo:**
```
1. Admin → Usuarios → Carlos López → [Ver Detalle]
2. Vista muestra:
   Roles: Doctor, Asistente
   
   Permisos efectivos (32):
   ✓ patients.view
   ✓ patients.create
   ✓ appointments.view
   ✓ appointments.create
   ✓ treatments.view
   ✓ treatments.create
   ... (lista completa)
   
3. Admin puede ver exactamente qué acciones puede realizar Carlos
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Seguridad**

1. **Validación de Permisos**
   - Cada acción UI debe verificar permisos del usuario actual
   - Usar `AuthService.hasPermission('users.create')`
   - Ocultar/deshabilitar acciones no permitidas

2. **Contraseñas**
   - Generación segura de contraseñas temporales
   - Forzar cambio en primer login
   - Validación de complejidad (min 8 chars, mayúsculas, números)

3. **Emails Únicos**
   - Validación en tiempo real
   - Mensajes claros de error

### **UX/UI**

1. **Feedback Visual**
   - Loading spinners en operaciones asíncronas
   - Toasts de confirmación
   - Animaciones suaves

2. **Prevención de Errores**
   - Confirmaciones para acciones destructivas
   - Validación en tiempo real
   - Mensajes de ayuda contextuales

3. **Consistencia**
   - Usar variables globales CSS
   - Iconos consistentes (Lucide)
   - Patrones de diseño unificados

### **Performance**

1. **Lazy Loading**
   - Módulo users cargado bajo demanda
   - Rutas diferidas

2. **Optimistic Updates**
   - Actualizar UI antes de respuesta
   - Revertir si falla

3. **Caching**
   - Lista de permisos (no cambia frecuentemente)
   - Roles del tenant (invalidar al modificar)

### **Mantenibilidad**

1. **Componentes Reutilizables**
   - `PermissionSelectorComponent`
   - `RoleBadgeComponent`
   - `UserAvatarComponent`

2. **Servicios Centralizados**
   - Un solo `UsersService` para todo
   - Un solo `RolesService` para todo

3. **Tipado Estricto**
   - Interfaces completas
   - Enums para estados
   - Validación de tipos

---

## 🚀 RECOMENDACIONES FINALES

### **Orden de Implementación Sugerido**

1. ✅ **Fase 1: Servicios** - Base sólida
2. ✅ **Fase 2: Lista** - Ver usuarios existentes
3. ✅ **Fase 3: Formulario** - Crear/Editar usuarios
4. ✅ **Fase 4: Detalle** - Ver información completa
5. ✅ **Fase 5: Roles** - Gestión avanzada
6. ✅ **Fase 6: UX** - Refinamientos
7. ⏳ **Fase 7: Testing** - Calidad

### **Quick Wins (Prioridad Alta)**

- **Lista de usuarios**: Ver quién tiene acceso
- **Crear usuario básico**: Dar de alta sin permisos complejos
- **Toggle activo/inactivo**: Control rápido de acceso

### **Features Avanzadas (Prioridad Media)**

- **Gestión de roles personalizados**
- **Auditoría de permisos**
- **Email de bienvenida**

### **Features Futuras (Backlog)**

- **Historial de cambios**: Quién modificó qué
- **Roles temporales**: Asignar rol por tiempo limitado
- **Delegación de permisos**: Admin delega crear usuarios
- **2FA**: Autenticación de dos factores

---

## 📊 MÉTRICAS DE ÉXITO

**MVP Completado cuando:**
- ✅ Admin puede crear usuarios
- ✅ Admin puede asignar roles
- ✅ Admin puede activar/desactivar usuarios
- ✅ Usuario puede ver su propio perfil
- ✅ Lista de usuarios funcional con filtros básicos

**Sistema Maduro cuando:**
- ✅ Roles personalizados creables
- ✅ Permisos granulares por rol
- ✅ Auditoría completa de permisos
- ✅ UX pulida y responsive
- ✅ Testing coverage > 80%

---

## 📚 RECURSOS Y REFERENCIAS

**Backend:**
- ✅ `UsersController.cs` - 13 endpoints
- ✅ `RolesController.cs` - 6 endpoints
- ✅ `PermissionsController.cs` - 1 endpoint
- ✅ `IUserService.cs` - Contrato completo
- ✅ `IRoleService.cs` - Contrato completo
- ✅ `PermissionsSeeder.cs` - 55 permisos

**Documentación:**
- 📄 `ARQUITECTURA.md` - Patrones y estructura
- 📄 `MULTI-TENANCY.md` - Aislamiento de datos
- 📄 `SEGURIDAD.md` - Autenticación y autorización
- 📄 `USERS-ROLES-ARCHITECTURE-ANALYSIS.md` - Análisis de roles ✅

**Frontend:**
- 📦 Angular 19 standalone components
- 📦 Reactive Forms
- 📦 Signals
- 📦 TailwindCSS + variables globales

---

## ✅ RESUMEN EJECUTIVO

**Backend:** ✅ **100% Listo**
- Endpoints completos
- Servicios implementados
- DTOs disponibles
- Multi-tenancy configurado
- Permisos seedeados

**Frontend:** ⏳ **0% Implementado**
- Servicios TypeScript: Por crear
- Componentes UI: Por crear
- Rutas: Por configurar
- UX/UI: Por diseñar

**Complejidad Estimada:** Media-Alta
- Lógica compleja: Selector de permisos
- Múltiples vistas relacionadas
- Validaciones cruzadas
- Estados interdependientes

**Tiempo Estimado:** 2-3 semanas (1 desarrollador)
- Semana 1: Fases 1-3 (servicios + lista + formulario)
- Semana 2: Fases 4-5 (detalle + roles)
- Semana 3: Fase 6-7 (UX + testing)

---

**Estado:** 📋 **Plan Completo - Listo para Implementación**

¿Deseas que comience con la **Fase 1** (servicios y modelos)?
