import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { useAuth } from "../../auth/AuthContext"
import { fromDateTimeLocal, toDateTimeLocal, withoutProtocol } from "../../lib/format"
import { isInFuture, normalizeTargetUrl, readLinkError, type LinkFieldErrors } from "../../lib/linkForm"
import type { Link } from "../../lib/types"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { TextField } from "../ui/TextField"

interface LinkChanges {
  target_url?: string
  title?: string | null
  expires_at?: string | null
}

// Edita destino, título e validade. O slug fica de fora de propósito: o link curto já pode estar espalhado
export function EditLinkForm({ link, onDone }: { link: Link; onDone: () => void }) {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState(link.target_url)
  const [title, setTitle] = useState(link.title ?? "")
  const [expiresAt, setExpiresAt] = useState(link.expires_at ? toDateTimeLocal(link.expires_at) : "")
  const [fieldErrors, setFieldErrors] = useState<LinkFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (changes: LinkChanges) => request<Link>(`/links/${link.id}`, { method: "PATCH", body: changes }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["link", link.id], updated)
      onDone()
      return queryClient.invalidateQueries({ queryKey: ["links"] })
    },
    onError: (error) => {
      const { fields, message } = readLinkError(error)
      setFieldErrors(fields)
      setFormError(message)
    },
  })

  // Manda só o que mudou (PATCH de verdade)
  function collectChanges(): LinkChanges {
    const changes: LinkChanges = {}

    const normalizedTarget = normalizeTargetUrl(target)
    if (normalizedTarget !== link.target_url) changes.target_url = normalizedTarget

    const newTitle = title.trim() || null
    if (newTitle !== link.title) changes.title = newTitle

    const currentExpiration = link.expires_at ? toDateTimeLocal(link.expires_at) : ""
    if (expiresAt !== currentExpiration) changes.expires_at = expiresAt ? fromDateTimeLocal(expiresAt) : null

    return changes
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors: LinkFieldErrors = {}
    if (!target.trim()) errors.target_url = "O destino não pode ficar vazio"
    const changes = collectChanges()
    if (changes.expires_at && !isInFuture(expiresAt)) errors.expires_at = "A validade precisa estar no futuro"

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (Object.keys(changes).length === 0) return onDone()

    save.mutate(changes)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-ink">Editar link</h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        O endereço curto continua <span className="font-mono text-[13px] text-ink-secondary">{withoutProtocol(link.short_url)}</span>.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField
          className="md:col-span-2"
          label="Endereço de destino"
          inputMode="url"
          spellCheck={false}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          error={fieldErrors.target_url}
        />
        <TextField
          label="Título"
          maxLength={120}
          placeholder="Sem título"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors.title}
        />
        <TextField
          label="Validade"
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          error={fieldErrors.expires_at}
          hint="Deixe vazio pra não expirar"
        />
      </div>

      {formError && (
        <div className="mt-4">
          <Alert>{formError}</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" loading={save.isPending}>
          Salvar
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
