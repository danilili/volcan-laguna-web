import { icons, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type Props = {
  name: IconName;
  /** Pixel size; icons are drawn on a 24 px grid with a 1.5 stroke. */
  size?: number;
  className?: string;
  /** Accessible label. Omit for decorative icons (aria-hidden). */
  title?: string;
};

export function Icon({ name, size = 24, className, title }: Props) {
  const Svg = icons[name];
  return (
    <Svg
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      title={title}
    />
  );
}

export type { IconName };
