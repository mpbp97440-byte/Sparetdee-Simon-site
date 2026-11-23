> État final : direction R3 et mise en ligne autorisées le 23 novembre 2026. Le contenu ci-dessous conserve les décisions et résultats du jalon préparatoire. Pour la réalisation finale, voir [LIVRAISON.md](LIVRAISON.md) et [TESTS-FINAL.md](TESTS-FINAL.md).

# Architecture V15 proposée — soumise à validation

**Complément R2 :** la [révision R2](REVISION-R2.md) ajoute la boutique sans vente, le hub démos et un éditeur local opérationnel de préparation JSON. Le logo Engineering est validé. Les annonces factuelles de noms de projets peuvent avoir un statut inconnu null sans être commercialisées. Toute activation de vente est refusée dans cette version.

## Front et frontières de confiance

Conserver le HTML/CSS/JS natif et GitHub Pages. Aucun framework lourd, migration de base ou nouveau service payant. Le front corporate ne charge ni intro, ni audio, ni logique admin. Le catalogue Engineering sera rendu en HTML statique depuis un JSON validé : recherche/filtrage en JS progressif et fiches réellement accessibles sans JS.

| Route cible | Rôle / transition |
|---|---|
| `/` | Accueil corporate, deux univers, informations et contact. |
| `/musique/` | Reprise du HTML musical actuel et de toutes ses sections/scripts après adaptation contrôlée des chemins. Pas une réécriture depuis la maquette. |
| `/music/` | Catalogue de morceaux existant, inchangé dans sa fonction ; ne pas rediriger vers /musique/. |
| `/mpbp-tv/` | Lecteurs, bibliothèque, ancres de clips et contrôles existants. |
| `/artistes/` | Nouvel index nécessaire pour réparer le 404 existant, sans changer les URLs des trois fiches. |
| `/engineering/` | Accueil, logiciels, IA, modules, jeux, services, offres, démos, actualités, devis. |
| `/engineering/projets/{slug}/` | Fiche statique stable d'un logiciel/agent/jeu ; slugs uniques, identifiants immuables. |
| `/engineering/services/`, `/engineering/offres/` | Vues générées du même catalogue, selon contenu validé ; ancres dans l'accueil si contenu insuffisant. |
| `/galerie/`, `/actu/`, `/evenements/`, `/members/`, `/mon-espace/`, `/telechargements/` | Préservées, avec navigation vers l'accueil musical et portail corporate. |
| `/a-venir/`, `/sortie/`, `/live/`, `/lyrics/*.html`, `/application/`, `/notifications/`, `/dashboard/`, `/offline.html` | Routes historiques inventoriées, maintenues et testées ; pas de suppression silencieuse. |
| `/admin-440-mpbp-corp/`, `/admin-pro/` | Protections et redirection historique conservées ; ne pas publier de données sensibles par cache. |
| `/404.html` | Page claire avec retour portail, musique et recherche de catalogue. |

L'inventaire complet de la source est dans `preuves/routes-baseline.json`. Les noms sous `preview/v15/` ne sont que des routes de revue locale ; ils ne représentent pas les URLs finales.

## Migration musicale contrôlée

1. Utiliser le manifeste des 404 fichiers au HEAD publié ; conserver tous les JSON, médias, identifiants et clés de stockage existants. Archiver les duplications historiques tant qu'une comparaison métier n'a pas établi leur rôle.
2. Reprendre `index.html` sous `musique/index.html`. Préférer des URL de ressources à racine explicite pour l'hébergement domaine officiel ; corriger séparément les `fetch(new URL(...,document.baseURI))` et `publicRoot()` pour musique. Éviter un `<base href="/">` global : il transforme aussi les ancres locales et peut envoyer #sortie au portail.
3. Conserver IDs, événements DOM, contrôles audio, intro/choix du son, lecteurs, compteurs, rendu des prochaines sorties et toutes les références média. Les ancres vides héritées sont documentées comme telles, pas remplies par des contenus inventés.
4. Mettre à jour les liens musicaux de navigation vers `/musique/#…`, y compris ceux injectés en JS et dans les JSON. Ne pas modifier les URL de plateformes externes ni perdre les fragments MPBP TV. Toute modification de JSON requiert un diff explicite ; les médias restent strictement identiques.
5. Ajouter au portail un pont minimal des anciens fragments, basé sur la liste réelle des IDs de l'ancien accueil. `/#sortie`, `/#artistes`, `/#clips`, `/#radio`, `/#avenir`, `/#actus`, `/#galerie`, `/#label`, `/#home`, `/#alaune`, `/#artists-hall`, `/#events`, `/#recherche`, `/#journal`, `/#liens`, `/#application` et `/#contenu-principal` conduiront à `/musique/` avec le même fragment. Le portail réserve ses propres IDs ; aucun redirect de fragment arbitraire. Ne pas déclarer de redirection HTTP 301 pour un fragment : le serveur ne le reçoit pas.
6. Examiner les occurrences `index.html#…` depuis toutes les sous-pages. Distinguer `../index.html` d'un `index.html` relatif à la sous-page ; tester les destinations résolues, pas seulement les chaînes. Préserver aussi le cas spécial existant `/#morceaux` → `/music/index.html#morceaux`, déjà traité par script.js et distinct des sections de l'accueil.
7. Prévoir une compatibilité sans JS par liens explicites vers les sections musicales. Les pages finales possèdent un lien de retour au portail.

## Données Engineering

Contrat proposé dans `catalogue.schema.json`, exemples dans `catalogue.candidats.json`. Catégories : software, agent, module, game, service, plan, demo, technical-news. Un ID stable est distinct du slug, qui devient permanent dès publication. Une modification de slug nécessite une route de compatibilité documentée.

Champs : id, slug, category, name, summary, description, images avec alt, demoVideo, features, limitations, useCases, platforms, requirements, hosting, status, version, updatedAt, changelog, documentation, pricing, license, cta, public, order et verification.

Les statuts métier sont En conception, En développement, Bêta, Démonstration disponible, Disponible, Maintenance et Retiré. `null` signifie information inconnue, autorisée uniquement pour un brouillon non public. Les six noms fournis sont enregistrés comme candidats, sans état technique inventé ni droits commerciaux. Un schéma de structure ne valide pas la vérité d'une fonctionnalité ou d'un prix : revue éditoriale requise avant publication.

Recherche et filtres portent sur les données publiques ; un masquage doit supprimer la fiche du build, des index, du sitemap et des liens publics. Un ancien slug publié puis retiré reçoit une information de retrait sans révéler les données privées.

Le générateur final devra valider les relations (IDs/slugs uniques, CTA cohérent, média/documentation vérifiés, prix/devise/taxes validés), générer les fiches HTML et échouer avant remplacement en cas d'erreur. Publication atomique par commit revu, pas d'écriture JSON depuis le navigateur public.

## Back-office et publication

Réutiliser les contrôles Firebase + rôle Firestore + Worker. Ajouter les rubriques seulement quand la vraie source Worker et son contrat sont obtenus. Points à vérifier : liste des chemins, validation serveur du schéma, rôle à chaque requête, limite de taille, MIME réels, contrôle du SHA de base contre les écrasements, audit minimal, branche de destination, prévisualisation et refus de publication sur main sans autorisation.

À défaut, livrer après validation visuelle un catalogue statique avec édition JSON ou éditeur local produisant un export validé. L'éditeur doit dire « Exporter » et ne pas laisser croire à une publication distante. Procédure : éditer le catalogue → valider → générer → prévisualiser → revue du diff → autorisation de publication → commit/PR autorisé. Aucun compte admin ne sera créé ou modifié.

## PWA musicale

Le manifeste actuel reste à son URL `/manifest.webmanifest`, scope `/`. Son identité implicite actuelle vient du start_url `/` : avant de déplacer ce dernier vers `/musique/`, fixer explicitement `id: "/"` et vérifier que cela préserve l'identité dans les navigateurs pris en charge. Conserver nom et vocation musicale. Ne pas exposer de nouvelle installation corporate tant que cette transition n'est pas vérifiée.

Les anciennes installations peuvent encore ouvrir `/` avant actualisation du manifeste : prévoir un retour musique explicite et étudier une redirection de lancement en mode standalone seulement pour l'application musicale existante. Tester ce comportement sur une installation réelle avant activation ; il ne doit pas modifier la navigation web corporate normale.

Conserver enregistrement SW racine et clés locales de favoris/audio/profils. Le cache versionné suivant ajoutera `/musique/` et ses ressources nécessaires ; pages en réseau d'abord, ressources versionnées selon usage, MP4 hors précache, pas de cache des réponses privées, Firebase, Worker, paiement, admin, données client ou authentification. Réparer l'exclusion admin du SW existant. Effacer seulement les anciens caches MPBP identifiés, jamais IndexedDB/localStorage des utilisateurs. Le mode hors ligne doit informer précisément du contenu indisponible ; aucune promesse de lecture de vidéos non téléchargées.

Tester installation précédente → mise à jour V15 → lancement musique → hors ligne → reconnexion → rollback. Le serveur de maquettes bloque volontairement SW/manifeste et services externes : aucun PASS PWA ne peut en être déduit.

## Paiement, licences et clients

Le front peut présenter achat unique, licence, mensuel, annuel, crédits IA et devis, avec prix inconnus et achat désactivé. Aucun abonnement automatique annoncé depuis un simple PayButton.

Parcours futur autorisé : commande serveur avec produit/prix/devise figés → paiement hébergé myPOS → notification vérifiée côté serveur et rapprochement transaction → activation idempotente de droits → suivi de remboursement/expiration. La page retour du navigateur n'active aucun droit. Définir échecs, annulation, remboursement, résiliation et support avant vente.

L'API/Checkout, l'éligibilité à la récurrence, le contrat marchand, les signatures, la sandbox et les webhooks restent à confirmer. Aucun agent local privé directement public ; pas d'API Studio OS supposée. L'espace client attend un backend sécurisé distinct de `members/` et `mon-espace/`. Dimensionner et chiffrer ce backend après définition des besoins réels, sans engager de coût.

## SEO, accessibilité et légal

Canonical corporate sur www racine ; musique sur www/musique/ ; fiches uniques ; Open Graph propres à chaque univers ; Organization pour l'entreprise et données musicales conservées dans leur contexte. Sitemap généré depuis routes publiques validées ; robots ne masque pas les pages métier. Maquettes en noindex uniquement.

Clavier, focus visible, landmarks, liens nommés, recherche étiquetée, contraste, tailles tactiles et reduced-motion font partie de la spécification. Captions/transcriptions pour les futures démos importantes. Ne charger les vidéos qu'après action.

Préparer mentions légales, confidentialité/traceurs, CGV, licence, abonnement/résiliation et support avec champs non publics à compléter. Vérifier identité professionnelle, coordonnées autorisées, prix/taxes, informations précontractuelles et droits applicables avant activation commerciale. Aucun texte juridique de cette proposition n'est déclaré validé.

## Étape suivante après accord visuel

Implémenter dans la même branche, par lots liés : migration musicale + compatibilité → portail → catalogue/fiches → navigation/SEO/PWA → édition compatible → tests et réserves. Conserver les deux FAIL hérités jusqu'à analyse documentée ; ajouter des tests V15 distincts comparant le contenu musical au HEAD du 13 octobre. Ne jamais réécrire le manifeste V14 pour effacer ses écarts. Aucun merge, push main ou déploiement sans autorisation explicite.
