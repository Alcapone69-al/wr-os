# WR OS

Sistema de gestão de ordens de serviço da WR Auto Body (Matola, Moçambique). App instalável (PWA) com a nuvem no Firebase da oficina (projeto `wr-oficina`).

## Duas oficinas (Samora Machel e Mozal)

A mesma app e a mesma base de dados servem as duas oficinas. Cada O.S. e cada peça de estoque pertence a uma oficina (campo "Oficina"). No topo, toque no nome da oficina para ver **Samora Machel**, **Mozal** ou **Todas**: painéis, listas, estoque, avisos e relatórios mostram só a oficina escolhida. Os dados antigos ficam na Samora Machel. A morada de cada oficina (usada nos PDFs e nas mensagens de WhatsApp) está em `FILIAIS` no `index.html`.

## Avisos com a app fechada (push)

A app avisa prazos mesmo fechada: um robô gratuito do GitHub (Actions) corre de hora em hora, das 07h às 18h (Maputo), vê as O.S. na base de dados e envia push para os aparelhos registados.

Avisa: entrega atrasada / hoje / amanhã, lembretes vencidos, viatura pronta há 2+ dias sem levantar, orçamento sem resposta há 2+ dias. Cada aviso é enviado uma vez por dia. Mais de 3 avisos juntam-se numa só notificação.

### Configuração (uma vez)

1. **Chave VAPID**: Firebase Console → Definições do projeto → *Cloud Messaging* → *Certificados Web Push* → *Gerar par de chaves*. Copie a chave pública para `window.WR_VAPID_KEY` em `firebase-config.js`.
2. **Conta de serviço**: Firebase Console → Definições do projeto → *Contas de serviço* → *Gerar nova chave privada*. No GitHub: *Settings → Secrets and variables → Actions → New repository secret*, nome `FIREBASE_SERVICE_ACCOUNT`, valor = o conteúdo completo do ficheiro JSON. **Nunca** coloque este ficheiro no repositório.
3. **Regras da base de dados**: já publicadas no projeto (só a conta da oficina lê e escreve). O ficheiro `firestore.rules` neste repositório é uma cópia do que está em produção, para referência — não é preciso colar nada.
4. **API Cloud Messaging**: se pedido, ative a *Firebase Cloud Messaging API* no Google Cloud do projeto.
5. **Em cada aparelho** (tablet, PC do escritório): abra a app, entre, toque no sino → *Ativar notificações* e aceite. No iPhone/iPad: primeiro *Partilhar → Adicionar ao ecrã inicial* (iOS 16.4+), abra a app instalada e só depois ative.

### Testar

- GitHub → *Actions → Avisos push → Run workflow* (com `forcar = 1` para ignorar o horário).
- Lógica dos avisos: `npm test`.

### Limites

- O GitHub pode atrasar o agendamento alguns minutos; não é por segundos.
- O push depende do browser/sistema do aparelho estar autorizado a receber notificações.
