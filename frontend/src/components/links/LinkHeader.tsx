import { ArrowUpRight, CirclePause, CirclePlay, Pencil, QrCode, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import { formatDate, formatDateTime, hostOf, withoutProtocol } from "../../lib/format"
import type { Link } from "../../lib/types"
import { Button } from "../ui/Button"
import { CopyButton } from "../ui/CopyButton"
import { EditLinkForm } from "./EditLinkForm"
import { LinkStatusBadge } from "./LinkStatusBadge"
import { QrCodeDialog } from "./QrCodeDialog"
import { useLinkActions } from "./useLinkActions"

interface LinkHeaderProps {
  link: Link
  onError: (message: string) => void
  onDeleted: () => void
}

// Topo do detalhe: o que é o link, pra onde leva e tudo que dá pra fazer com ele
export function LinkHeader({ link, onError, onDeleted }: LinkHeaderProps) {
  const { toggle, remove } = useLinkActions(link, { onError, onDeleted })
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const closeQr = useCallback(() => setQrOpen(false), [])
  const shortLabel = withoutProtocol(link.short_url)

  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words text-ink">
          {link.title ?? hostOf(link.target_url)}
        </h1>
        <LinkStatusBadge status={link.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="min-w-0 font-mono text-lg break-all text-ink">{shortLabel}</p>
        <CopyButton text={link.short_url} label={`Copiar ${shortLabel}`} />
        <Button variant="secondary" size="sm" icon={<QrCode aria-hidden className="size-4" />} onClick={() => setQrOpen(true)}>
          QR code
        </Button>
      </div>

      <p className="mt-2 text-sm break-all text-ink-muted">
        Leva para{" "}
        <a href={link.target_url} target="_blank" rel="noreferrer" className="text-link hover:underline">
          {withoutProtocol(link.target_url)}
          <ArrowUpRight aria-hidden className="ml-0.5 inline size-3.5 align-[-2px]" />
        </a>
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        Criado em {formatDate(link.created_at)}
        {link.expires_at && ` · ${link.status === "expired" ? "Expirou" : "Expira"} em ${formatDateTime(link.expires_at)}`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Pencil aria-hidden className="size-4" />}
          aria-expanded={editing}
          onClick={() => setEditing((open) => !open)}
        >
          Editar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={link.active ? <CirclePause aria-hidden className="size-4" /> : <CirclePlay aria-hidden className="size-4" />}
          loading={toggle.isPending}
          onClick={() => toggle.mutate()}
        >
          {link.active ? "Desativar" : "Ativar"}
        </Button>

        {confirmingDelete ? (
          <span className="inline-flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-secondary">Apagar o link e todas as estatísticas?</span>
            <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
              Apagar de vez
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </span>
        ) : (
          <Button variant="danger" size="sm" icon={<Trash2 aria-hidden className="size-4" />} onClick={() => setConfirmingDelete(true)}>
            Apagar
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-4">
          <EditLinkForm link={link} onDone={() => setEditing(false)} />
        </div>
      )}

      {qrOpen && <QrCodeDialog link={link} onClose={closeQr} />}
    </header>
  )
}
