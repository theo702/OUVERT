// Prix et offres par défaut. L'admin (/admin/) enregistre ses changements
// dans la base KV ; ces valeurs ne servent que tant que rien n'a été modifié.
export const DEFAULT_PRICING = {
  plans: [
    {
      id: 'une-page',
      name: 'Une page',
      tagline: 'Pour être trouvé et joint facilement.',
      prefix: '',
      price: 190,
      note: 'paiement unique',
      features: ['1 page adaptée au téléphone', "Formulaire + bouton d'appel", 'Bases Google', 'En ligne en 1 semaine'],
      featured: false,
      badge: '',
      cta: 'Choisir Une page'
    },
    {
      id: 'vitrine',
      name: 'Vitrine',
      tagline: 'Pour présenter votre activité en détail.',
      prefix: '',
      price: 390,
      note: 'paiement unique',
      features: ['Logo offert', "Jusqu'à 5 pages", 'Galerie + avis Google', 'Référencement local de base', '2 allers-retours sur la maquette', 'En ligne en 2 semaines'],
      featured: true,
      badge: 'Le plus demandé',
      cta: 'Choisir Vitrine'
    },
    {
      id: 'sur-mesure',
      name: 'Sur mesure',
      tagline: 'Pour prendre des réservations et des paiements.',
      prefix: 'dès',
      price: 690,
      note: 'paiement unique',
      features: ['Logo offert', 'Réservation en direct + calendrier', 'Paiement Stripe', 'Mails automatiques', 'Loueurs : extras, stock, espace ménage, synchro Airbnb', 'Espace client, fidélité, langues : selon besoin'],
      featured: false,
      badge: '',
      cta: 'Choisir Sur mesure'
    }
  ],
  hosting: [
    { id: 'hebergement', name: 'Hébergement', desc: 'Nom de domaine, hébergement, https, sauvegardes.', month: 5, year: 50 },
    { id: 'suivi', name: 'Hébergement + suivi', desc: "Tout l'hébergement, plus 30 min de modifs par mois et la vérification que formulaires, paiements et mails marchent.", month: 12, year: 120 }
  ],
  options: [
    { id: 'page', name: 'Page en plus', price: 40, unit: '€' },
    { id: 'redaction', name: 'Rédaction des textes', price: 30, unit: '€/page' },
    { id: 'langue', name: 'Langue en plus', price: 80, unit: '€' },
    { id: 'logo', name: 'Logo seul', price: 80, unit: '€' },
    { id: 'stripe', name: 'Paiement Stripe + mails auto', price: 150, unit: '€' },
    { id: 'modif', name: 'Modif hors forfait', price: 35, unit: '€/h' }
  ]
};
