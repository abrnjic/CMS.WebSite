import { Link } from 'react-router';
import type { Property } from '@/types';
import { imgSrc } from '@/lib/img';
import { eur } from '@/lib/pricing';

const TYPE_LABEL: Record<Property['type'], string> = {
  apartment: 'Apartman',
  house: 'Kuca',
  villa: 'Vila',
};

export function PropertyCard({ property }: { property: Property }) {
  const minPrice = Math.min(...property.units.map((u) => u.basePrice));
  return (
    <Link
      to={`/smjestaj/${property.slug}`}
      className="group block border border-border bg-card transition-shadow duration-300 hover:shadow-[0_8px_30px_hsl(var(--foreground)/0.08)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={imgSrc(property.images[0])}
          alt={property.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <span className="absolute left-4 top-4 bg-background/90 px-3 py-1 font-mono-label text-[11px] uppercase tracking-widest">
          {TYPE_LABEL[property.type]}
        </span>
        {property.distanceToSea < 500 && (
          <span className="absolute bottom-4 right-4 bg-foreground/85 px-3 py-1 font-mono-label text-[11px] uppercase tracking-widest text-background">
            {property.distanceToSea} m do mora
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl">{property.name}</h3>
          <span className="font-mono-label text-xs text-muted-foreground">
            ★ {property.rating.toFixed(1)} ({property.reviewCount})
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{property.city} · {property.tagline}</p>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
            od <span className="text-base font-medium text-foreground">{eur(minPrice)}</span> / noc
          </span>
          <span className="link-underline-faint text-sm">Pogledaj →</span>
        </div>
      </div>
    </Link>
  );
}
