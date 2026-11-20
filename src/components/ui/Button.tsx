import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Shared game-style button. Solid buttons sit on a darker "ledge" and press down into it
// (a transform, so it is cheap and respects reduced motion). The primary one carries a
// light sweep across its face. Every tap target is at least 48px tall.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

const base =
  "group relative isolate inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl " +
  "font-extrabold whitespace-nowrap select-none transition-[transform,box-shadow] duration-150 ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-50";

// Ledge buttons: a hard bottom shadow that collapses as the button presses down.
const ledge =
  "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-1 active:shadow-none " +
  "disabled:translate-y-0 disabled:shadow-none";

const variants: Record<ButtonVariant, string> = {
  primary: `bg-leaf-dark text-on-ink shadow-[0_5px_0_var(--color-leaf-deep)] ${ledge}`,
  secondary: `border-2 border-leaf-dark bg-paper text-leaf-dark shadow-[0_5px_0_var(--color-leaf-dark)] ${ledge}`,
  danger: `bg-pepper-ink text-on-ink shadow-[0_5px_0_var(--color-ink)] ${ledge}`,
  ghost: "text-muted underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-xl",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean; // full width
  icon?: ReactNode; // an icon from src/components/icons.tsx, never an emoji
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common> & { href: string };

export function buttonClasses({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
}: Pick<Common, "variant" | "size" | "block" | "className"> = {}) {
  return [base, variants[variant], sizes[size], block ? "w-full" : "", className].filter(Boolean).join(" ");
}

function Inner({ variant = "primary", icon, children }: Pick<Common, "variant" | "icon" | "children">) {
  return (
    <>
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 -translate-x-[120%] bg-paper/30 blur-sm motion-safe:animate-shine motion-reduce:hidden"
        />
      )}
      {icon && <span className="shrink-0 transition-transform duration-150 motion-safe:group-hover:scale-110">{icon}</span>}
      {children}
    </>
  );
}

export default function Button(props: AsButton | AsLink) {
  const { variant, size, block, icon, className, children, ...rest } = props;
  const cls = buttonClasses({ variant, size, block, className });
  if (typeof rest.href === "string") {
    return (
      <Link {...(rest as Omit<AsLink, keyof Common>)} className={cls}>
        <Inner variant={variant} icon={icon}>
          {children}
        </Inner>
      </Link>
    );
  }
  const { type = "button", ...btn } = rest as Omit<AsButton, keyof Common>;
  return (
    <button type={type} {...btn} className={cls}>
      <Inner variant={variant} icon={icon}>
        {children}
      </Inner>
    </button>
  );
}
