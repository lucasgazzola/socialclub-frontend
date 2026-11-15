import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { ClubLogo } from '@/components/ui';
import { CLUB } from '@/config/club';
import { ROUTES } from '@/routes/paths';

/** TASK-60 — Pie del sitio público. Los datos de contacto están marcados como ejemplo. */
export function SitioFooter() {
  const { contacto } = CLUB;
  return (
    <footer className="bg-[#060f33] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ClubLogo size={44} />
            <div>
              <p className="font-bold text-white">{CLUB.nombre}</p>
              <p className="text-xs text-slate-400">{CLUB.localidad}</p>
            </div>
          </div>
          <p className="max-w-xs text-sm text-slate-400">{CLUB.lema}.</p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            Contacto
            {contacto.esEjemplo && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-300/30">
                Datos de ejemplo
              </span>
            )}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-slate-500" aria-hidden /> {contacto.direccion}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-slate-500" aria-hidden /> {contacto.telefono}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-slate-500" aria-hidden /> {contacto.email}
            </li>
            <li className="flex items-center gap-2.5">
              <Clock size={16} className="shrink-0 text-slate-500" aria-hidden /> {contacto.horario}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Accesos</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to={ROUTES.hacermeSocio} className="hover:text-white">Hacerme socio</Link></li>
            <li><Link to={ROUTES.login} className="hover:text-white">Ingresar a Mi club</Link></li>
            <li><a href="#eventos" className="hover:text-white">Próximos eventos</a></li>
            <li><a href="#disciplinas" className="hover:text-white">Disciplinas</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 sm:px-6">
          © {new Date().getFullYear()} {CLUB.nombre} · Plataforma SocialClub, desarrollada por el equipo
          Nullpointer (UTN FRVM).
        </p>
      </div>
    </footer>
  );
}
