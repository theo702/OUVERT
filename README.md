# OUVERT
## À régler dans `js/site.js` (objet `CONFIG`)

- `pay['une-page']`, `pay['vitrine']` : liens de paiement Stripe (Payment Links). Vides = les boutons renvoient vers la page contact / services.
  Dans Stripe, régler « Après le paiement → Rediriger vers votre site » sur `/merci.html`.
- `web3formsKey` : clé gratuite de https://web3forms.com pour recevoir le formulaire par mail. Vide = le formulaire ouvre la messagerie du visiteur.
- `phone`, `phoneDisplay` : téléphone (s'affiche dans le pied de page et sur la page contact).

## Pages

`index.html`, `a-propos.html`, `services.html` (offres détaillées, hébergement, option IA), `realisations.html`, `contact.html` (formulaire, `?offre=` pré-remplit le choix), `mentions-legales.html` (adresse, SIRET, téléphone à compléter), `merci.html` (après paiement, non indexée).
