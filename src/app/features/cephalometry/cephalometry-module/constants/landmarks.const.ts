import { LandmarkDefinition } from '../models/cephalometry.models';

export const LANDMARKS: readonly LandmarkDefinition[] = [
  { key: 'S',   label: 'S – Sella',              description: 'Centro de la silla turca' },
  { key: 'N',   label: 'N – Nasion',             description: 'Sutura frontonasal' },
  { key: 'A',   label: 'A – Punto A',            description: 'Subespinal maxilar' },
  { key: 'B',   label: 'B – Punto B',            description: 'Supramentoniano' },
  { key: 'Po',  label: 'Po – Porion',            description: 'Borde superior del meato acústico externo' },
  { key: 'Or',  label: 'Or – Orbitale',          description: 'Punto más inferior del borde orbitario' },
  { key: 'Go',  label: 'Go – Gonion',            description: 'Ángulo mandibular' },
  { key: 'Me',  label: 'Me – Menton',            description: 'Punto más inferior de la sínfisis' },
  { key: 'Pg',  label: 'Pg – Pogonion',          description: 'Punto más prominente del mentón' },
  { key: 'Gn',  label: 'Gn – Gnathion',          description: 'Punto más anterior e inferior de la sínfisis' },
  { key: 'Ar',  label: 'Ar – Articulare',        description: 'Intersección posterior de rama y base craneal' },
  { key: 'U1T', label: 'U1T – Inc. sup. borde',  description: 'Borde incisal del incisivo superior' },
  { key: 'U1A', label: 'U1A – Inc. sup. ápice',  description: 'Ápice radicular del incisivo superior' },
  { key: 'L1T', label: 'L1T – Inc. inf. borde',  description: 'Borde incisal del incisivo inferior' },
  { key: 'L1A', label: 'L1A – Inc. inf. ápice',  description: 'Ápice radicular del incisivo inferior' },
  { key: 'Prn', label: 'Prn – Pronasale',        description: 'Punto más anterior del dorso nasal' },
  { key: 'PgS', label: "Pg' – Pogonion blando",  description: 'Pogonion de tejidos blandos' },
  { key: 'Li',  label: 'Li – Labrale inferius',   description: 'Punto más anterior del labio inferior' },
  { key: 'Ba',  label: 'Ba – Basion',            description: 'Punto más inferior del foramen magno' },
  { key: 'Pt',  label: 'Pt – Pterigoideo',       description: 'Punto más posterior del contorno pterigoideo' },
  { key: 'Co',  label: 'Co – Condylion',         description: 'Punto más posterosuperior del cóndilo mandibular' },
  { key: 'Oc1', label: 'Oc1 – Oclusal anterior', description: 'Punto anterior sobre el plano oclusal (contacto incisivo)' },
  { key: 'Oc2', label: 'Oc2 – Oclusal posterior', description: 'Punto posterior sobre el plano oclusal (contacto molar)' },
] as const;

export const LANDMARK_KEYS = LANDMARKS.map(l => l.key);
