/**
 * Utilidad para alternar entre mensajes cordiales y modismos irreverentes de la cultura popular mexicana.
 * Manteniendo un tono divertido y picante (pero libre de groserías vulgares).
 */
export function picante(normal: string, spicy: string, isSpicy: boolean): string {
  return isSpicy ? spicy : normal;
}

// Opciones de Carrilla Mexicana para marcadores exactos (+5 pts)
export const MEXICAN_WIN_PHRASES = [
  '🎯 ¡Tómala Barbón! 🔥',
  '🧠 ¡Te la rifaste gacho! 👁️👄👁️',
  '🐕 ¡Ahhh perreeeee!!! 🔥🐕',
  '👑 ¡Te pusiste la del Puebla y coronaste!',
  '🌟 ¡Puro pináculo táctico, compadre!'
];

// Opciones de Carrilla Mexicana para fallos épicos
export const MEXICAN_BLUNDER_PHRASES = [
  'De qué te vas a disfrazaaaaaaaaaaar 🤡',
  '¡Mayonesa McCormick... digo, Hellmann\'s! 🤦‍♂️',
  '¡Te andaba haciendo falta un fuerte abrazo! 🫂',
  '¡Ni metiendo las manos, carnal! 🧤❌',
  'Eso fue un tiro libre directo... al espacio 🚀'
];

/**
 * Retorna una frase aleatoria de éxito en marcadores.
 */
export function getSpicyWinMsg(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % MEXICAN_WIN_PHRASES.length;
  return MEXICAN_WIN_PHRASES[idx];
}

/**
 * Retorna una frase aleatoria de pifia/fallo futbolero.
 */
export function getSpicyBlunderMsg(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % MEXICAN_BLUNDER_PHRASES.length;
  return MEXICAN_BLUNDER_PHRASES[idx];
}
