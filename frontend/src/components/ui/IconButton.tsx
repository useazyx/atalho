import type { ButtonHTMLAttributes, ReactNode, Ref } from "react"

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  // Vira o aria-label e a dica ao passar o mouse (botão só com ícone precisa dizer o que faz)
  label: string
  tone?: "default" | "danger"
  ref?: Ref<HTMLButtonElement>
  children: ReactNode
}

export function IconButton({ label, tone = "default", className = "", type = "button", ...props }: IconButtonProps) {
  const toneClass = tone === "danger" ? "hover:bg-danger-bg hover:text-danger" : "hover:bg-page hover:text-ink"

  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
    />
  )
}
