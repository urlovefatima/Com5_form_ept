# COM5 – Ton avis aussi compte !

Plateforme participative de la Commission des élèves de 5ᵉ année (COM5) de l'École Polytechnique de Thiès.

- **Site public** : accueil, 6 espaces (5 commissions + coordination), formulaire en 3 étapes adapté à chaque commission, plusieurs propositions par envoi, brouillon conservé sur l'appareil, anonymat possible.
- **Espace admin** (`/admin`) : connexion sécurisée, tableau de bord, consultation/filtre/recherche/tri des propositions, exports **Word (.docx)** et **PDF** par commission ou global, édition des commissions (textes, images, catégories, champs) **sans redéployer**.
- **Stack** : Next.js 15 · Postgres (Supabase) · déploiement **Vercel**.

---

## Déployer sur Vercel (≈ 15 min)

### 1. Créer la base Supabase
1. Créez un projet sur [supabase.com](https://supabase.com) (région la plus proche : `eu-west`).
2. **SQL Editor → New query** : collez le contenu de `supabase/schema.sql` → **Run**.
3. **Project Settings → Database → Connection string → onglet "Transaction pooler"** (port **6543**). Copiez l'URL et remplacez `[YOUR-PASSWORD]` par le mot de passe de la base.

> Les commissions et la liste des génies sont créées automatiquement au premier chargement du site.

### 2. Préparer les secrets admin (sur votre ordinateur)
```bash
npm install
npm run hash-password -- "UnMotDePasseLongEtSolide"   # → copie le hash affiché ($2b$12$…)
openssl rand -base64 48                                # → SESSION_SECRET
openssl rand -base64 24                                # → IP_HASH_SALT
```
(Sans `openssl` : n'importe quelle chaîne aléatoire d'au moins 32 caractères.)

### 3. Mettre le code sur GitHub puis l'importer dans Vercel
1. Poussez ce dossier sur un dépôt GitHub (le fichier `.env.local` est ignoré, c'est voulu).
2. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importez le dépôt. Framework détecté : **Next.js** (aucun réglage à changer).
3. **Environment Variables** — ajoutez :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | URL du *Transaction pooler* Supabase (port 6543) |
| `ADMIN_USERNAME` | ex. `admin.com5` |
| `ADMIN_PASSWORD_HASH` | le hash `$2b$12$…` de l'étape 2 (à coller tel quel) |
| `SESSION_SECRET` | chaîne aléatoire ≥ 32 caractères |
| `IP_HASH_SALT` | chaîne aléatoire |

4. **Deploy**. Le site est en ligne sur `https://votre-projet.vercel.app`, l'admin sur `/admin`.

Changer le mot de passe admin : régénérez un hash, remplacez `ADMIN_PASSWORD_HASH` dans Vercel → **Redeploy**.

---

## Développement local
```bash
cp .env.example .env.local   # puis remplir (DATABASE_URL peut pointer vers Supabase ou un Postgres local)
npm run db:migrate           # applique supabase/schema.sql
npm run dev                  # http://localhost:3000
```

## Sécurité
- Identifiants admin uniquement côté serveur (variables d'environnement), mot de passe **haché bcrypt**, jamais en clair.
- Session : JWT signé dans un cookie `httpOnly`, `SameSite=Strict`, `Secure` en production, 8 h. Middleware + vérification dans chaque route admin.
- Limite : 5 échecs de connexion / 15 min par adresse ; 12 envois / heure par adresse (IP hachée et salée, jamais stockée en clair).
- Anti-robots : champ piège invisible + délai minimal de remplissage.
- Validation stricte (zod) côté serveur ; catégories vérifiées contre la configuration de la commission.
- Base : RLS activé **sans aucune policy** → les clés publiques Supabase n'ont accès à rien ; seul le serveur Next.js lit et écrit.

## Images
Dans `public/images/`. Pour en changer : remplacez le fichier (même nom), ou indiquez un autre chemin / une URL `https://` dans **Admin → Commissions**.
