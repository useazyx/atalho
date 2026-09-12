import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../auth/AuthContext"
import type { Link } from "../../lib/types"

interface LinkActionsOptions {
  onError: (message: string) => void
  // A tela de detalhe precisa sair da página quando o link some
  onDeleted?: () => void
}

// Ligar/desligar e apagar um link, atualizando a lista e o detalhe que estiverem no cache
export function useLinkActions(link: Link, { onError, onDeleted }: LinkActionsOptions) {
  const { request } = useAuth()
  const queryClient = useQueryClient()

  const toggle = useMutation({
    mutationFn: () => request<Link>(`/links/${link.id}`, { method: "PATCH", body: { active: !link.active } }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["link", link.id], updated)
      return queryClient.invalidateQueries({ queryKey: ["links"] })
    },
    onError: (error) => onError(error.message),
  })

  const remove = useMutation({
    mutationFn: () => request<void>(`/links/${link.id}`, { method: "DELETE" }),
    onSuccess: () => {
      onDeleted?.()
      // Sem refetch do link apagado (ia dar 404 à toa): só tira do cache
      queryClient.removeQueries({ queryKey: ["link", link.id] })
      queryClient.removeQueries({ queryKey: ["stats", link.id] })
      return queryClient.invalidateQueries({ queryKey: ["links"] })
    },
    onError: (error) => onError(error.message),
  })

  return { toggle, remove }
}
