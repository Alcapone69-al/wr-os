# Ligar a nuvem (Firebase) — conta única da oficina

Custo: 0 (plano gratuito Spark, sem cartão). Faça com a conta Google da oficina.

1. Entre em https://console.firebase.google.com → **Criar projeto** (nome: `wr-oficina`). Desative o Google Analytics.
2. **Build → Authentication → Começar → Email/palavra-passe → Ativar.** Em **Utilizadores → Adicionar utilizador**, crie o e-mail e a palavra-passe da oficina (é a conta única, usada no tablet e no computador).
3. **Build → Firestore Database → Criar base de dados** → modo de produção. Região: `africa-south1` (Joanesburgo) se existir, senão `europe-west`. A região não se muda depois.
4. Em Firestore → **Regras**, apague o conteúdo, cole o ficheiro `firestore.rules` e carregue em **Publicar**.
5. **Definições do projeto (roda dentada) → As suas apps → Web (</>)** → registe a app (sem Hosting). Copie o bloco `firebaseConfig`.
6. Abra `firebase-config.js` e cole os valores (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Guarde e publique.
7. Abra o endereço da aplicação no tablet e no computador, entre com o e-mail e a palavra-passe da oficina. Os dados passam a ser os mesmos nos dois.
   No tablet/telemóvel: "Adicionar ao ecrã principal".

Notas
- Funciona sem internet: guarda no aparelho e sincroniza quando a ligação volta.
- A chave `apiKey` é pública por desenho. A segurança está nas regras (passo 4): só quem entra com a conta lê e escreve.
- Espaço gratuito: 1 GiB de dados (as fotos são o que mais ocupa). Veja o uso em Firestore → Utilização.
- Se o espaço esgotar: apagar fotos de carros antigos, ou passar ao plano pago do Firebase (custo na conta de quem a criou).
