// Onde os links curtos respondem (o mesmo PUBLIC_BASE_URL do backend).
// O front só usa pra mostrar o começo do endereço no campo de apelido, antes de existir algum link.
export const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL ?? "http://localhost:3337").replace(/\/+$/, "")

// Mesma regra de apelido do backend: 3 a 32 caracteres, minúsculo, número e hífen só no meio
export const ALIAS_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/
