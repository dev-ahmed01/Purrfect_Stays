import Link from 'next/link';

export function DestinationCard({
  name,
  stays,
  icon,
}: {
  name: string;
  stays: number;
  icon: string;
}) {
  return (
    <Link
      className="destination-card"
      href={`/stays?destination=${encodeURIComponent(name)}`}
    >
      <div className="destination-art" aria-hidden="true">{icon}</div>
      <div className="destination-info">
        <strong>{name}</strong>
        <span>{stays} stays</span>
      </div>
    </Link>
  );
}
