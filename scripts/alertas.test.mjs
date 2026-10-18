import assert from "node:assert/strict";
import { computeAlerts, buildMessages, diaLocal, horaLocal } from "./alertas.mjs";

const now = Date.parse("2026-10-17T08:00:00Z"); // 10:00 em Maputo
assert.equal(diaLocal(now), "2026-10-17");
assert.equal(horaLocal(now), 10);
assert.equal(diaLocal(Date.parse("2026-10-17T23:30:00Z")), "2026-10-18"); // já é dia seguinte em Maputo

const D = 864e5;
const os = [
  { id: "a", estado: "andamento", prazo: "2026-10-15", matricula: "AAA", cliente: "Ana" },
  { id: "b", estado: "pendente", prazo: "2026-10-17", matricula: "BBB", cliente: "Beto" },
  { id: "c", estado: "pendente", prazo: "2026-10-18" },
  { id: "d", estado: "pendente", prazo: "2026-10-25" },
  { id: "e", estado: "finalizado", prazo: "2026-10-01" },
  { id: "f", estado: "pronta", historico: [{ k: "pronta", t: now - 3 * D }], matricula: "FFF", cliente: "Fa" },
  { id: "g", estado: "pronta", historico: [{ k: "pronta", t: now - 1 * D }] },
  { id: "h", estado: "orcamento", orcamento: [{ desc: "x", qtd: 1, preco: 5 }], orcTs: now - 3 * D },
  { id: "i", estado: "orcamento", orcamento: [{ desc: "x", qtd: 1, preco: 5 }], orcTs: now - 3 * D, orcAprovado: true },
  { id: "j", estado: "pendente", lembrete: { quando: "2026-10-17T07:00", texto: "Ligar", feito: false } },
  { id: "k", estado: "pendente", lembrete: { quando: "2026-10-20T07:00", texto: "Ligar" } },
];
const al = computeAlerts(os, now);
const ks = al.map((a) => a.kind + ":" + a.id).sort();
assert.deepEqual(ks, ["amanha:c", "hoje:b", "late:a", "lem:j", "orc:h", "pronta:f"]);

let r = buildMessages(al, new Set(), now);
assert.equal(r.msgs.length, 1); // 6 > 3 → resumo
assert.match(r.msgs[0].body, /6 viaturas/);
r = buildMessages(al, new Set(r.keys), now);
assert.equal(r.msgs.length, 0); // já enviados
const dois = computeAlerts(os.slice(0, 2), now);
r = buildMessages(dois, new Set(), now);
assert.equal(r.msgs.length, 2);
assert.equal(r.msgs[0].tag, "2026-10-17|a|late");
assert.match(r.msgs[0].body, /AAA · Ana \(Samora Machel\) — Atrasada 2 dia/);
const moz = computeAlerts([{ id: "m", estado: "pendente", prazo: "2026-10-17", filial: "mozal", matricula: "MMM", cliente: "Mo" }], now);
assert.match(buildMessages(moz, new Set(), now).msgs[0].body, /\(Mozal\)/);
console.log("alertas.test.mjs OK");
