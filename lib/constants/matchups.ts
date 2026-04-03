// Historical World Cup matchup data for group stage matches.
// Key: "teamA-teamB" (alphabetically sorted IDs).

export interface MatchupFact {
  title: string
  detail: string
}

export interface MatchupData {
  /** How many times they've met in WC history */
  wcMeetings: number
  /** Brief head-to-head summary */
  h2h?: string
  /** Fun facts / curiosities */
  facts: MatchupFact[]
}

function key(a: string, b: string): string {
  return [a, b].sort().join('-')
}

const DATA: Record<string, MatchupData> = {
  // ─── GROUP A ────────────────────────────────────────────
  [key('mex', 'rsa')]: {
    wcMeetings: 1,
    h2h: 'México 1 – Sudáfrica 1 (2010, fase de grupos)',
    facts: [
      { title: 'Debut copero', detail: 'Sudáfrica fue el anfitrión en 2010, el primer Mundial en África.' },
      { title: 'Bafana Bafana', detail: 'Sudáfrica es el único anfitrión eliminado en fase de grupos.' },
    ],
  },
  [key('kor', 'cze')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Primer enfrentamiento', detail: 'Nunca se han enfrentado en un Mundial.' },
      { title: 'Corea 2002', detail: 'Corea del Sur llegó a semifinales como coanfitrión en 2002.' },
      { title: 'Checoslovaquia', detail: 'Como Checoslovaquia fueron finalistas en 1934 y 1962.' },
    ],
  },
  [key('mex', 'kor')]: {
    wcMeetings: 2,
    h2h: 'México 3 – Corea del Sur 1 (2018), México 0 – Corea 1 (1998)',
    facts: [
      { title: 'Quinto maldito', detail: 'México ha sido eliminado en octavos en 7 mundiales consecutivos (1994-2022).' },
      { title: 'Rivales directos', detail: 'En 2018, México venció 2-1 a Corea, pero ambos avanzaron.' },
    ],
  },
  [key('mex', 'cze')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Primer cruce', detail: 'Primera vez que se enfrentan en un Mundial.' },
      { title: 'Anfitrión', detail: 'México será coanfitrión de este Mundial 2026.' },
    ],
  },
  [key('rsa', 'kor')]: {
    wcMeetings: 1,
    h2h: 'Corea del Sur 2 – Sudáfrica 0 (fase de grupos, 2002 como anfitrión)',
    facts: [
      { title: 'Mundiales africanos', detail: 'Sudáfrica sigue siendo el único país africano en haber sido sede.' },
    ],
  },
  [key('rsa', 'cze')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Sin historial', detail: 'Nunca se han enfrentado en la Copa del Mundo.' },
    ],
  },

  // ─── GROUP B ────────────────────────────────────────────
  [key('can', 'sui')]: {
    wcMeetings: 1,
    h2h: 'Suiza 1 – Canadá 0 (2022)',
    facts: [
      { title: 'Regreso esperado', detail: 'Canadá volvió a un Mundial en 2022 después de 36 años (1986).' },
    ],
  },

  // ─── GROUP C ────────────────────────────────────────────
  [key('bra', 'mar')]: {
    wcMeetings: 1,
    h2h: 'Brasil 4 – Marruecos 1 (1998)',
    facts: [
      { title: 'Marruecos 2022', detail: 'Marruecos hizo historia en 2022 como primer equipo africano en semis.' },
      { title: 'Pentacampeón', detail: 'Brasil es el país con más títulos mundiales (5).' },
    ],
  },
  [key('bra', 'sco')]: {
    wcMeetings: 2,
    h2h: 'Brasil 2 – Escocia 1 (1998), Brasil 4 – Escocia 1 (1974)',
    facts: [
      { title: 'Inauguración', detail: 'Se enfrentaron en el partido inaugural del Mundial 1998.' },
    ],
  },

  // ─── GROUP D ────────────────────────────────────────────
  [key('usa', 'tur')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Coanfitrión', detail: 'EE.UU. es coanfitrión del Mundial 2026 junto a México y Canadá.' },
      { title: 'Turquía 2002', detail: 'Turquía llegó a semifinales en su mejor actuación mundialista.' },
    ],
  },
  [key('usa', 'pry')]: {
    wcMeetings: 1,
    h2h: 'EE.UU. 3 – Paraguay 1 (octavos, 2002)',
    facts: [
      { title: 'Legendario', detail: 'Paraguay llegó a cuartos en 2010, su mejor resultado.' },
    ],
  },

  // ─── GROUP E ────────────────────────────────────────────
  [key('ger', 'ecu')]: {
    wcMeetings: 1,
    h2h: 'Alemania 3 – Ecuador 0 (2006)',
    facts: [
      { title: 'Anfitrión 2006', detail: 'Alemania fue sede en 2006, terminó 3° lugar.' },
    ],
  },

  // ─── GROUP F ────────────────────────────────────────────
  [key('ned', 'jpn')]: {
    wcMeetings: 1,
    h2h: 'Países Bajos 1 – Japón 0 (2010)',
    facts: [
      { title: 'Finalistas', detail: 'Países Bajos ha sido 3 veces finalista sin ganar (1974, 1978, 2010).' },
      { title: 'Japón moderno', detail: 'Japón ha clasificado a 7 mundiales consecutivos.' },
    ],
  },
  [key('swe', 'jpn')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Suecia 1958', detail: 'Suecia fue finalista como anfitrión en 1958, perdiendo ante Brasil.' },
    ],
  },

  // ─── GROUP G ────────────────────────────────────────────
  [key('bel', 'egy')]: {
    wcMeetings: 1,
    h2h: 'Bélgica 3 – Egipto 0 (grupos, 1934)',
    facts: [
      { title: 'Generación dorada', detail: 'Bélgica alcanzó semifinales en 2018 con De Bruyne, Hazard y Lukaku.' },
      { title: 'Salah', detail: 'Mohamed Salah disputó su primer Mundial en 2018 con Egipto.' },
    ],
  },
  [key('irn', 'bel')]: {
    wcMeetings: 1,
    h2h: 'Bélgica 1 – Irán 0 (2022)',
    facts: [
      { title: 'Team Melli', detail: 'Irán ha clasificado a 6 mundiales, todos desde 1998.' },
    ],
  },

  // ─── GROUP H ────────────────────────────────────────────
  [key('esp', 'uru')]: {
    wcMeetings: 1,
    h2h: 'España 2 – Uruguay 1 (octavos, 2022, con gol de penalti VAR anulado)',
    facts: [
      { title: 'La Celeste', detail: 'Uruguay ganó las primeras 2 Copas del Mundo (1930 y 1950).' },
      { title: 'España 2010', detail: 'España ganó su único título en 2010, con el tiki-taka.' },
    ],
  },
  [key('esp', 'ksa')]: {
    wcMeetings: 1,
    h2h: 'Arabia Saudita 1 – España 2 (2022)',
    facts: [
      { title: 'Shock 2022', detail: 'Arabia Saudita venció a Argentina 2-1 en el partido más sorpresivo.' },
    ],
  },

  // ─── GROUP I ────────────────────────────────────────────
  [key('fra', 'sen')]: {
    wcMeetings: 1,
    h2h: 'Senegal 1 – Francia 0 (inauguración 2002, gran sorpresa)',
    facts: [
      { title: 'Shock inaugural', detail: 'Senegal derrotó a la campeona Francia en el partido inaugural 2002.' },
      { title: 'Bicampeona', detail: 'Francia ha ganado 2 mundiales (1998, 2018) y fue finalista en 2022.' },
    ],
  },

  // ─── GROUP J ────────────────────────────────────────────
  [key('arg', 'alg')]: {
    wcMeetings: 2,
    h2h: 'Argentina 2 – Argelia 1 (1982), Alemania 2 – Argelia 1 (2014 en octavos)',
    facts: [
      { title: 'Tricampeón', detail: 'Argentina es triple campeón del mundo (1978, 1986, 2022).' },
      { title: 'Sorpresa 1982', detail: 'Argelia derrotó a Alemania 2-1 en la "Vergüenza de Gijón" de 1982.' },
    ],
  },
  [key('arg', 'jor')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Debut jordano', detail: 'Jordania jugará su primer Mundial en la historia.' },
      { title: 'Messi legacy', detail: 'Argentina busca defender el título ganado por Messi en Catar 2022.' },
    ],
  },

  // ─── GROUP K ────────────────────────────────────────────
  [key('por', 'col')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Ronaldo', detail: 'Cristiano Ronaldo (41 años) podría disputar su 6° Mundial.' },
      { title: 'James 2014', detail: 'Colombia llegó a cuartos en 2014 con James Rodríguez como goleador.' },
    ],
  },
  [key('por', 'uzb')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Debut uzbeko', detail: 'Uzbekistán participará en su primer Mundial.' },
    ],
  },

  // ─── GROUP L ────────────────────────────────────────────
  [key('eng', 'cro')]: {
    wcMeetings: 2,
    h2h: 'Croacia 2 – Inglaterra 1 (semifinal 2018), Inglaterra 1 – Croacia 0 (2022)',
    facts: [
      { title: 'Revancha', detail: 'Croacia eliminó a Inglaterra en semis de 2018 con gol de Mandžukić.' },
      { title: 'It\'s coming home', detail: 'Inglaterra solo ha ganado 1 Mundial (1966, en casa).' },
    ],
  },
  [key('eng', 'pan')]: {
    wcMeetings: 1,
    h2h: 'Inglaterra 6 – Panamá 1 (2018)',
    facts: [
      { title: 'Debut panameño', detail: 'Panamá debutó en el Mundial 2018 y celebró su primer gol mundialista.' },
    ],
  },
  [key('cro', 'gha')]: {
    wcMeetings: 0,
    facts: [
      { title: 'Croacia finalista', detail: 'Croacia fue finalista en 2018 y semifinalista en 2022.' },
      { title: 'Ghana 2010', detail: 'Ghana fue el último equipo africano en cuartos (2010, penal fallado de Gyan).' },
    ],
  },
}

export function getMatchupData(homeId: string, awayId: string): MatchupData | null {
  return DATA[key(homeId, awayId)] ?? null
}

// Generic fallback facts based on team history
export function getFallbackFacts(homeId: string, awayId: string): MatchupData {
  return {
    wcMeetings: 0,
    facts: [
      { title: 'Sin historial directo', detail: 'Estos equipos no se han enfrentado antes en una Copa del Mundo.' },
    ],
  }
}
