import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders an MDX body string from `content/`. Links use next/link for
 * internal hrefs; images go through next/image when they live in /images.
 */

const components = {
  a: ({ href = "", children, ...rest }: ComponentProps<"a">) => {
    const internal = href.startsWith("/") && !href.startsWith("//");
    if (internal) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
  img: ({ src, alt = "" }: ComponentProps<"img">) => {
    if (typeof src === "string" && src.startsWith("/images/")) {
      return (
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1280}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="rounded-card"
        />
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === "string" ? src : undefined} alt={alt} />;
  },
};

export type MdxOverrides = ComponentProps<typeof MDXRemote>["components"];

export function Mdx({ source, className, overrides }: { source: string; className?: string; overrides?: MdxOverrides }) {
  if (!source.trim()) return null;
  return (
    <div className={cn("prose-vl", className)}>
      <MDXRemote source={source} components={{ ...components, ...overrides }} />
    </div>
  );
}
