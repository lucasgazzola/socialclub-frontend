/**
 * TASK-60 — Identidad institucional del club que muestra la landing.
 *
 * Fuente: documentación del proyecto (Tarea 5 · Organización y Gestión de
 * riesgos en el Drive del equipo). SocialClub es la plataforma; el club que la
 * implementa es el Club Sportivo Unión de Ordóñez.
 *
 * Los datos de contacto son DE EJEMPLO: reemplazarlos por los reales del club.
 */
export const CLUB = {
  nombre: 'Club Sportivo Unión de Ordóñez',
  nombreCorto: 'Unión de Ordóñez',
  localidad: 'Ordóñez, Córdoba',
  lema: 'Deporte, comunidad y familia en Ordóñez',
  mision:
    'Promover el desarrollo integral de niños, jóvenes y familias de nuestra comunidad a través de la práctica deportiva.',
  vision:
    'Ser una institución deportivo-social modelo en la región, referente por su calidad formativa, transparencia institucional y compromiso social.',
  valores: [
    'Transparencia',
    'Inclusión social',
    'Trabajo en equipo',
    'Compromiso comunitario',
    'Fair play',
  ],
  /** Datos de ejemplo (TASK-60): no son los reales del club. */
  contacto: {
    esEjemplo: true,
    direccion: 'Av. Principal 123, Ordóñez, Córdoba',
    telefono: '+54 9 353 000-0000',
    email: 'secretaria@ejemplo-club.com.ar',
    horario: 'Secretaría: lunes a viernes de 17 a 21 h',
  },
} as const;
