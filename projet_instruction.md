**Objectif du projet :**

Créer une borne tactile pour magasins physiques (ex. : Décathlon), permettant aux clients d’essayer virtuellement des vêtements via une technologie de "try-on". L’utilisateur suit un parcours fluide, de la capture d’une photo à la génération des résultats, dans une interface immersive inspirée d’un miroir connecté, avec possibilité de changer la langue de l’interface et de réutiliser des images déjà générées pour de nouveaux essais.

---

**Gestion multilingue** :

- L’interface est conçue pour supporter plusieurs langues.
- Un système de gestion des langues (fichiers de traduction, variables dynamiques, etc.) doit être en place.
- Un indicateur (drapeau) visible en haut de l’interface permet de changer facilement la langue.
- Le changement de langue prend effet immédiatement sur l’ensemble de l’interface.

---

**Parcours utilisateur et écrans :**

**1. Écran d’accueil (avant la session) :**

- Affiche le flux vidéo de la webcam en plein écran, comme un miroir connecté.
- Un bouton "Let’s Play" est superposé, ainsi qu’un cadre pointillé pour aider l’utilisateur à se positionner.
- Le drapeau indiquant la langue actuelle est visible en haut, permettant de changer la langue.
- L’utilisateur clique sur "Let’s Play" pour lancer le processus.

**2. Modal de consentement légal :**

- Une modal apparaît, demandant à l’utilisateur d’accepter les conditions d’utilisation et la sauvegarde de ses photos.
- S’il accepte, on passe à l’étape suivante. S’il refuse, retour à l’écran d’accueil.

**3. Décompte et tutoriel de placement :**

- Un décompte de 10s démarre après l’acceptation.
- Pendant les 5 premières secondes, un modal semi-transparent affiche des tutoriels visuels et textuels pour aider l’utilisateur à se positionner.
- Passées ces 5s, le modal disparaît, laissant uniquement le décompte.
- À 0s, la photo initiale est prise.

**4. Modal de validation de la photo :**

- La photo capturée est affichée en grand.
- L’utilisateur peut confirmer la photo ou la reprendre (réinitialisant le décompte et le tutoriel).
- Si confirmée, la session démarre et l’image initiale est sauvegardée en base de données.

**5. Écran principal (après validation de la photo initiale) :**

- La vue webcam plein écran est remplacée par l’affichage de la photo sélectionnée. La webcam n’est plus affichée après cette étape.
- À gauche, une barre verticale affiche l’historique :
    - La photo initiale en haut.
    - Les nouvelles photos générées seront ajoutées juste en dessous de la photo initiale, créant une liste verticale. Chaque nouvelle génération s’ajoute directement sous l’image initiale, en gardant l’ordre chronologique (la plus récente se retrouve immédiatement sous l’originale).
- L’utilisateur peut cliquer sur n’importe quelle photo de l’historique pour la sélectionner. **La photo sélectionnée (qu’elle soit l’originale ou une image générée précédemment) est utilisée comme base pour la prochaine génération.** Ainsi, l’utilisateur peut faire un try-on à partir de n’importe quelle image déjà présente dans l’historique.
- En haut, une barre horizontale présente les catégories de vêtements (T-shirts, Jeans, Pulls, etc.) ainsi que le drapeau de langue.
- Cliquer sur une catégorie ouvre un modal transparent affichant les différents vêtements de cette catégorie.
- Le modal transparent laisse voir l’image sélectionnée en fond.
- En cliquant sur un vêtement, la génération du try-on se lance à partir de l’image actuellement sélectionnée.

**6. Écran de génération (progression) :**

- Une barre de progression s’affiche, indiquant l’état d’avancement (5s à 1min max).
- Une zone publicitaire est visible sous la barre de progression.
- Une fois la génération terminée, l’écran principal réapparaît.

**7. Retour à l’écran principal (post-génération) :**

- La nouvelle image générée est ajoutée juste en dessous de la photo initiale dans l’historique et est automatiquement sélectionnée.
- L’utilisateur peut de nouveau choisir une autre catégorie, un autre vêtement, ou changer de langue à tout moment.

**8. Fin de session :**

- Un bouton "Terminer la session" ouvre un modal :
    - L’utilisateur peut saisir un numéro de téléphone pour recevoir par SMS toutes les images générées.
    - Un bouton "Confirmer" envoie les images si un numéro est fourni, sinon termine simplement la session.
    - Un bouton "Retour" permet d’annuler la fin de session et de continuer.
    - Un message de remerciement s’affiche.
- Une fois la session terminée, retour à l’écran d’accueil avec la webcam, prêt pour un nouvel utilisateur.

---

**Contraintes et exigences :**

- **Affichage pleine page** :
    - Toujours en fullscreen sans scroll global.
    - Les barres d’historique et de sélection de vêtements sont scrollables dans leurs zones dédiées.
- **Vue webcam immersive** :
    - Le flux de la webcam occupe 100% de l’écran **uniquement sur l’écran d’accueil et jusqu’à la prise de la photo initiale**.
    - Après la validation de la photo initiale, la webcam disparaît et le fullscreen est réservé à l’affichage de l’image sélectionnée (initiale ou générée).
- **Confidentialité** :
    - Toutes les photos sont sauvegardées en base de données.
    - Consentement explicite avant la capture.
    - Les photos ne sont utilisées que dans la session courante, identifiée par un UID unique.
- **Gestion des sessions** :
    - Chaque nouvelle photo initiale crée une nouvelle session.
    - Données de sessions précédentes non accessibles ensuite.
- **Performances** :
    - Génération entre 5s et 1min.
    - Une seule session utilisateur à la fois.
- **Architecture propre** :
    - ESModules, code organisé en `components/`, `pages/`, `services/`, `styles/`.
    - Commentaires clairs.
- **Publicité pendant la génération** :
    - Affichage sous la barre de progression, non intrusive.
- **Expérience utilisateur fluide** :
    - Feedbacks visuels/sonores.
    - Boutons grands et adaptés.
    - Gestion multilingue à tout moment.
- **Évolutivité** :
    - Ajout facile de nouvelles catégories, vêtements, langues, fonctionnalités.

---

**Résumé :**

Ce projet fournit une expérience immersive de try-on virtuel avec prise de photo initiale via une webcam, sélection de vêtements par catégorie, génération d’images à partir de l’image initiale ou de toute image déjà générée, et gestion multilingue intégrée. L’interface évolue du flux webcam au début à l’affichage des images sélectionnées ensuite, permet la fin de session avec envoi par SMS, et respecte les contraintes de performances, de confidentialité et d’ergonomie.