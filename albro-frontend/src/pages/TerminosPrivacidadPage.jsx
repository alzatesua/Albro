import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Shield, FileText, ChevronLeft, Lock, MapPin, Users, MessageSquare,
  Bell, ScrollText, Eye, Mail, Menu, X, ArrowUp,
} from "lucide-react";
import fondoLogin from "@/assets/fondo-login.jpg";

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

// ─── Datos de las secciones (contenido intacto) ────────────────────────────
const SECCIONES = [
  {
    id: "introduccion",
    titulo: "1. Introducción",
    icono: ScrollText,
    parrafos: [
      "Bienvenido a Albro. Albro es una plataforma digital que conecta a clientes y profesionales, permitiendo la gestión de citas, la oferta y contratación de servicios profesionales, la geolocalización de prestadores, la comunicación por chat y el pago de planes de suscripción.",
      "El uso de la plataforma atribuye la calidad de Usuario e implica la aceptación íntegra y sin reservas de todos los términos y condiciones contenidos en este documento, así como de la Política de Privacidad aquí descrita. Si no estás de acuerdo con alguno de los términos, deberás abstenerte de registrarte y de utilizar la plataforma.",
    ],
  },
  {
    id: "definiciones",
    titulo: "2. Definiciones",
    icono: FileText,
    lista: [
      ["Plataforma / Albro", "El aplicativo y sus servicios asociados (web, API y notificaciones)."],
      ["Usuario", "Toda persona natural registrada que utilice la plataforma."],
      ["Cliente", "Usuario que solicita y/o contrata servicios profesionales a través de la plataforma."],
      ["Profesional", "Usuario que ofrece servicios profesionales, agenda y atención a través de la plataforma."],
      ["Cita", "Acuerdo de prestación de un servicio agendado entre un Cliente y un Profesional dentro de la plataforma."],
      ["Datos Personales", "Cualquier información vinculada o que pueda asociarse a una persona natural identificada o identificable."],
    ],
  },
  {
    id: "aceptacion",
    titulo: "3. Aceptación de los Términos",
    icono: CheckIcon,
    parrafos: [
      "Al crear una cuenta, iniciar sesión (incluyendo el inicio de sesión con Google) o utilizar cualquiera de las funcionalidades de Albro, el Usuario manifiesta haber leído, comprendido y aceptado los presentes Términos y Condiciones y la Política de Privacidad.",
      "Si el Usuario no acepta total o parcialmente estos términos, deberá abstenerse de utilizar la plataforma. El uso continuado de Albro después de eventuales modificaciones constituye la aceptación de las mismas.",
    ],
  },
  {
    id: "registro",
    titulo: "4. Registro de cuenta y veracidad de la información",
    icono: Users,
    parrafos: [
      "El registro requiere la provisión de datos personales tales como nombre, apellido, correo electrónico, número de teléfono y contraseña. El Usuario también podrá registrarse o iniciar sesión mediante su cuenta de Google.",
      "El Usuario declara que toda la información proporcionada es veraz, completa y actual. Es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta, debiendo notificar de inmediato a Albro cualquier uso no autorizado.",
      "Cada Usuario puede actuar bajo dos roles: Cliente y/o Profesional. La activación del rol Profesional está sujeta a la completitud del perfil y a la verificación que Albro estime pertinente.",
    ],
  },
  {
    id: "uso-plataforma",
    titulo: "5. Uso permitido de la plataforma",
    icono: Eye,
    lista: [
      ["Uso lícito", "El Usuario utilizará la plataforma únicamente para fines lícitos y conforme a estos términos."],
      ["Contenidos propios", "El Profesional es responsable de la veracidad, legalidad y disponibilidad de los servicios que ofrece, así como de su portafolio y fotografías."],
      ["Reserva de derechos", "Queda prohibido el uso de Albro para actividades fraudulentas, engañosas, discriminatorias, que vulneren derechos de terceros o que obtengan datos de otros usuarios de forma no consentida."],
      ["Calificaciones", "Las calificaciones y reseñas deben responder a experiencias reales. Queda prohibido el sesgo malicioso o motivado por intercambios ajenos a la plataforma."],
    ],
  },
  {
    id: "citas-pagos",
    titulo: "6. Citas, cancelaciones y pagos",
    icono: CalendarIcon,
    parrafos: [
      "Las citas se gestionan a través de la funcionalidad de agenda. El Profesional define su disponibilidad y el Cliente selecciona el horario disponible. El Usuario reconoce que Albro actúa como intermediario tecnológico y no es parte en la relación contractual de prestación del servicio entre Cliente y Profesional.",
      "La cancelación o reagendamiento de citas se realizará desde la plataforma. Las condiciones específicas (plazos, penalizaciones, reembolsos) son acordadas directamente entre las partes, salvo en los supuestos expresamente definidos por Albro.",
      "El Profesional que desee acceder a funcionalidades premium o de mayor visibilidad podrá suscribirse a planes de pago (mensual o anual). Los pagos se gestionan de forma manual a través de los canales habilitados por Albro, y su acreditación puede requerir comprobantes. Albro podrá suspender el acceso a funcionalidades de pago en caso de impago o fraude.",
    ],
  },
  {
    id: "geolocalizacion",
    titulo: "7. Geolocalización y mapa",
    icono: MapPin,
    parrafos: [
      "Albro utiliza servicios de mapas para mostrar la ubicación de los profesionales disponibles y permitir al Cliente encontrar prestadores cercanos.",
      "El Profesional acepta que su ubicación aproximada sea visible para otros Usuarios mientras tenga la función de disponibilidad activa. El Usuario podrá gestionar los permisos de ubicación desde su dispositivo y/o navegador, pudiendo revocarlos en cualquier momento, lo cual puede limitar funcionalidades de la plataforma.",
    ],
  },
  {
    id: "comunicaciones",
    titulo: "8. Comunicaciones, chat y notificaciones",
    icono: MessageSquare,
    parrafos: [
      "La plataforma facilita un sistema de chat entre Cliente y Profesional con propósito de coordinación de servicios, así como notificaciones (push y dentro del app) sobre el estado de las citas, recordatorios y novedades.",
      "El Usuario se obliga a mantener un trato respetuoso en el chat. Quedan prohibidos los contenidos ofensivos, acosadores, publicitarios no consentidos, o que vulneren la intimidad de las personas.",
      "Albro no supervisa activamente las conversaciones privadas, pero podrá acceder a ellas cuando exista una denuncia, requerimiento legal o sospecha razonable de uso indebido, en los términos de la Política de Privacidad.",
    ],
  },
  {
    id: "privacidad-datos",
    titulo: "9. Política de Privacidad",
    icono: Lock,
    parrafos: [
      "Albro actúa como Responsable del Tratamiento de los Datos Personales. La información se trata con base legal en la ejecución del contrato (prestación del servicio de la plataforma), el consentimiento del Usuario y el legítimo interés en la mejora y seguridad del servicio.",
    ],
  },
  {
    id: "datos-tratados",
    titulo: "10. Datos que tratamos",
    icono: FileText,
    lista: [
      ["De identificación", "Nombre, apellido, correo electrónico y número de teléfono."],
      ["De acceso", "Credenciales (contraseña cifrada) y, en su caso, el token de Google."],
      ["De ubicación", "Ubicación aproximada del Profesional visible en el mapa (cuando la función está activa)."],
      ["De actividad", "Historial de citas, estados de atención, calificaciones y mensajes del chat."],
      ["De pago", "Comprobantes y referencias de transferencia necesarios para acreditar suscripciones."],
    ],
  },
  {
    id: "finalidad",
    titulo: "11. Finalidad del tratamiento",
    icono: Bell,
    lista: [
      ["Prestación del servicio", "Gestión de cuenta, citas, agenda, chat, notificaciones y mapa."],
      ["Atención al Usuario", "Respuesta a solicitudes, reclamos y soporte técnico."],
      ["Mejora continua", "Análisis de uso, estabilidad, seguridad y desarrollo de nuevas funciones."],
      ["Cumplimiento legal", "Atención de requerimientos de autoridades competentes y conservación de registros."],
    ],
  },
  {
    id: "autorizacion",
    titulo: "12. Autorización y derechos del titular",
    icono: Shield,
    parrafos: [
      "Al registrarse, el Usuario autoriza de manera inequívoca, previa, expresa e informada a Albro para el tratamiento de sus datos personales conforme a esta Política. Esta autorización es revocable en cualquier momento sin retroactividad.",
      "El titular de los datos conserva el derecho a: (i) acceder a sus datos, (ii) conocer, rectificar y actualizarlos, (iii) solicitar prueba de la autorización, (iv) solicitar su supresión cuando sea procedente, y (v) revocar la autorización y/o presentar reclamaciones ante la autoridad competente.",
      "Para ejercer estos derechos, el Usuario podrá escribir al correo de contacto habilitado por Albro. La respuesta se otorgará en los plazos legales aplicables.",
    ],
  },
  {
    id: "terceros",
    titulo: "13. Terceros y transferencias",
    icono: Users,
    lista: [
      ["Google", "Para el inicio de sesión con Google se transfieren los datos estrictamente necesarios previstos por ese proveedor, bajo su propia política de privacidad."],
      ["Proveedores de infraestructura", "Servicios de hosting, bases de datos y mensajería en tiempo real, con garantías de confidencialidad."],
      ["Autoridades", "Cuando medie requerimiento legal o judicial debidamente expedido."],
      ["Entre Usuarios", "Para la prestación del servicio, los datos de contacto necesarios serán visibles entre el Cliente y el Profesional correspondiente."],
    ],
  },
  {
    id: "seguridad",
    titulo: "14. Seguridad de la información",
    icono: Lock,
    parrafos: [
      "Albro implementa medidas técnicas y organizativas razonables para proteger los datos personales (cifrado de contraseñas, autenticación por JWT, control de acceso y segregación de roles).",
      "No existe sistema completamente seguro. En caso de una vulneración de datos de seguridad relevante, Albro notificará a los Usuarios afectados y a las autoridades competentes conforme a la normativa aplicable.",
    ],
  },
  {
    id: "conservacion",
    titulo: "15. Conservación de los datos",
    icono: ScrollText,
    parrafos: [
      "Los datos se conservarán mientras exista una relación vigente con el Usuario y, posteriormente, durante los plazos legales aplicables para atender responsabilidades o requerimientos de las autoridades.",
      "Transcurridos dichos plazos, los datos serán suprimidos o anonimizados, salvo que exista una base legal que justifique su conservación.",
    ],
  },
  {
    id: "responsabilidad",
    titulo: "16. Responsabilidad",
    icono: Shield,
    parrafos: [
      "Albro actúa como intermediario tecnológico. No se hace responsable por el cumplimiento de las obligaciones contractuales entre Cliente y Profesional, ni por la calidad o idoneidad del servicio prestado, ni por los daños derivados de la relación directa entre las partes, ni por las interrupciones del servicio por casos fortuitos o fuerza mayor.",
      "Albro limita su responsabilidad respecto del contenido publicado por los Usuarios (portafolios, fotografías, calificaciones) sin perjuicio de su facultad de retirar contenidos que infrinjan estos términos.",
    ],
  },
  {
    id: "propiedad",
    titulo: "17. Propiedad intelectual",
    icono: FileText,
    parrafos: [
      "Los derechos sobre la plataforma, su diseño, código, marcas y logotipos pertenecen a Albro. El Usuario conserva la titularidad de los contenidos que publica (portafolios, fotografías), otorgando a Albro una licencia no exclusiva para su visualización dentro del servicio.",
    ],
  },
  {
    id: "modificaciones",
    titulo: "18. Modificaciones",
    icono: ScrollText,
    parrafos: [
      "Albro podrá actualizar los presentes Términos y Condiciones y la Política de Privacidad en cualquier momento. Las versiones vigentes estarán siempre disponibles en la plataforma. Se notificarán los cambios sustanciales con antelación razonable a través de los canales habituales.",
    ],
  },
  {
    id: "contacto",
    titulo: "19. Contacto",
    icono: Mail,
    parrafos: [
      "Para cualquier inquietud relacionada con estos términos o con el tratamiento de datos personales, el Usuario podrá contactar a Albro a través del correo electrónico habilitado para soporte dentro de la aplicación.",
    ],
  },
];

// Separa "3. Título" en número + etiqueta, solo para el tratamiento tipográfico.
// Si el patrón no coincide, se devuelve el texto completo sin alterarlo.
function partirTitulo(titulo) {
  const m = titulo.match(/^(\d+)\.\s*(.+)$/);
  return m ? { numero: m[1], etiqueta: m[2] } : { numero: null, etiqueta: titulo };
}

// ─── Página ────────────────────────────────────────────────────────────────
export default function TerminosPrivacidadPage() {
  const [seccionActiva, setSeccionActiva] = useState(SECCIONES[0].id);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mostrarArriba, setMostrarArriba] = useState(false);

  // Resalta la sección visible en el índice
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setSeccionActiva(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    SECCIONES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Barra de progreso de lectura + botón "volver arriba"
  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setProgreso(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
      setMostrarArriba(scrollTop > 640);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const irASeccion = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuAbierto(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Fuentes: display serif de autoridad + sans utilitaria para el cuerpo */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      {/* Barra de progreso de lectura */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-black/10">
        <div
          className="h-full bg-[#AD8434] transition-[width] duration-150 ease-out"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${fondoLogin})`, filter: "blur(6px) saturate(90%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1526]/92 via-[#0E1526]/88 to-[#0E1526]" />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 26px)",
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <header className="w-full px-6 py-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#AD8434]/15 border border-[#D8B463]/40 flex items-center justify-center">
                <Shield className="text-[#D8B463]" size={18} />
              </div>
              <div>
                <p className="text-white font-display font-medium text-base tracking-tight">Albro</p>
                <p className="text-white/45 font-body text-xs">Términos y Política de Privacidad</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-body text-white/70 hover:text-white transition-colors border border-white/15 rounded-full px-3 py-1.5"
                aria-expanded={menuAbierto}
                aria-controls="indice-movil"
              >
                {menuAbierto ? <X size={14} /> : <Menu size={14} />}
                Índice
              </button>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-body text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
                Volver
              </Link>
            </div>
          </header>

          {/* Índice móvil desplegable */}
          {menuAbierto && (
            <nav
              id="indice-movil"
              className="lg:hidden mx-6 mb-2 rounded-xl border border-white/10 bg-[#0E1526]/95 backdrop-blur-md max-h-[60vh] overflow-y-auto"
            >
              {SECCIONES.map((s) => {
                const { numero, etiqueta } = partirTitulo(s.titulo);
                const activo = seccionActiva === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => irASeccion(s.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-body border-b border-white/5 last:border-b-0 transition-colors ${
                      activo ? "text-white bg-white/[0.06]" : "text-white/55"
                    }`}
                  >
                    <span className="font-display text-[#D8B463] text-xs w-4 shrink-0">{numero}</span>
                    <span className="truncate">{etiqueta}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Bloque de presentación */}
          <section className="w-full px-6 pt-10 pb-16 text-center">
            <div className="max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-body font-medium text-[#E7CD8F] bg-[#AD8434]/10 border border-[#D8B463]/30">
                <Lock size={11} />
                Documento vigente · Actualizado el {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <h1 className="mt-6 text-3xl sm:text-[2.6rem] font-display font-medium text-white tracking-tight leading-[1.1]">
                Términos y Condiciones
                <span className="block text-[#D8B463]">Política de Privacidad</span>
              </h1>
              <p className="mt-4 text-white/50 font-body text-sm sm:text-[15px] leading-relaxed">
                Estos términos regulan el uso de la plataforma Albro y describimos cómo tratamos tu
                información personal cuando utilizas nuestros servicios de citas, profesionales, mapa y comunicaciones.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ── CUERPO: índice + documento ── */}
      <div className="w-full max-w-6xl mx-auto px-6 -mt-8 pb-24 relative z-10 grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Índice lateral tipo "expediente" (sticky, solo desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_24px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
            <p className="px-5 pt-5 pb-2 text-[11px] font-body font-semibold uppercase tracking-widest text-[#8A6A2A]">
              Índice
            </p>
            <nav className="pb-3 max-h-[72vh] overflow-y-auto">
              {SECCIONES.map((s) => {
                const { numero, etiqueta } = partirTitulo(s.titulo);
                const activo = seccionActiva === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => irASeccion(s.id)}
                    className="w-full text-left flex items-start gap-2.5 px-5 py-2 group"
                  >
                    <span
                      className={`mt-0.5 h-4 w-[3px] rounded-full shrink-0 transition-colors ${
                        activo ? "bg-[#AD8434]" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`font-display text-xs mt-[1px] shrink-0 w-4 ${
                        activo ? "text-[#AD8434]" : "text-black/25"
                      }`}
                    >
                      {numero}
                    </span>
                    <span
                      className={`text-[13px] font-body leading-snug transition-colors ${
                        activo ? "text-[#1B1E27] font-medium" : "text-black/45 group-hover:text-black/70"
                      }`}
                    >
                      {etiqueta}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Documento */}
        <article className="rounded-2xl bg-white border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(0,0,0,0.15)] px-6 sm:px-12 py-10 sm:py-14">
          <div className="divide-y divide-black/[0.06]">
            {SECCIONES.map((s) => {
              const Icono = s.icono;
              const { numero, etiqueta } = partirTitulo(s.titulo);
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24 py-8 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4 mb-4">
                    {numero && (
                      <span className="font-display text-3xl sm:text-4xl text-[#E9DAB4] leading-none select-none shrink-0">
                        {numero}
                      </span>
                    )}
                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="size-8 rounded-lg bg-[#AD8434]/10 border border-[#AD8434]/20 flex items-center justify-center shrink-0">
                        <Icono size={15} className="text-[#8A6A2A]" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-display font-medium text-[#1B1E27] tracking-tight">
                        {etiqueta}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3 pl-0 sm:pl-[3.25rem]">
                    {s.parrafos?.map((p, i) => (
                      <p key={i} className="text-sm sm:text-[15px] font-body text-[#3A3D46] leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {s.lista && (
                      <ul className="space-y-3 mt-1">
                        {s.lista.map(([titulo, texto], i) => (
                          <li key={i} className="flex gap-3 text-sm sm:text-[15px] font-body text-[#3A3D46] leading-relaxed">
                            <span className="mt-2 size-1.5 rounded-full bg-[#AD8434] shrink-0" />
                            <span>
                              <span className="text-[#1B1E27] font-medium">{titulo}:</span>{" "}
                              {texto}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="pt-6 mt-2 border-t border-black/[0.08]">
            <p className="text-xs font-body text-black/35">
              © {new Date().getFullYear()} Albro. Este documento se ofrece con fines informativos y
              constituye el marco normativo de uso de la plataforma. Conserva una copia para tus registros.
            </p>
          </div>
        </article>
      </div>

      {/* Volver arriba */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-40 size-11 rounded-full bg-[#0E1526] border border-[#D8B463]/30 text-[#D8B463] flex items-center justify-center shadow-lg transition-all ${
          mostrarArriba ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        aria-label="Volver arriba"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}