/** React island counterpart of <Icon name="..." /> — used inside React components.
 *  Body content is sourced from a compile-time const of static SVG path strings;
 *  no user/external data is interpolated. `dangerouslySetInnerHTML` is safe here. */
import { ICONS } from "./icons";

export function Icon({
  name,
  size = 20,
  stroke = 2,
  className,
  style,
  "aria-label": ariaLabel,
}: {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}) {
  const body = ICONS[name] ?? "";
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", ...style }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      dangerouslySetInnerHTML={{
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
      }}
    />
  );
}
