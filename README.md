# Mission Sync — Guide de déploiement

Application de notes de mission collaboratives avec IA.
Synchronisation temps réel entre appareils via Firebase.

## Étape 1 — Créer un projet Firebase (5 min, gratuit)

1. Allez sur https://console.firebase.google.com
2. Cliquez **"Ajouter un projet"** → nommez-le "mission-sync" → Continuer
3. Désactivez Google Analytics (pas nécessaire) → **Créer le projet**
4. Dans le menu gauche, cliquez **"Build" → "Realtime Database"**
5. Cliquez **"Créer une base de données"**
6. Choisissez **"Démarrer en mode test"** → Activer
7. Dans le menu gauche, cliquez **⚙ Paramètres du projet**
8. En bas, cliquez **"</> (Web)"** pour ajouter une app web
9. Nommez-la "mission-sync" → **Enregistrer l'app**
10. Copiez les valeurs de `firebaseConfig` — vous en aurez besoin à l'étape 3

## Étape 2 — Obtenir une clé API Anthropic

1. Allez sur https://console.anthropic.com
2. Créez un compte ou connectez-vous
3. Allez dans **API Keys** → **Create Key**
4. Copiez la clé (commence par `sk-ant-...`)

## Étape 3 — Déployer sur Vercel (5 min, gratuit)

### Option A — Via GitHub (recommandé)

1. Créez un compte sur https://github.com si pas déjà fait
2. Créez un nouveau repository, uploadez tous les fichiers de ce dossier
3. Allez sur https://vercel.com → connectez-vous avec GitHub
4. Cliquez **"Add New Project"** → importez votre repo
5. Dans **"Environment Variables"**, ajoutez :
   - `ANTHROPIC_API_KEY` = votre clé API (sk-ant-...)
   - `FIREBASE_API_KEY` = (depuis l'étape 1)
   - `FIREBASE_AUTH_DOMAIN` = (depuis l'étape 1)
   - `FIREBASE_DATABASE_URL` = (depuis l'étape 1)
   - `FIREBASE_PROJECT_ID` = (depuis l'étape 1)
6. Cliquez **Deploy**
7. Votre app est en ligne à `https://votre-projet.vercel.app`

### Option B — Via Vercel CLI

```bash
npm i -g vercel
cd mission-sync
vercel --prod
# Suivez les instructions, ajoutez les variables d'environnement dans le dashboard Vercel
```

## Étape 4 — Utiliser l'app

1. Ouvrez `https://votre-projet.vercel.app` sur vos deux téléphones
2. Entrez votre nom et choisissez Téléphone A ou B
3. Les missions se synchronisent instantanément entre les appareils !

## Étape 5 — Ajouter à l'écran d'accueil (optionnel)

- **iPhone** : Safari → Bouton partage ↑ → "Sur l'écran d'accueil"
- **Android** : Chrome → ⋮ → "Ajouter à l'écran d'accueil"

## Coûts

- **Firebase** : Gratuit jusqu'à 1 Go de données et 100 connexions simultanées
- **Vercel** : Gratuit pour usage personnel
- **Anthropic API** : ~0.01$ par note analysée (modèle Haiku)
