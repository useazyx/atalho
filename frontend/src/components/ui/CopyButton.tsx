import { Check, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./Button"
import { IconButton } from "./IconButton"

interface CopyButtonProps {
  text: string
  // O que está sendo copiado, pro leitor de tela ("Copiar localhost:3337/github")
  label: string
  iconOnly?: boolean
}

// Clipboard API precisa de página segura (localhost conta); fora disso cai no jeito antigo
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const field = document.createElement("textarea")
    field.value = text
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.opacity = "0"
    document.body.append(field)
    field.select()
    document.execCommand("copy")
    field.remove()
  }
}

export function CopyButton({ text, label, iconOnly }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    await copyText(text)
    setCopied(true)
  }

  const icon = copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4" />

  return (
    <>
      {iconOnly ? (
        <IconButton label={label} onClick={handleCopy}>
          {icon}
        </IconButton>
      ) : (
        <Button variant="secondary" size="sm" icon={icon} onClick={handleCopy} aria-label={label}>
          {copied ? "Copiado" : "Copiar"}
        </Button>
      )}
      <span role="status" className="sr-only">
        {copied ? "Copiado" : ""}
      </span>
    </>
  )
}
