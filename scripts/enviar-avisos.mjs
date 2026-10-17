// Envia os avisos de prazo por push (FCM) para os aparelhos registados em /dispositivos.
// Corre no GitHub Actions. Precisa do segredo FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço).
import admin from "firebase-admin";
import { computeAlerts, buildMessages, diaLocal, horaLocal } from "./alertas.mjs";

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
const devs = devSnap.docs.map((d) => ({ ref: d.ref, token: d.data().token })).filter((d) => d.token);
const alerts = computeAlerts(lista, now);
console.log(`${lista.length} O.S., ${alerts.length} avisos, ${devs.length} aparelhos.`);
if (!alerts.length || !devs.length) process.exit(0);

const td = diaLocal(now);
const sentSnap = await db.collection("avisos_enviados").where("dia", "==", td).get();
const enviados = new Set(sentSnap.docs.map((d) => d.data().chave));
const { msgs, keys } = buildMessages(alerts, enviados, now);
if (!msgs.length) { console.log("Tudo já enviado hoje."); process.exit(0); }

let okTotal = 0;
for (const m of msgs) {
  const res = await admin.messaging().sendEachForMulticast({
    tokens: devs.map((d) => d.token),
    data: { title: m.title, body: m.body, tag: m.tag, url: m.url },
    webpush: { headers: { Urgency: "high", TTL: "43200" } },
  });
  okTotal += res.successCount;
  await Promise.all(res.responses.map(async (r, i) => {
    const c = r.error && r.error.code;
    if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token") {
      console.log("A remover aparelho inválido.");
      await devs[i].ref.delete();
    } else if (r.error) console.warn("Falha:", c);
  }));
}
if (okTotal > 0) {
  const batch = db.batch();
  for (const k of keys) batch.set(db.collection("avisos_enviados").doc(k), { dia: td, chave: k, t: now });
  await batch.commit();
}
console.log(`Enviadas ${msgs.length} mensagem(ns); ${okTotal} entregas aceites.`);
