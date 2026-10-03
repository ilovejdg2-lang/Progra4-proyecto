import { Link } from '@tanstack/react-router';
import { ArrowRight, Mail, Phone, Users } from 'lucide-react';
import { ST } from '../../Components/T/ST';
import { useTraducir } from '../../hooks/useTraducir';

function iniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${primera}${ultima}`.toUpperCase();
}

function hrefTelefono(telefono) {
  return `tel:${String(telefono || '').replace(/[^\d+]/g, '')}`;
}

function Contacto({ href, icono: Icono, texto }) {
  return (
    <a className="about-equipo__contacto" href={href}>
      <span className="about-equipo__contacto-icono" aria-hidden="true">
        <Icono size={15} strokeWidth={2.2} />
      </span>
      <span className="about-equipo__contacto-texto">{texto}</span>
    </a>
  );
}

export function PersonaEquipo({ persona, indice = 0 }) {
  return (
    <li className="about-equipo__persona" style={{ '--i': indice }}>
      <div className="about-equipo__retrato">
        {persona.foto ? (
          <img src={persona.foto} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{iniciales(persona.nombre)}</span>
        )}
      </div>
      <h3 className="about-equipo__nombre">{persona.nombre}</h3>
      {persona.cargo ? <p className="about-equipo__rol"><ST>{persona.cargo}</ST></p> : null}
      {persona.correo || persona.telefono ? (
        <div className="about-equipo__contactos">
          {persona.correo ? <Contacto href={`mailto:${persona.correo}`} icono={Mail} texto={persona.correo} /> : null}
          {persona.telefono ? <Contacto href={hrefTelefono(persona.telefono)} icono={Phone} texto={persona.telefono} /> : null}
        </div>
      ) : null}
    </li>
  );
}

export function EquipoSection({ equipo }) {
  const tEyebrow = useTraducir('Equipo y contactos');
  const tTitulo = useTraducir('Las personas detrás del café');
  const tLead = useTraducir('Cada área del proyecto tiene a alguien a cargo. Si tenés una consulta, escribile directamente a quien corresponda.');
  const tVacio = useTraducir('Todavía no hay personas registradas en el equipo.');
  const tCierreTitulo = useTraducir('¿Querés sumarte al proyecto?');
  const tCierreTexto = useTraducir('Siempre hay espacio para nuevas manos e ideas en el cafetal.');
  const tCierreEnlace = useTraducir('Quiero ser voluntario');
  const personas = Array.isArray(equipo) ? equipo : [];

  return (
    <section id="about-equipo" className="about-equipo" aria-labelledby="about-equipo-title">
      <header className="about-equipo__intro">
        <p className="about-equipo__eyebrow">{tEyebrow}</p>
        <h1 id="about-equipo-title" className="about-equipo__titulo">{tTitulo}</h1>
        <p className="about-equipo__lead">{tLead}</p>
      </header>

      {personas.length ? (
        <ul className="about-equipo__lista reveal-on-scroll">
          {personas.map((persona, indice) => (
            <PersonaEquipo key={persona.id ?? persona.nombre} persona={persona} indice={indice} />
          ))}
        </ul>
      ) : (
        <div className="about-equipo__vacio">
          <span className="about-equipo__vacio-icono" aria-hidden="true">
            <Users size={26} strokeWidth={1.8} />
          </span>
          <p>{tVacio}</p>
        </div>
      )}

      <aside className="about-equipo__cierre reveal-on-scroll">
        <div>
          <h2>{tCierreTitulo}</h2>
          <p>{tCierreTexto}</p>
        </div>
        <Link to="/voluntariado/solicitar" className="about-equipo__cierre-enlace">
          {tCierreEnlace}
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      </aside>
    </section>
  );
}
