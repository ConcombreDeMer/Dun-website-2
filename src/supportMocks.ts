export type SupportComment = {
  id: string;
  authorName: string;
  publishedAgo: string;
  body: string;
};

export type SupportIssue = {
  id: string;
  title: string;
  description: string;
  publishedAgo: string;
  authorName: string;
  likes: number;
  comments: SupportComment[];
};

export const supportIssues: SupportIssue[] = [
  {
    id: 'box-de-taches',
    title: 'Ajouter une box de tâches',
    description:
      "Pouvoir regrouper certaines tâches dans une box aiderait à séparer les petits sujets rapides des vrais blocs de travail. Ce serait utile pour garder la journée lisible quand plusieurs demandes arrivent en même temps.",
    publishedAgo: 'Il y a 6 jours',
    authorName: 'User1228',
    likes: 12,
    comments: [
      {
        id: 'comment-box-1',
        authorName: 'User4477',
        publishedAgo: 'Il y a 4 jours',
        body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      },
      {
        id: 'comment-box-2',
        authorName: 'User0194',
        publishedAgo: 'Il y a 2 jours',
        body: "Oui, surtout si l'on peut masquer la box une fois qu'elle est terminée.",
      },
    ],
  },
  {
    id: 'bug-stats',
    title: 'Fix le bug de stats',
    description:
      "Les statistiques semblent parfois conserver les données de la veille après le changement de journée. Un rafraîchissement manuel corrige l'affichage, mais le comportement devrait être automatique.",
    publishedAgo: 'Il y a 5 jours',
    authorName: 'User3041',
    likes: 8,
    comments: [
      {
        id: 'comment-stats-1',
        authorName: 'User7740',
        publishedAgo: 'Il y a 3 jours',
        body: "Je vois la même chose quand l'app reste ouverte toute la nuit.",
      },
    ],
  },
  {
    id: 'connexion-google',
    title: 'Bug sur la connexion google',
    description:
      "La connexion avec Google revient parfois sur l'écran précédent sans message clair. Un état d'erreur ou une relance plus visible rendrait le parcours plus compréhensible.",
    publishedAgo: 'Il y a 4 jours',
    authorName: 'User8921',
    likes: 3,
    comments: [
      {
        id: 'comment-google-1',
        authorName: 'User1129',
        publishedAgo: 'Il y a 2 jours',
        body: "Le bouton reste bloqué quelques secondes chez moi avant de revenir au début.",
      },
    ],
  },
  {
    id: 'mode-focus',
    title: 'Ajouter un mode focus',
    description:
      "Un mode focus permettrait de masquer tout sauf la tâche active, avec un minuteur simple et un retour à la liste quand la session est terminée.",
    publishedAgo: 'Il y a 3 jours',
    authorName: 'User6210',
    likes: 21,
    comments: [
      {
        id: 'comment-focus-1',
        authorName: 'User3378',
        publishedAgo: 'Hier',
        body: "Ce serait parfait avec une option pour couper les notifications pendant la session.",
      },
      {
        id: 'comment-focus-2',
        authorName: 'User5092',
        publishedAgo: "Aujourd'hui",
        body: "J'aimerais aussi une durée personnalisable, pas seulement 25 minutes.",
      },
    ],
  },
  {
    id: 'rappels-recurrents',
    title: 'Créer des rappels récurrents',
    description:
      "Certaines tâches reviennent toutes les semaines. Les ajouter à la main casse un peu le rituel, surtout pour les habitudes déjà bien installées.",
    publishedAgo: 'Il y a 8 jours',
    authorName: 'User4802',
    likes: 17,
    comments: [
      {
        id: 'comment-rappels-1',
        authorName: 'User9344',
        publishedAgo: 'Il y a 7 jours',
        body: "Une fréquence hebdomadaire suffirait déjà pour beaucoup de cas.",
      },
    ],
  },
  {
    id: 'export-pdf',
    title: 'Exporter la semaine en PDF',
    description:
      "Un export simple de la semaine aiderait à partager un bilan ou garder une trace hors de l'application, sans devoir faire des captures d'écran.",
    publishedAgo: 'Il y a 9 jours',
    authorName: 'User2105',
    likes: 6,
    comments: [
      {
        id: 'comment-export-1',
        authorName: 'User7712',
        publishedAgo: 'Il y a 6 jours',
        body: "Même un export très brut serait déjà utile pour les points hebdo.",
      },
    ],
  },
  {
    id: 'tri-priorite',
    title: 'Trier par priorité',
    description:
      "Quand la liste commence à grandir, pouvoir remonter les tâches importantes permettrait de mieux décider quoi traiter en premier.",
    publishedAgo: 'Il y a 10 jours',
    authorName: 'User6731',
    likes: 15,
    comments: [
      {
        id: 'comment-priority-1',
        authorName: 'User5811',
        publishedAgo: 'Il y a 9 jours',
        body: "Un tri manuel par glisser-déposer pourrait aussi fonctionner.",
      },
      {
        id: 'comment-priority-2',
        authorName: 'User7400',
        publishedAgo: 'Il y a 5 jours',
        body: "Je préférerais trois niveaux simples plutôt qu'un système trop détaillé.",
      },
    ],
  },
  {
    id: 'theme-sombre',
    title: 'Prévoir un thème sombre',
    description:
      "Le thème clair est agréable, mais un thème sombre serait plus confortable le soir ou tôt le matin pendant le rituel de préparation.",
    publishedAgo: 'Il y a 12 jours',
    authorName: 'User3880',
    likes: 19,
    comments: [
      {
        id: 'comment-dark-1',
        authorName: 'User9090',
        publishedAgo: 'Il y a 11 jours',
        body: "Le mode repos serait encore plus cohérent avec un thème sombre.",
      },
    ],
  },
  {
    id: 'notifications-douces',
    title: 'Notifications plus douces',
    description:
      "Les rappels devraient rester discrets. Une notification moins pressante aiderait à garder le ton calme de l'application.",
    publishedAgo: 'Il y a 13 jours',
    authorName: 'User5029',
    likes: 10,
    comments: [
      {
        id: 'comment-notif-1',
        authorName: 'User1145',
        publishedAgo: 'Il y a 10 jours',
        body: "Un réglage du ton ou de la fréquence serait vraiment bien.",
      },
    ],
  },
  {
    id: 'archive-taches',
    title: 'Archiver les tâches terminées',
    description:
      "Une archive permettrait de retrouver ce qui a été fait sans encombrer la journée en cours. Ce serait utile pour revoir le travail accompli.",
    publishedAgo: 'Il y a 15 jours',
    authorName: 'User7622',
    likes: 14,
    comments: [
      {
        id: 'comment-archive-1',
        authorName: 'User3188',
        publishedAgo: 'Il y a 12 jours',
        body: "Une vue mensuelle des archives serait très pratique.",
      },
    ],
  },
];

export function getSupportIssueById(issueId: string) {
  return supportIssues.find((issue) => issue.id === issueId);
}
