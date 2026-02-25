import { getCropImagePresentation } from "../utils/cropMath";

export function ImageRenderer({
  src,
  alt,
  crop
}: {
  src: string;
  alt: string;
  crop?: Record<string, unknown> | null;
}) {
  const presentation = getCropImagePresentation(crop, { objectFit: "cover" });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        objectFit: presentation.objectFit,
        ...presentation.style
      }}
    />
  );
}

