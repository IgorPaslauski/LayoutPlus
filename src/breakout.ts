export interface OverflowStyle {
  overflowX: string;
  overflowY: string;
}

export interface ChainNode {
  parentElement: ChainNode | null;
}

const CLIP = new Set(['hidden', 'clip']);

/** True when a parent would cut a block that leaves its column. Does not read text. */
export function ancestorClips(start: ChainNode | null, styleOf: (element: ChainNode) => OverflowStyle): boolean {
  let node = start?.parentElement ?? null;
  while (node) {
    const style = styleOf(node);
    if (CLIP.has(style.overflowX) || CLIP.has(style.overflowY)) return true;
    node = node.parentElement;
  }
  return false;
}

export function breakoutActive(requested: boolean, viewport: number, clipped: boolean): boolean {
  return requested && viewport > 768 && !clipped;
}
