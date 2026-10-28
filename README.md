# WR OS

Sistema de gestão de ordens de serviço da WR Auto Body (Matola, Moçambique). App instalável (PWA) com a nuvem no Firebase da oficina (projeto `wr-oficina`).

## Duas oficinas (Samora Machel e Mozal)

A mesma app e a mesma base de dados servem as duas oficinas. Cada O.S. e cada peça de estoque pertence a uma oficina (campo "Oficina"). No topo, toque no nome da oficina para ver **Samora Machel**, **Mozal** ou **Todas**: painéis, listas, estoque, avisos e relatórios mostram só a oficina escolhida. Os dados antigos ficam na Samora Machel. A morada de cada oficina (usada nos PDFs e nas mensagens de WhatsApp) está em `FILIAIS` no `index.html`.

## Fases do trabalho

Em cada O.S. há a secção **Fases do trabalho** (bate-chapa, preparação para pintura, pintura, polimento, lavagem; "Criar as 5 fases da pintura" cria-as de uma vez, e "+ Fase" junta outras). Cada fase tem o seu prazo e marca-se como concluída. Quando o prazo de uma fase termina **amanhã**, **hoje** ou está **atrasado**, chega uma notificação (todos os dias até a fase ser concluída), à app aberta e, com o robô, também com a app fechada. Os utilizadores de oficina recebem os das suas viaturas.

## Material de pintura

O estoque tem dois separadores: **Peças** e **Material de pintura** (tinta, verniz, massa de ferro, betume, lixas, fita, etc., cada um com a sua unidade: L, kg, rolo, folha...). Em "Estoque › Material de pintura › Criar a lista base de pintura" cria-se de uma vez a lista típica. Em cada O.S. há a secção **Material de pintura**: junta-se o material (do estoque, com quantidade) e marca-se o que já foi **usado**; ao marcar, o estoque desce sozinho (e volta se desmarcar ou remover). O custo do material usado entra na margem.

## Utilizadores por oficina

Além da conta do dono (`wrautobodyapp@gmail.com`, vê tudo), há utilizadores da função **Oficina**: cada um vê só as viaturas e os serviços de UMA oficina (Samora Machel ou Mozal), sem valores, clientes nem relatórios.

1. Entre com a conta do dono › toque na letra do canto › **Utilizadores das oficinas** › **+ Utilizador** (nome, utilizador, por exemplo `mozal` ou `n4`, e oficina).
2. No Firebase Console › Authentication › Users › **Add user**, crie a conta com o e-mail `utilizador@wr-oficina.mz` (por exemplo `mozal@wr-oficina.mz`) e uma palavra-passe. Esse e-mail é só um nome interno: não precisa de existir. O supervisor entra na app escrevendo apenas o utilizador (`mozal`) e a palavra-passe.
3. Publique as regras de `firestore.rules` (Firestore › Regras). Sem elas, a restrição por oficina só existe na interface.

Quem não está na lista (e não é o dono) não entra. Para suspender, desmarque "Acesso ativo". As regras limitam cada utilizador à sua oficina também no servidor (O.S., estoque e fotos). Os registos antigos sem oficina recebem `samora` automaticamente quando o dono abre a app.

## Avisos com a app fechada (push)

A app avisa prazos mesmo fechada: um robô gratuito do GitHub (Actions) corre de hora em hora, das 07h às 18h (Maputo), vê as O.S. na base de dados e envia push para os aparelhos registados.

Avisa: entrega atrasada / hoje / amanhã, lembretes vencidos, viatura pronta há 2+ dias sem levantar, orçamento sem resposta há 2+ dias. Cada aviso é enviado uma vez por dia. Os utilizadores de oficina só recebem os avisos da sua oficina, nunca os de orçamento. Mais de 3 avisos juntam-se numa só notificação.

### Configuração (uma vez)

1. **Chave VAPID**: Firebase Console → Definições do projeto → *Cloud Messaging* → *Certificados Web Push* → *Gerar par de chaves*. Copie a chave pública para `window.WR_VAPID_KEY` em `firebase-config.js`.
2. **Conta de serviço**: Firebase Console → Definições do projeto → *Contas de serviço* → *Gerar nova chave privada*. No GitHub: *Settings → Secrets and variables → Actions → New repository secret*, nome `FIREBASE_SERVICE_ACCOUNT`, valor = o conteúdo completo do ficheiro JSON. **Nunca** coloque este ficheiro no repositório.
3. **Regras da base de dados**: Firebase Console → Firestore → *Regras*: cole o conteúdo de `firestore.rules` e publique.
4. **API Cloud Messaging**: se pedido, ative a *Firebase Cloud Messaging API* no Google Cloud do projeto.
5. **Em cada aparelho** (tablet, PC do escritório): abra a app, entre, toque no sino → *Ativar notificações* e aceite. No iPhone/iPad: primeiro *Partilhar → Adicionar ao ecrã inicial* (iOS 16.4+), abra a app instalada e só depois ative.

### Testar

- GitHub → *Actions → Avisos push → Run workflow* (com `forcar = 1` para ignorar o horário).
- Lógica dos avisos: `npm test`.

### Limites

- O GitHub pode atrasar o agendamento alguns minutos; não é por segundos.
- O push depende do browser/sistema do aparelho estar autorizado a receber notificações.

## Pausa do serviço

Interruptor para suspender o app (por exemplo, mensalidade em atraso). Controlado só pela YFX, na consola do Firebase.

- **Pausar:** Firestore › coleção `config` › documento `estado` (criar se não existir) com o campo `pausado` (boolean) = `true`. Opcional: `mensagem` (texto) para mostrar aos utilizadores.
- **Retomar:** pôr `pausado` = `false` (ou apagar o documento).
- **Efeito:** todos os aparelhos online passam a mostrar "Em pausa" com o botão "Falar com a YFX"; as regras do Firestore bloqueiam a leitura e a escrita de dados (O.S., estoque, fotos) a todas as contas, incluindo o proprietário; o robô de avisos deixa de enviar notificações.
- **Limite:** um aparelho sem internet continua a mostrar a cópia guardada, mas não sincroniza. Ao voltar online fica em pausa.
- **Regras:** o interruptor só é imposto depois de publicar o `firestore.rules` atualizado.
