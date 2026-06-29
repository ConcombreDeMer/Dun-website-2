# Dun Website

Projet web independant pour le site marketing / vitrine de Dun.

## Stack

- React
- TypeScript
- Vite
- Supabase JS
- Supabase Edge Functions
- Cloudflare Turnstile pour la protection anti-spam du formulaire beta

## Installation

```bash
cd website
npm install
```

## Developpement

```bash
npm run dev
```

Le site sera disponible sur l'URL affichee par Vite, generalement `http://localhost:5173`.

## Build

```bash
npm run build
```

## Preview du build

```bash
npm run preview
```

## Configuration Supabase

Copier `.env.example` vers `.env.local`, puis renseigner les variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TURNSTILE_SITE_KEY=
```

`VITE_TURNSTILE_SITE_KEY` correspond a la cle publique du widget Cloudflare Turnstile.

## Configuration Supabase pour la beta

Le formulaire de l'etat 7 n'insere pas directement dans la table depuis le navigateur. Il appelle l'Edge Function `beta-signup`, qui verifie Turnstile, applique un rate limit, puis ecrit dans `public."Beta"` avec la cle serveur.

### 1. Base de donnees

Dans le SQL Editor Supabase, executer le contenu de:

```bash
website/supabase/sql/beta_security.sql
```

Ce script cree ou securise:

- `public."Beta"` avec `email` et `created_at`
- un index unique sur `lower(email)` pour eviter les doublons
- RLS activee et aucun acces direct pour `anon` / `authenticated`
- `public.beta_rate_limits` pour limiter les tentatives par IP et par email
- la fonction SQL `public.consume_beta_rate_limit(...)`, appelee uniquement par l'Edge Function

### 2. Cloudflare Turnstile

Creer un widget Turnstile dans Cloudflare, ajouter les domaines autorises, puis recuperer:

- la site key publique, a mettre dans `VITE_TURNSTILE_SITE_KEY`
- la secret key, a mettre dans les secrets Supabase sous `TURNSTILE_SECRET_KEY`

Pour le developpement local, ajouter aussi `localhost` dans les domaines autorises du widget.

### 3. Secrets Supabase

Dans Supabase, ajouter le secret Turnstile. Avec le CLI:

```bash
supabase secrets set TURNSTILE_SECRET_KEY=ta_secret_key_turnstile --project-ref ton_project_ref
```

La fonction utilise aussi `SUPABASE_URL` et une cle serveur. Supabase fournit ces variables aux Edge Functions; si ton projet utilise encore les noms legacy, verifie que `SUPABASE_SERVICE_ROLE_KEY` est bien disponible dans les secrets de fonction.

### 4. Deploiement de l'Edge Function

Depuis `website/`:

```bash
supabase functions deploy beta-signup --project-ref ton_project_ref
```

Une fois deployee, le front appelle:

```ts
supabase.functions.invoke('beta-signup', {
  body: { email, turnstileToken },
});
```

### 5. Limites actuelles

- 8 tentatives par IP par heure
- 3 tentatives par email par jour
- un email deja inscrit renvoie un succes silencieux pour eviter de reveler si l'adresse existe deja

## Structure

```text
website/
  supabase/
    functions/     # Edge Function beta-signup
    sql/           # Scripts SQL a appliquer dans Supabase
  src/
    assets/fonts/   # Polices Satoshi copiees depuis le projet principal
    lib/            # Integrations externes, dont Supabase
    App.tsx         # Page a 7 etats
    main.tsx        # Point d'entree React
    styles.css      # Direction visuelle et layout mobile first
```
# Dun-website-2
