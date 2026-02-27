# Cephalometry Module (Angular)

Módulo Angular standalone para análisis cefalométrico digital. Extrae la lógica clínica del proyecto React original y la reorganiza en una arquitectura limpia con servicios inyectables, componentes standalone y funciones puras.

## Estructura

```
cephalometry-module/
├── models/
│   └── cephalometry.models.ts          # Tipos e interfaces
├── constants/
│   ├── landmarks.const.ts              # 23 landmarks cefalométricos
│   └── norms.const.ts                  # Normas clínicas (Steiner, Björk, etc.)
├── utils/
│   └── ceph-math.util.ts              # Funciones puras: geometría, z-score, formateo
├── services/
│   ├── cephalometry-analysis.service.ts         # Cálculo de medidas (Steiner, Björk, Extended)
│   ├── cephalometry-interpretation.service.ts   # Resumen clínico narrativo automático
│   ├── cephalometry-calibration.service.ts      # Calibración px→mm con BehaviorSubject
│   └── cephalometry-export.service.ts           # Exportación CSV, JSON, PNG
├── components/
│   ├── ceph-canvas/                    # Marcado de puntos + overlay SVG
│   ├── ceph-results/                   # Tabla de resultados con z-scores
│   └── ceph-tracer/                    # Componente wrapper principal
├── index.ts                            # Public API (barrel file)
└── README.md
```

## Requisitos

- Angular 16+ (standalone components)
- RxJS (incluido con Angular)
- No requiere dependencias adicionales

## Integración en tu proyecto Angular

### 1. Copiar la carpeta

Copia `cephalometry-module/` dentro de `src/app/` de tu proyecto Angular (o donde prefieras).

### 2. Usar el componente completo

```typescript
// En tu componente o módulo:
import { CephTracerComponent } from './cephalometry-module';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [CephTracerComponent],
  template: `<ceph-tracer />`
})
export class MyPageComponent {}
```

Esto te da el módulo completo: carga de imagen, calibración, marcado de puntos, tabla de resultados y exportación.

### 3. Usar solo servicios (headless)

```typescript
import {
  CephalometryAnalysisService,
  CephalometryCalibrationService,
  LandmarkMap,
} from './cephalometry-module';

@Component({ /* ... */ })
export class MyCustomComponent {
  constructor(
    private analysis: CephalometryAnalysisService,
    private calibration: CephalometryCalibrationService,
  ) {}

  runAnalysis(points: LandmarkMap) {
    const results = this.analysis.analyze(
      points,
      this.calibration.mmPerPx,
      { name: 'Paciente', age: '25', sex: 'F', date: '2026-01-01', doctor: 'Dr. X' },
      { steiner: true, bjork: true, extended: true }
    );
    console.log(results.clinicalSummary);
    console.log(results.measures);
  }
}
```

### 4. Usar solo las funciones matemáticas (sin Angular)

```typescript
import {
  distance,
  angleBetween,
  angleBetweenLines,
  zScore,
  pointLineDistanceSigned,
  projectPointOntoLine,
  intersectLines,
} from './cephalometry-module/utils/ceph-math.util';

// Puras funciones sin dependencias de framework
const d = distance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5
```

## Análisis implementados

| Análisis | Medidas |
|---|---|
| **Steiner** | SNA, SNB, ANB, SN-GoGn, U1-NA (°/mm), L1-NB (°/mm), Interincisal, Pg-NB |
| **Björk–Jarabak** | Ángulos Silla, Articular, Gonial, Suma Björk, Ratio Jarabak (%) |
| **Tejidos blandos** | Labio inferior – E-line (Ricketts) |
| **Extendido** | IMPA, Wits appraisal, Plano oclusal–SN, Eje facial, U1–SN |

## Personalización de normas

```typescript
constructor(private analysis: CephalometryAnalysisService) {
  // Sobreescribir normas para otra población o grupo etario
  analysis.setNorms({
    steiner: {
      SNA: { mean: 84, sd: 3 },
      // ... solo las que quieras cambiar
    }
  });
}
```

## Exportaciones

- **CSV** — tabla de medidas con valores, normas, z-score e interpretación
- **PNG** — radiografía con trazado superpuesto (líneas, arcos, puntos)
- **JSON** — puntos + calibración para reimportación

## Notas

- Todo el procesamiento es **100% local** (no se envían datos a servidores)
- Los componentes usan `standalone: true` (Angular 16+)
- Los servicios usan `providedIn: 'root'` para inyección automática
- Las funciones de `ceph-math.util.ts` son puras y pueden usarse fuera de Angular
