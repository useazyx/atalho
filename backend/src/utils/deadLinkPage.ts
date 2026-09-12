/**
 * deadLinkPage.ts - A página que aparece quando alguém abre um link que não leva a lugar nenhum
 * # Pra que serve?
 * - Quem clica no link pelo navegador ver uma página legível, e não um JSON cru
 * - Explicar se o link não existe, foi desativado ou expirou
 * - Não usa nada que veio da requisição (então não tem como injetar HTML aqui)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

export type DeadLinkReason = "not-found" | "inactive" | "expired"

const MESSAGES: Record<DeadLinkReason, { title: string; text: string }> = {
  "not-found": {
    title: "Esse link não existe",
    text: "Confere se o endereço foi digitado certinho. Letras maiúsculas e minúsculas fazem diferença.",
  },
  inactive: {
    title: "Esse link foi desativado",
    text: "Quem criou o link desligou ele. Se você precisa do conteúdo, fala com quem te mandou.",
  },
  expired: {
    title: "Esse link expirou",
    text: "O link tinha data de validade e ela já passou. Pede um link novo pra quem te mandou.",
  },
}

export function renderDeadLinkPage(reason: DeadLinkReason): string {
  const { title, text } = MESSAGES[reason]

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · Atalho</title>
<style>
  :root { color-scheme: light dark; --bg: #f6f7f9; --card: #fff; --ink: #151a23; --muted: #5b6474; --line: #e3e6eb; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f1217; --card: #171b22; --ink: #eef1f5; --muted: #a2abb9; --line: #262c36; } }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box;
    background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 440px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 32px; }
  p.brand { margin: 0 0 20px; font-size: 13px; font-weight: 600; letter-spacing: .04em; color: var(--muted); }
  h1 { margin: 0 0 8px; font-size: 22px; line-height: 1.3; }
  p { margin: 0; color: var(--muted); }
</style>
</head>
<body>
<main>
  <p class="brand">ATALHO</p>
  <h1>${title}</h1>
  <p>${text}</p>
</main>
</body>
</html>`
}
