// Envia os avisos de prazo por push (FCM) para os aparelhos registados em /dispositivos.
// Corre no GitHub Actions. Precisa do segredo FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço).
import admin from "firebase-admin";
import { alertasPara, buildMessages, diaLocal, horaLocal } from "./alertas.mjs";

const FORCAR = process.env.FORCAR === "1";
const now = Date.now();
const h = horaLocal(now);
if (!FORCAR && (h < 7 || h >= 18)) { console.log(`Fora do horário de envio (${h}h em Maputo). Nada a fazer.`); process.exit(0); }

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error("Falta o segredo FIREBASE_SERVICE_ACCOUNT."); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();

const [osSnap, devSnap] = await Promise.all([db.collection("os").get(), db.collection("dispositivos").get()]);
const lista = osSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
const devs = devSnap.docs.map((d) => ({ ref: d.ref, token: d.data().token, filial: d.data().filial || "" })).filter((d) => d.token);
console.log(`${lista.length} O.S., ${devs.length} aparelhos.`);
if (!devs.length) process.exit(0);

const td = diaLocal(now);
const sentSnap = await db.collection("avisos_enviados").where("dia", "==", td).get();
const enviados = new Set(sentSnap.docs.map((d) => d.data().chave));

// Cada grupo de aparelhos recebe só o que lhe diz respeito: o dono ("") vê tudo; um utilizador de oficina só a sua.
let totalMsgs = 0, okTotal = 0;
for (const g of [...new Set(devs.map((d) => d.filial))]) {
  const grupo = devs.filter((d) => d.filial === g);
  const alerts = alertasPara(lista, g, now);
  const { msgs, keys } = buildMessages(alerts, enviados, now, g ? "@" + g : "");
  console.log(`Grupo "${g || "dono"}": ${alerts.length} avisos, ${msgs.length} por enviar, ${grupo.length} aparelhos.`);
  if (!msgs.length) continue;
  let okGrupo = 0;
  for (const m of msgs) {
    const res = await admin.messaging().sendEachForMulticast({
      tokens: grupo.map((d) => d.token),
      data: { title: m.title, body: m.body, tag: m.tag, url: m.url },
      webpush: { headers: { Urgency: "high", TTL: "43200" } },
    });
    okGrupo += res.successCount;
    await Promise.all(res.responses.map(async (r, i) => {
      const c = r.error && r.error.code;
      if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token") {
        console.log("A remover aparelho inválido.");
        await grupo[i].ref.delete();
      } else if (r.error) console.warn("Falha:", c);
    }));
  }
  totalMsgs += msgs.length; okTotal += okGrupo;
  if (okGrupo > 0) {
    const batch = db.batch();
    for (const k of keys) batch.set(db.collection("avisos_enviados").doc(k), { dia: td, chave: k, t: now });
    await batch.commit();
  }
}
console.log(`Enviadas ${totalMsgs} mensagem(ns); ${okTotal} entregas aceites.`);
