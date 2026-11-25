# Ouvert

Site de Ouvert : HTML/CSS/JS statique + quelques fonctions Cloudflare pour l'admin.
Hébergé sur **Cloudflare Pages** (gratuit).

## Ce qu'il y a dedans

- Les pages : `index.html`, `a-propos.html`, `services.html`, `realisations.html`, `contact.html`, `mentions-legales.html`, `404.html`
- `admin/` : l'administration, sur **/admin/**
  - **Tableau de bord** : nouvelles demandes, en cours, gagnées
  - **Demandes de devis** : tout ce qui arrive par le formulaire de contact, avec un statut (nouveau, en cours, devis envoyé, gagné, perdu), le montant et des notes
  - **Offres & prix** : nom, prix, points compris, mise en avant, hébergement, options. Le changement s'applique partout sur le site.
  - **Éditeur du site** : on clique sur un texte de la page et on le modifie directement
- `functions/` : le petit serveur (Cloudflare Pages Functions)
  - `functions/_lib/defaults.js` : les **prix par défaut** (utilisés tant que rien n'est modifié dans l'admin)

## Mise en ligne sur Cloudflare Pages

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, choisir ce dépôt.
   - Build command : *(vide)*
   - Build output directory : `/`
2. **Créer la base** : Workers & Pages → **KV** → *Create namespace*, nom : `ouvert`.
3. Dans le projet Pages → **Settings → Bindings** → *Add* → **KV namespace** :
   - Variable name : `OUVERT_KV`
   - Namespace : `ouvert`
4. Dans le projet Pages → **Settings → Variables and Secrets**, ajouter (type *Secret*) :
   - `ADMIN_PASSWORD` : le mot de passe de l'admin
   - `ADMIN_SECRET` : une longue suite de caractères au hasard (au moins 32)
5. Redéployer (onglet *Deployments* → *Retry deployment*). L'admin est sur `https://votre-site/admin/`.

### Recevoir un mail à chaque demande (facultatif)

Avec [Resend](https://resend.com) (le même service que pour La Bonne Aventure), ajouter :

- `RESEND_API_KEY` (secret) : la clé Resend
- `NOTIFY_EMAIL` : l'adresse qui reçoit les demandes
- `FROM_EMAIL` : l'expéditeur, ex. `Ouvert <devis@studio-ouvert.fr>` (domaine vérifié dans Resend)

Autre possibilité : renseigner la clé Web3Forms dans `js/site.js` (`const KEY`).

## Tester en local

```bash
npm install -g wrangler
```

```bash
printf 'ADMIN_PASSWORD=test\nADMIN_SECRET=une-longue-chaine-au-hasard-pour-tester\n' > .dev.vars
```

```bash
wrangler pages dev . --kv OUVERT_KV
```

Puis ouvrir http://localhost:8788/admin/ (mot de passe : `test`). Ne pas committer `.dev.vars`.

## À compléter

- `assets/ouvert-logo.svg`, `assets/ouvert-logo-blanc.svg`, `assets/ouvert-icone.svg` (logos)
- Téléphone : `CONFIG.phone` dans `js/site.js`
- Vrais avis clients : tableau `AVIS` dans `js/site.js`
- Mentions légales : SIRET et adresse
