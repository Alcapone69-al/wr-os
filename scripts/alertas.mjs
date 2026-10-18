// Lógica pura dos avisos (espelha avisos() de index.html). Fuso: Africa/Maputo (UTC+2, sem horário de verão).
const TZ_MS = 2 * 3600 * 1000;
const DIA = 864e5;

export const FILIAIS = { samora: "Samora Machel", mozal: "Mozal" };
export function nomeFilial(o) { return FILIAIS[o.filial] || FILIAIS.samora; }
export function diaLocal(now) { return new Date(now + TZ_MS).toISOString().slice(0, 10); }
export function horaLocal(now) { return new Date(now + TZ_MS).getUTCHours(); }
function diasEntre(a, b) { return Math.round((Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / DIA); }
function ultimo(o, k) { const h = (o.historico || []).filter((x) => x.k === k); return h.length ? h[h.length - 1].t : 0; }
function orcRef(o) { return o.orcEnviado || o.orcTs || o.criado || 0; }

export function computeAlerts(lista, now = Date.now()) {
  const td = diaLocal(now), out = [];
  for (const o of lista) {
    if (o.estado === "finalizado") continue;
    if (o.prazo) {
      const d = diasEntre(o.prazo, td);
      if (d <= 1) {
        out.push({ id: o.id, kind: d < 0 ? "late" : d === 0 ? "hoje" : "amanha", d,
          title: d < 0 ? "Entrega atrasada" : d === 0 ? "Entrega hoje" : "Entrega amanhã",
          txt: d < 0 ? `Atrasada ${-d} dia(s)` : d === 0 ? "Entrega hoje" : "Entrega amanhã", o });
      }
    }
    const l = o.lembrete;
    if (l && l.quando && !l.feito && l.quando.slice(0, 10) <= td) {
      out.push({ id: o.id, kind: "lem", d: 0, title: "Lembrete", txt: "Lembrete: " + (l.texto || "sem texto"), o });
    }
    if (o.estado === "pronta") {
      const pt = ultimo(o, "pronta");
      if (pt && now - pt >= 2 * DIA)
        out.push({ id: o.id, kind: "pronta", d: 0, title: "Viatura pronta", txt: `Pronta há ${Math.floor((now - pt) / DIA)} dias. Avise o cliente`, o });
    }
    if (!o.orcAprovado && (o.orcamento || []).length && orcRef(o) && now - orcRef(o) >= 2 * DIA)
      out.push({ id: o.id, kind: "orc", d: 0, title: "Orçamento sem resposta", txt: `Orçamento sem resposta há ${Math.floor((now - orcRef(o)) / DIA)} dias`, o });
  }
  return out.sort((a, b) => a.d - b.d);
}

// Converte alertas em mensagens (data-only, mostradas pelo service worker). Mais de 3 → resumo.
export function buildMessages(alerts, jaEnviados, now = Date.now()) {
  const td = diaLocal(now);
  const novos = alerts.filter((a) => !jaEnviados.has(`${td}_${a.kind}_${a.id}`));
  const keys = novos.map((a) => `${td}_${a.kind}_${a.id}`);
  if (!novos.length) return { msgs: [], keys };
  if (novos.length > 3)
    return { msgs: [{ title: "WR Oficina · Avisos", body: `${novos.length} viaturas precisam de atenção hoje. Abra a app para ver.`, tag: "prazos-" + td, url: "./" }], keys };
  return {
    msgs: novos.map((a) => ({ title: a.title, body: `${a.o.matricula || "—"} · ${a.o.cliente || "Sem nome"} (${nomeFilial(a.o)}) — ${a.txt}`, tag: `${td}|${a.id}|${a.kind === "late" ? "late" : a.kind}`, url: "./" })),
    keys,
  };
}
