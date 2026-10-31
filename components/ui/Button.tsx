import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "inverse" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap select-none " +
  "transition-[background-color,color,border-color,transform] duration-200 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-arena-500 text-laguna-950 hover:bg-arena-600",
  secondary: "border border-laguna-800/30 text-laguna-800 hover:bg-laguna-800/5",
  inverse: "border border-crema-50/60 text-crema-50 hover:bg-crema-50/10",
  ghost: "text-laguna-800 hover:bg-laguna-800/5",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-dark",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = AsLink | AsButton;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children, fullWidth, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...anchor } = rest as AsLink;
    const external = /^https?:\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    if (external) {
      return (
        <a href={href} className={classes} rel="noopener noreferrer" target="_blank" {...anchor}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchor}>
        {children}
      </Link>
    );
  }

  const button = rest as AsButton;
  return (
    <button type="button" className={classes} {...button}>
      {children}
    </button>
  );
}
