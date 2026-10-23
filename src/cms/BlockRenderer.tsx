import { Fragment } from 'react';
import type { BlockInstance } from './types';
import { blockDef } from './blocks';

/** Javni renderer — pretvara stablo blokova iz baze u React */
export function BlockRenderer({ blocks }: { blocks: BlockInstance[] }) {
  return (
    <>
      {blocks.map((b) => {
        const def = blockDef(b.type);
        if (!def) return null;
        return <Fragment key={b.id}>{def.render(b.props)}</Fragment>;
      })}
    </>
  );
}
