import Image from 'next/image';
import { canOptimizeImage } from '../lib/property-view';

export function PropertyGallery({
  images,
  propertyName,
}: {
  images: Array<{ url: string; altText: string; sortOrder: number }>;
  propertyName: string;
}) {
  const visible = images.filter((image) => canOptimizeImage(image.url)).slice(0, 5);

  if (visible.length === 0) {
    return (
      <div className="detail-gallery detail-gallery-empty">
        <span aria-hidden="true">🐾</span>
        <p>Property photography is not available yet.</p>
      </div>
    );
  }

  return (
    <div className="detail-gallery">
      {visible.map((image, index) => (
        <div
          className={index === 0 ? 'detail-gallery-main' : 'detail-gallery-small'}
          key={`${image.url}-${image.sortOrder}`}
        >
          <Image
            alt={image.altText || propertyName}
            fill
            priority={index === 0}
            sizes={index === 0 ? '(max-width: 760px) 100vw, 66vw' : '(max-width: 760px) 50vw, 20vw'}
            src={image.url}
          />
        </div>
      ))}
    </div>
  );
}
