import { useQuery } from "@tanstack/react-query"
import { Download, LoaderCircle, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { useAuth } from "../../auth/AuthContext"
import { errorMessage } from "../../lib/api"
import { withoutProtocol } from "../../lib/format"
import type { Link } from "../../lib/types"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { IconButton } from "../ui/IconButton"

type QrFormat = "png" | "svg"

interface QrCodeDialogProps {
  link: Pick<Link, "id" | "slug" | "short_url">
  onClose: () => void
}

// A imagem vem da API com token, então não dá pra usar a URL direto no <img>: vira blob e URL local
function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) return
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  return url
}

export function QrCodeDialog({ link, onClose }: QrCodeDialogProps) {
  const { requestBlob } = useAuth()
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)
  const [downloading, setDownloading] = useState<QrFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  // O slug nunca muda, então o QR de um link também não: pode ficar no cache pra sempre
  const svg = useQuery({
    queryKey: ["qr", link.id],
    queryFn: () => requestBlob(`/links/${link.id}/qr`),
    staleTime: Infinity,
  })
  const imageUrl = useObjectUrl(svg.data)

  // Abriu: foco no fechar; Esc fecha
  useEffect(() => {
    closeButton.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  async function download(format: QrFormat) {
    setError(null)
    setDownloading(format)
    try {
      // PNG em 1024px, que dá pra imprimir sem serrilhar
      const blob =
        format === "png" ? await requestBlob(`/links/${link.id}/qr`, { query: { format: "png", size: 1024 } }) : svg.data
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `atalho-${link.slug}.${format}`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              QR code
            </h2>
            <p className="mt-0.5 truncate font-mono text-[13px] text-ink-secondary">{withoutProtocol(link.short_url)}</p>
          </div>
          <IconButton ref={closeButton} label="Fechar" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </IconButton>
        </div>

        {/* Fundo sempre branco, até no tema escuro: leitor de QR precisa de código escuro no claro */}
        <div className="mt-4 grid aspect-square place-items-center rounded-xl bg-white p-2 ring-1 ring-border">
          {imageUrl ? (
            <img src={imageUrl} alt={`QR code de ${withoutProtocol(link.short_url)}`} className="size-full" />
          ) : svg.isError ? (
            <p className="px-4 text-center text-sm text-danger">{svg.error.message}</p>
          ) : (
            <LoaderCircle aria-label="Gerando QR code" className="size-6 animate-spin text-ink-muted" />
          )}
        </div>

        <p className="mt-3 text-sm text-ink-muted">
          Aponta pro link curto, então trocar o destino depois não muda o QR já impresso.
        </p>

        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            icon={<Download aria-hidden className="size-4" />}
            loading={downloading === "png"}
            onClick={() => download("png")}
          >
            Baixar PNG
          </Button>
          <Button
            variant="secondary"
            icon={<Download aria-hidden className="size-4" />}
            loading={downloading === "svg"}
            disabled={!svg.data}
            onClick={() => download("svg")}
          >
            Baixar SVG
          </Button>
        </div>
      </div>
    </div>
  )
}
