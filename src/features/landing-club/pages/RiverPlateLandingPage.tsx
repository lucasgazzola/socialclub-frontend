import { Link } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Calendar,
  ArrowRight,
  ChevronRight,
  Trophy,
  Users,
  Shield,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';

/**
 * Escudo oficial vectorizado de River Plate (CARP)
 */
function EscudoRiverPlate({ className = 'w-12 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="riverShieldClip">
          <path d="M50 2 C75 2, 95 18, 95 48 C95 86, 68 110, 50 118 C32 110, 5 86, 5 48 C5 18, 25 2, 50 2 Z" />
        </clipPath>
      </defs>
      {/* Contorno y fondo blanco */}
      <path
        d="M50 2 C75 2, 95 18, 95 48 C95 86, 68 110, 50 118 C32 110, 5 86, 5 48 C5 18, 25 2, 50 2 Z"
        fill="#FFFFFF"
        stroke="#111827"
        strokeWidth="3.5"
      />
      {/* Grupo recortado con la banda roja diagonal */}
      <g clipPath="url(#riverShieldClip)">
        <polygon points="-10,35 110,-15 110,35 -10,85" fill="#EB1923" />
        <polygon points="-10,40 110,-10 110,30 -10,80" fill="#EB1923" />
      </g>
      {/* Letras C.A.R.P. entrelazadas centrales */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="21"
        letterSpacing="-1"
        fill="#111827"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        paintOrder="stroke fill"
      >
        CARP
      </text>
    </svg>
  );
}

export function RiverPlateLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-red-600 selection:text-white">
      {/* =========================================================================
          1. BARRA SUPERIOR INSTITUCIONAL (Negra, accesos rápidos oficiales)
         ========================================================================= */}
      <div className="bg-black text-slate-300 text-[11px] font-medium tracking-wide border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-white font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Sitio Oficial · Club Atlético River Plate
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Estadio Mâs Monumental · Buenos Aires</span>
          </div>
          <div className="flex items-center gap-6 font-semibold uppercase tracking-wider text-[10px]">
            <a href="#entradas" className="hover:text-white transition-colors">Entradas</a>
            <a href="#disciplinas" className="hover:text-white transition-colors">Deportes</a>
            <a href="#noticias" className="hover:text-white transition-colors">Prensa</a>
            <span className="text-slate-600">|</span>
            <Link
              to={ROUTES.login}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              RiverID / Portal Socios <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. HEADER PRINCIPAL (Blanco limpio, Escudo River + Menú + CTAs)
         ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo River Plate */}
          <div className="flex items-center gap-4">
            <Link to="/portal" className="flex items-center gap-3.5 group">
              <EscudoRiverPlate className="w-11 h-13 drop-shadow-xs transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-950 uppercase leading-none">
                  River Plate
                </span>
                <span className="text-[10px] font-bold tracking-widest text-red-600 uppercase mt-0.5">
                  El Más Grande Lejos
                </span>
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-700">
            <a href="#partido" className="hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600">
              Próximo Partido
            </a>
            <a href="#noticias" className="hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600">
              Noticias
            </a>
            <a href="#disciplinas" className="hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600">
              Disciplinas
            </a>
            <a href="#beneficios" className="hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600">
              Beneficios Socios
            </a>
            <a href="#monumental" className="hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600">
              El Monumental
            </a>
          </nav>

          {/* Acciones / Botones CTA */}
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.login}
              className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg border border-slate-300/80 bg-white text-xs font-bold uppercase tracking-wider text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer"
            >
              RiverID
            </Link>
            <Link
              to={ROUTES.hacermeSocio}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-red-600 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-98 transition-all cursor-pointer"
            >
              <Users size={14} />
              <span>Hacete Socio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. HERO PRINCIPAL: "EL MONUMENTAL" + PRÓXIMO PARTIDO (Impacto River Plate)
         ========================================================================= */}
      <section id="partido" className="relative bg-slate-950 text-white overflow-hidden">
        {/* Fondo con imagen dramática de estadio y bengalas rojas/blancas */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop')`,
          }}
        />
        {/* Degradado River (Rojo y negro profundo) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-red-950/50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Columna Izquierda: Copete + Título Monumental + Botones */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Copa Conmebol Libertadores · Fecha 5
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95]">
                Una Noche <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-red-500">
                  Monumental
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                El Más Grande recibe a Fluminense en Núñez por el pase a octavos de final. Asegurá tu lugar con tu <strong>RiverID</strong> o adquirí tu entrada con acceso digital 100% por QR sin canje físico.
              </p>

              {/* Botones de acción del Hero */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/eventos"
                  className="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-red-600 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/30 hover:bg-red-500 hover:shadow-red-600/40 transition-all cursor-pointer"
                >
                  <Ticket size={18} />
                  <span>Comprar Entradas</span>
                </Link>

                <Link
                  to={ROUTES.hacermeSocio}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/25 bg-white/10 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer"
                >
                  <span>Asociarme al Club</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Badges de garantías */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-red-500" />
                  <span>Acceso directo con QR en molinetes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-red-500" />
                  <span>Auditoría biométrica oficial</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta del Partido (Match Card) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-red-400">
                    Estadio Mâs Monumental
                  </span>
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar size={13} className="text-red-400" /> Miércoles 21:30 hs
                  </span>
                </div>

                {/* Enfrentamiento de Equipos */}
                <div className="grid grid-cols-5 items-center text-center py-2">
                  {/* Local: River */}
                  <div className="col-span-2 flex flex-col items-center gap-2">
                    <EscudoRiverPlate className="w-14 h-16 drop-shadow-md" />
                    <span className="font-black text-sm uppercase tracking-wide">River Plate</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Local</span>
                  </div>

                  {/* VS */}
                  <div className="col-span-1 flex flex-col items-center">
                    <span className="text-2xl font-black text-red-500 italic">VS</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Conmebol</span>
                  </div>

                  {/* Visitante */}
                  <div className="col-span-2 flex flex-col items-center gap-2">
                    <div className="w-14 h-16 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center font-black text-xs text-emerald-400 shadow-md">
                      FLU
                    </div>
                    <span className="font-black text-sm uppercase tracking-wide">Fluminense</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Visitante</span>
                  </div>
                </div>

                {/* Estado de sectores del Monumental */}
                <div className="space-y-2.5 pt-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-300">Popular Sívori y Centenario</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/30">
                      AGOTADA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-300">Platea San Martín Alta</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ÚLTIMOS LUGARES
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-300">Platea Belgrano Media</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      DISPONIBLE
                    </span>
                  </div>
                </div>

                <Link
                  to="/eventos"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Ticket size={15} />
                  <span>Sacar Entrada para el Miércoles</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CUADRÍCULA DE ACCESOS RÁPIDOS (Tiles institucionales)
         ========================================================================= */}
      <section className="relative -mt-8 z-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Link
            to={ROUTES.hacermeSocio}
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <Users size={22} />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              Hacete Socio Online
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Asociate en 3 minutos. Carnet digital con QR y prioridad exclusiva para partidos.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 mt-4 group-hover:translate-x-1 transition-transform">
              Empezar trámite <ArrowRight size={13} />
            </span>
          </Link>

          {/* Card 2 */}
          <Link
            to="/eventos"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <Ticket size={22} />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              Venta de Entradas
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Comprá tus entradas generales y plateas con pasarela oficial y QR instantáneo.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 mt-4 group-hover:translate-x-1 transition-transform">
              Ver partidos <ArrowRight size={13} />
            </span>
          </Link>

          {/* Card 3 */}
          <a
            href="#disciplinas"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <Trophy size={22} />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              Deportes y Actividades
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Más de 30 disciplinas federadas en el club para niños, jóvenes y adultos.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 mt-4 group-hover:translate-x-1 transition-transform">
              Consultar disciplinas <ArrowRight size={13} />
            </span>
          </a>

          {/* Card 4 */}
          <Link
            to={ROUTES.login}
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <QrCode size={22} />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              Portal del Socio
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Consultá tus cuotas sociales, descargá tu carnet y gestioná tu grupo familiar.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 mt-4 group-hover:translate-x-1 transition-transform">
              Ingresar al portal <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          5. SECCIÓN DE NOTICIAS EDITORIALES (Estilo revista oficial River Plate)
         ========================================================================= */}
      <section id="noticias" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-red-600">
              Prensa y Novedades
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950 mt-1">
              Últimas Noticias de River
            </h2>
          </div>
          <a
            href="#todas-noticias"
            className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 transition-colors inline-flex items-center gap-1 mt-3 sm:mt-0"
          >
            Ver archivo de noticias <ArrowRight size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Noticia Principal Grande (Destacada) */}
          <div className="lg:col-span-7 group cursor-pointer">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 mb-5 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop"
                alt="Entrenamiento en River Camp"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-red-600 text-white text-[11px] font-black uppercase tracking-wider">
                Fútbol Profesional
              </span>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-xs text-slate-300 font-medium">Hace 2 horas · River Camp, Ezeiza</span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 group-hover:text-red-400 transition-colors leading-tight">
                  Puesta a punto con la mira en el choque copero: trabajos tácticos y definición
                </h3>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              El plantel profesional completó una nueva jornada de entrenamientos en el predio de Ezeiza. El cuerpo técnico dispuso tareas de presión alta y circulación rápida de pelota con todo el grupo a disposición.
            </p>
          </div>

          {/* Columna Derecha: 3 Noticias Secundarias */}
          <div className="lg:col-span-5 space-y-6">
            {/* Noticia 2 */}
            <div className="group flex gap-4 p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-28 h-24 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=400&auto=format&fit=crop"
                  alt="Vóley River Plate"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
                    Polideportivo
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mt-0.5 line-clamp-2">
                    Gran victoria del Vóley Masculino en el Microestadio Monumental
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Ayer · Liga Metropolitana</span>
              </div>
            </div>

            {/* Noticia 3 */}
            <div className="group flex gap-4 p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-28 h-24 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=400&auto=format&fit=crop"
                  alt="Obras Monumental"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Institucional
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mt-0.5 line-clamp-2">
                    Avanza la modernización del anillo interno y nuevos accesos inteligentes
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Hace 2 días · Infraestructura</span>
              </div>
            </div>

            {/* Noticia 4 */}
            <div className="group flex gap-4 p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-28 h-24 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=400&auto=format&fit=crop"
                  alt="Reserva River"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
                    Formativas
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mt-0.5 line-clamp-2">
                    La Reserva sumó un nuevo triunfo de visitante y se consolida en la cima
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Hace 3 días · Torneo Proyección</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BANNER DE CONVERSIÓN CON LA BANDA ROJA DIAGONAL (Hacete Socio)
         ========================================================================= */}
      <section id="beneficios" className="relative bg-slate-950 text-white overflow-hidden py-16 sm:py-20">
        {/* Banda roja transversal estilizada */}
        <div
          className="absolute -top-32 -left-32 w-[130%] h-44 bg-red-600 -rotate-6 transform origin-top-left opacity-90 shadow-2xl pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block px-3 py-1 rounded bg-black/40 text-red-400 font-black text-xs uppercase tracking-widest border border-white/10">
                Socio Digital River Plate
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
                Llevá a River en tu celular <br />
                <span className="text-red-500">con el Carnet Digital</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Olvidate de las filas y los carnets plásticos perdidos. Con la plataforma de autogestión de River Plate accedés al Monumental con tu QR biométrico, pagás tu cuota con débito automático y disfrutás de descuentos exclusivos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-red-500 shrink-0" />
                  <span>Prioridad en entradas de Copa y Liga</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-red-500 shrink-0" />
                  <span>Acceso libre al Museo River</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-red-500 shrink-0" />
                  <span>20% OFF en Tienda Oficial Adidas</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
              <Link
                to={ROUTES.hacermeSocio}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-red-600 text-sm font-black uppercase tracking-wider text-white shadow-xl hover:bg-red-500 transition-all cursor-pointer text-center"
              >
                <span>Asociarme Ahora Mismo</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to={ROUTES.login}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl border border-white/20 bg-white/10 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer text-center"
              >
                <span>Ya soy socio · Ingresar</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. DEPORTES Y DISCIPLINAS FEDERADAS
         ========================================================================= */}
      <section id="disciplinas" className="py-20 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-red-600">
              Más que un club
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950 mt-1">
              Disciplinas Polideportivas
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              El club cuenta con más de 30 actividades competitivas y formativas con instalaciones de primer nivel.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { nombre: 'Fútbol Federado', icono: '⚽', desc: 'Infantiles, Juveniles y Senior' },
              { nombre: 'Básquet', icono: '🏀', desc: 'Liga Nacional y Formativas' },
              { nombre: 'Vóley', icono: '🏐', desc: 'División de Honor y Escuelita' },
              { nombre: 'Hockey Césped', icono: '🏑', desc: 'Tira completa Damas y Caballeros' },
              { nombre: 'Natación', icono: '🏊', desc: 'Pileta olímpica climatizada' },
              { nombre: 'Gimnasia', icono: '🤸', desc: 'Artística y Rítmica federada' },
            ].map((d) => (
              <div
                key={d.nombre}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-red-500/40 transition-all text-center flex flex-col items-center justify-between group cursor-pointer"
              >
                <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">{d.icono}</div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors">
                    {d.nombre}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">{d.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver horarios <ChevronRight size={10} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. SPONSORS OFICIALES (Estilo River Plate)
         ========================================================================= */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
            Main Sponsors & Partners Oficiales
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="font-black text-xl tracking-tighter text-slate-900">adidas</span>
            <span className="font-black text-xl tracking-wider text-slate-900">BETANO</span>
            <span className="font-black text-lg tracking-wide text-slate-900">DIRECTV</span>
            <span className="font-bold text-base tracking-wider text-slate-900">assist card</span>
            <span className="font-black text-lg tracking-widest text-slate-900">BBVA</span>
            <span className="font-bold text-base tracking-normal text-slate-900">Coca-Cola</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER INSTITUCIONAL COMPLETO
         ========================================================================= */}
      <footer id="monumental" className="bg-black text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Columna Marca */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <EscudoRiverPlate className="w-10 h-12" />
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">Club Atlético River Plate</h4>
                  <span className="text-[11px] text-red-500 font-bold uppercase tracking-widest">
                    Asociación Civil fundada en 1901
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Estadio Mâs Monumental · Av. Pres. Figueroa Alcorta 7597 (C1428BCL), Ciudad Autónoma de Buenos Aires, República Argentina.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-200 font-semibold">Secretaría de Socios:</span>
                <span>+54 (11) 4789-1200</span>
              </div>
            </div>

            {/* Columna El Club */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200">El Club</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#monumental" className="hover:text-white transition-colors">Estadio Monumental</a></li>
                <li><a href="#monumental" className="hover:text-white transition-colors">Museo River</a></li>
                <li><a href="#monumental" className="hover:text-white transition-colors">River Camp (Ezeiza)</a></li>
                <li><a href="#monumental" className="hover:text-white transition-colors">Fundación River</a></li>
                <li><a href="#monumental" className="hover:text-white transition-colors">Instituto River Plate</a></li>
              </ul>
            </div>

            {/* Columna Socios & Tickets */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200">Socios & Accesos</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to={ROUTES.login} className="hover:text-white transition-colors">RiverID / Mi Cuenta</Link></li>
                <li><Link to={ROUTES.hacermeSocio} className="hover:text-white transition-colors">Asociarme Online</Link></li>
                <li><Link to="/eventos" className="hover:text-white transition-colors">Venta de Entradas</Link></li>
                <li><Link to={ROUTES.validarAcceso} className="hover:text-white transition-colors">Control de Accesos QR</Link></li>
                <li><a href="#beneficios" className="hover:text-white transition-colors">Reglamento y Estatuto</a></li>
              </ul>
            </div>

            {/* Columna Tecnología SocialClub */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Tecnología SaaS</span>
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Portal institucional y sistema de gestión de cuotas y accesos operado sobre <strong>SocialClub Multi-Tenant</strong>.
              </p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded bg-white/10 text-[10px] font-mono text-slate-300">
                  v2.0.4 · High Availability
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <span>© 2026 Club Atlético River Plate. Todos los derechos reservados.</span>
            <div className="flex items-center gap-6">
              <a href="#privacidad" className="hover:text-slate-400 transition-colors">Términos y Condiciones</a>
              <a href="#privacidad" className="hover:text-slate-400 transition-colors">Política de Privacidad</a>
              <a href="#privacidad" className="hover:text-slate-400 transition-colors">Defensa del Consumidor</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
