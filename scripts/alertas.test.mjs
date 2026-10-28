import assert from "node:assert/strict";
import { computeAlerts, alertasPara, buildMessages, diaLocal, horaLocal } from "./alertas.mjs";

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
// por oficina: o utilizador da Mozal só recebe avisos da Mozal e nunca de orçamentos
const mix = [
  { id: "s1", estado: "pendente", prazo: "2026-10-17", matricula: "SSS" },
  { id: "m1", estado: "pendente", prazo: "2026-10-17", filial: "mozal", matricula: "MMM" },
  { id: "m2", estado: "orcamento", filial: "mozal", orcamento: [{ desc: "x", qtd: 1, preco: 5 }], orcTs: now - 3 * D },
];
assert.deepEqual(alertasPara(mix, "", now).map((a) => a.id).sort(), ["m1", "m2", "s1"]);
assert.deepEqual(alertasPara(mix, "mozal", now).map((a) => a.id), ["m1"]);
assert.deepEqual(alertasPara(mix, "samora", now).map((a) => a.id), ["s1"]);
const k1 = buildMessages(alertasPara(mix, "mozal", now), new Set(), now, "@mozal").keys;
assert.equal(k1[0], "2026-10-17_hoje_m1@mozal");
assert.equal(buildMessages(alertasPara(mix, "", now), new Set(k1), now).msgs.length > 0, true); // chaves do dono são independentes
// fases: cada fase tem o seu prazo e o seu aviso
const fz = [{ id: "z", estado: "chapa", matricula: "ZZZ", cliente: "Zé", filial: "mozal", prazo: "2026-11-30", fases: [
  { id: "f1", nome: "Bate-chapa", prazo: "2026-10-17" },
  { id: "f2", nome: "Preparação para pintura", prazo: "2026-10-18" },
  { id: "f3", nome: "Pintura", prazo: "2026-10-20" },
  { id: "f4", nome: "Polimento", prazo: "2026-10-10", feito: true },
  { id: "f5", nome: "Lavagem", prazo: "" } ] }];
const fa = computeAlerts(fz, now);
assert.deepEqual(fa.map((a) => a.kind + ":" + a.fid), ["fase_hoje:f1", "fase_amanha:f2"]);
const fm = buildMessages(fa, new Set(), now);
assert.equal(fm.msgs.length, 2);
assert.equal(fm.msgs[0].title, "Fase termina hoje");
assert.match(fm.msgs[0].body, /ZZZ · Zé \(Mozal\) — Bate-chapa — termina hoje/);
assert.equal(fm.keys[0], "2026-10-17_fase_hoje_z.f1");
assert.equal(buildMessages(fa, new Set(fm.keys), now).msgs.length, 0);
assert.equal(alertasPara(fz, "samora", now).length, 0);
assert.equal(alertasPara(fz, "mozal", now).length, 2);
console.log("alertas.test.mjs OK");
