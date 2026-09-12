import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChartNoAxesColumn, ChevronDown, CircleCheck, QrCode, X } from "lucide-react"
import { useCallback, useState, type FormEvent } from "react"
import { Link as RouterLink } from "react-router"
import { useAuth } from "../../auth/AuthContext"
import { ALIAS_REGEX, PUBLIC_BASE_URL } from "../../lib/config"
import { fromDateTimeLocal, withoutProtocol } from "../../lib/format"
import { isInFuture, normalizeTargetUrl, readLinkError, type LinkFieldErrors } from "../../lib/linkForm"
import type { Link } from "../../lib/types"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { CopyButton } from "../ui/CopyButton"
import { IconButton } from "../ui/IconButton"
import { TextField } from "../ui/TextField"
import { QrCodeDialog } from "./QrCodeDialog"

function validate(target: string, alias: string, expiresAt: string): LinkFieldErrors {
  const errors: LinkFieldErrors = {}
  if (!target.trim()) errors.target_url = "Cola o endereço que você quer encurtar"
  if (alias && !ALIAS_REGEX.test(alias)) {
    errors.alias = "De 3 a 32 caracteres: letras minúsculas, números e hífen no meio"
  }
  if (expiresAt && !isInFuture(expiresAt)) errors.expires_at = "A validade precisa estar no futuro"
  return errors
}

// O formulário principal da página: colar, encurtar e já copiar
export function CreateLinkPanel() {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState("")
  const [alias, setAlias] = useState("")
  const [title, setTitle] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<LinkFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<Link | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const closeQr = useCallback(() => setQrOpen(false), [])

  const create = useMutation({
    mutationFn: (body: Record<string, string | undefined>) => request<Link>("/links", { method: "POST", body }),
    onSuccess: (link) => {
      setCreated(link)
      setTarget("")
      setAlias("")
      setTitle("")
      setExpiresAt("")
      return queryClient.invalidateQueries({ queryKey: ["links"] })
    },
    onError: (error) => {
      const { fields, message } = readLinkError(error)
      setFieldErrors(fields)
      setFormError(message)
      if (fields.alias || fields.title || fields.expires_at) setShowOptions(true)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setCreated(null)

    const errors = validate(target, alias, expiresAt)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      if (errors.alias || errors.expires_at) setShowOptions(true)
      return
    }

    create.mutate({
      target_url: normalizeTargetUrl(target),
      alias: alias || undefined,
      title: title.trim() || undefined,
      expires_at: expiresAt ? fromDateTimeLocal(expiresAt) : undefined,
    })
  }

  return (
    <section
      aria-label="Novo link"
      className="rounded-2xl border border-border bg-surface-raised p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-28px_rgba(0,0,0,0.35)] sm:p-5"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <TextField
            className="flex-1"
            label="Endereço de destino"
            placeholder="https://seusite.com/uma/pagina/bem/comprida"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            error={fieldErrors.target_url}
          />
          <Button type="submit" loading={create.isPending} className="sm:mt-[26px] sm:w-32">
            Encurtar
          </Button>
        </div>

        <button
          type="button"
          aria-expanded={showOptions}
          aria-controls="new-link-options"
          onClick={() => setShowOptions((open) => !open)}
          className="mt-3 inline-flex items-center gap-1 rounded-md text-sm font-medium text-ink-secondary hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
        >
          <ChevronDown aria-hidden className={`size-4 transition-transform ${showOptions ? "rotate-180" : ""}`} />
          Apelido, título e validade
        </button>

        {showOptions && (
          <div id="new-link-options" className="mt-3 grid gap-3 md:grid-cols-3">
            <TextField
              label="Apelido (opcional)"
              prefix={`${withoutProtocol(PUBLIC_BASE_URL)}/`}
              placeholder="black-friday"
              autoComplete="off"
              spellCheck={false}
              value={alias}
              onChange={(event) => setAlias(event.target.value.toLowerCase())}
              error={fieldErrors.alias}
              hint="Sem apelido, o Atalho sorteia 7 caracteres"
            />
            <TextField
              label="Título (opcional)"
              placeholder="Campanha de setembro"
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={fieldErrors.title}
            />
            <TextField
              label="Validade (opcional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              error={fieldErrors.expires_at}
              hint="Depois disso o link responde que expirou"
            />
          </div>
        )}

        {formError && (
          <div className="mt-4">
            <Alert>{formError}</Alert>
          </div>
        )}
      </form>

      {created && (
        <div role="status" className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
            <p className="min-w-0 text-sm text-ink-secondary">
              Link criado:{" "}
              <span className="font-mono text-[15px] font-medium break-all text-ink">{withoutProtocol(created.short_url)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={created.short_url} label={`Copiar ${withoutProtocol(created.short_url)}`} />
            <Button variant="secondary" size="sm" icon={<QrCode aria-hidden className="size-4" />} onClick={() => setQrOpen(true)}>
              QR code
            </Button>
            <RouterLink
              to={`/links/${created.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-link hover:underline"
            >
              <ChartNoAxesColumn aria-hidden className="size-4" />
              Estatísticas
            </RouterLink>
            <IconButton label="Fechar aviso" onClick={() => setCreated(null)}>
              <X aria-hidden className="size-4" />
            </IconButton>
          </div>
        </div>
      )}

      {qrOpen && created && <QrCodeDialog link={created} onClose={closeQr} />}
    </section>
  )
}
