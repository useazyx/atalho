import { ChartNoAxesColumn, Link2, QrCode, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

const FEATURES = [
  {
    icon: <Link2 aria-hidden className="size-4" />,
    title: "Link curto com o nome que você escolher",
    text: "Ou deixa o Atalho sortear 7 caracteres. O endereço nunca muda depois de criado.",
  },
  {
    icon: <ChartNoAxesColumn aria-hidden className="size-4" />,
    title: "Cliques por dia, origem e dispositivo",
    text: "Visitante único contado sem guardar IP, e robô de preview fica fora da conta.",
  },
  {
    icon: <QrCode aria-hidden className="size-4" />,
    title: "QR code que não precisa reimprimir",
    text: "O QR aponta pro link curto: dá pra trocar o destino depois.",
  },
]

// Moldura das telas de entrar e criar conta: o formulário na frente, o que o Atalho faz do lado
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-4 py-8 sm:px-10">
        <p className="flex items-center gap-2 text-ink">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-on-primary">
            <Link2 aria-hidden className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Atalho</span>
        </p>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      <section className="hidden border-l border-border bg-surface px-12 py-10 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-ink">
            Um endereço curto que conta quem passou por ele.
          </h2>

          {/* O link demo de verdade: é isso que acontece quando alguém abre */}
          <div className="mt-8 rounded-xl border border-border bg-surface-raised p-4 font-mono text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-ink">localhost:3337/github</p>
            <p className="mt-1 text-ink-muted">
              <span aria-hidden>↳ </span>302 para github.com/useazyx
            </p>
          </div>

          <ul className="mt-8 space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-border bg-surface-raised text-ink-secondary">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex items-center gap-2 text-sm text-ink-muted">
            <ShieldCheck aria-hidden className="size-4" />
            IP nenhum é gravado: vira um hash que muda todo dia.
          </p>
        </div>
      </section>
    </div>
  )
}
