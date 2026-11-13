import { cn } from "@/lib/utils";

/** Visual padrão de campo, reaproveitado por seletores que não são <input> (ex.: SeletorOpcoes). */
export const FIELD =
  "w-full rounded-xl border border-areia bg-palha-50 px-4 py-3 text-[15px] text-tinta placeholder:text-argila transition-colors focus:border-musgo focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-broto/60 aria-[invalid=true]:border-erro";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(FIELD, "appearance-none", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-tinta", className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-erro">{children}</p>;
}
