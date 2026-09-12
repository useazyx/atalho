import { CirclePause, CirclePlay, QrCode, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import { withoutProtocol } from "../../lib/format"
import type { Link } from "../../lib/types"
import { Button } from "../ui/Button"
import { CopyButton } from "../ui/CopyButton"
import { IconButton } from "../ui/IconButton"
import { QrCodeDialog } from "./QrCodeDialog"
import { useLinkActions } from "./useLinkActions"

// Os atalhos de cada linha: copiar, QR, ligar/desligar e apagar (com confirmação ali mesmo, sem janela do navegador)
export function LinkRowActions({ link, onError }: { link: Link; onError: (message: string) => void }) {
  const { toggle, remove } = useLinkActions(link, { onError })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const closeQr = useCallback(() => setQrOpen(false), [])
  const shortLabel = withoutProtocol(link.short_url)

  if (confirmingDelete) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-secondary">Apagar o link e os cliques?</span>
        <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
          Apagar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="-mx-2 flex items-center gap-0.5 sm:mx-0">
      <CopyButton iconOnly text={link.short_url} label={`Copiar ${shortLabel}`} />
      <IconButton label={`QR code de ${shortLabel}`} onClick={() => setQrOpen(true)}>
        <QrCode aria-hidden className="size-4" />
      </IconButton>
      <IconButton
        label={`${link.active ? "Desativar" : "Ativar"} ${shortLabel}`}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {link.active ? <CirclePause aria-hidden className="size-4" /> : <CirclePlay aria-hidden className="size-4" />}
      </IconButton>
      <IconButton tone="danger" label={`Apagar ${shortLabel}`} onClick={() => setConfirmingDelete(true)}>
        <Trash2 aria-hidden className="size-4" />
      </IconButton>

      {qrOpen && <QrCodeDialog link={link} onClose={closeQr} />}
    </div>
  )
}
