# Mise à jour du portail et de la vitrine — 23 novembre 2026

## Résultat

- Accueil corporate : emblème MPBP Music déplacé à gauche, directement dans le contexte graphique de sa carte pour une incrustation sans carré noir. Carte Engineering enrichie du décor architectural R3 existant, avec suppression du quadrillage décoratif.
- Cinq singles confirmés disponibles par le propriétaire : Le Bizz c’est bon 2.0, Prince des étoiles Remix, Légalize La Kalité Remix, BrainRot Society Remix et Sous Le Même Toit. Les liens Spotify, Apple Music, YouTube Music et Deezer sont synchronisés dans data.json, data/releases.json et data/music-library.json. TikTok et Facebook sont conservés pour Sous Le Même Toit.
- Le bon lien Apple Music de Légalize a été fourni dans le message complémentaire du propriétaire. Aucune URL n’a été inventée.
- Le Bizz quitte les listes de sorties futures et de comptes à rebours, devient la mise en avant disponible la plus récente, et son actualité n’annonce plus une pré-sortie. Le total du Music Hub est calculé à partir du catalogue, sans ancien compteur fixe à 35 titres.
- Discographies Sparetdee Simon et Makéda Muse actualisées via leurs sources communes. Les identifiants, dates existantes, titres non concernés et pochettes d’origine sont conservés.
- Actualité ajoutée sur Design & Software Engineering et les prochaines évolutions. Aucune date de disponibilité ou de démo non vérifiée n’est annoncée.
- Sept présentations d’applications/agent illustrées : Office, Studio OS, Render Nexus, Audio Forensics Lab, Brenda, Studio IA MPBP440 PRO et Roblox Game Factory. Studio IA possède sa fiche distincte, conformément à la confirmation du propriétaire. Le catalogue contient huit projets avec Les Jardins des Lumélys, dont aucun lien public de jeu n’est inventé.
- Les captures sont accessibles sur les fiches et dans les cartes du catalogue. Les sept logiciels/agent sont présentés avant disponibilité publique ; aucun exécutable, téléchargement, paiement, abonnement, agent privé ou démo interactive n’est déployé.

## Confidentialité et authenticité

Cinq captures réelles ont été prises dans les fenêtres ouvertes par le propriétaire : Studio OS, Render Nexus, Forensics, Studio IA et Game Factory. Pour Office et Brenda, des captures de présentation existantes ont été retrouvées dans leurs dossiers de travail. La provenance est distinguée dans `preuves/showcase-privacy-20261123.json` ; aucune capture générée n’est présentée comme une application réelle.

Les captures brutes restent dans le dossier privé `../evidence/application-captures-private`, hors Git et hors du serveur public. Seuls les WebP contrôlés de `assets/engineering/showcase-20261123/` sont publiables. Les noms, indicateurs financiers, graphiques et compteurs privés de Studio OS sont masqués localement, ainsi que les libellés privés de Render Nexus, l’avatar Office et les versions techniques de l’environnement Game Factory. Les sources sans projet, fichier ou compte personnel visible ont été vérifiées. Le floutage est précédé d’une réduction de détail pour empêcher de retrouver les caractères. Les métadonnées EXIF sont retirées.

Aucun code d’application, réglage de sécurité, document de facturation, projet, export ou compte n’a été modifié. Les logiciels ouverts pour les captures ne sont pas les services publics du site. Les captures ne certifient pas les fonctions non testées de ces prototypes.

## Tests et preuves

- `tools/v15-update-checks.py` vérifie les liens exacts et statuts dans les trois sources, la suppression des annonces futures confirmées, les identifiants et pochettes, le schéma du catalogue, les sept images publiques, les masquages et les métadonnées.
- Les 143 médias préexistants sont préservés à l’octet ; pour les SVG textuels, les fins de ligne Git/Windows sont normalisées. Les 19 fichiers protégés de backend, règles et workflows restent inchangés.
- 617 références locales des pages finales résolues, sans ressource absente.
- 20 contrôles responsive à 320/390/768/1440, aucun débordement observé. 28 comparaisons des véritables sources des clips et portraits musicaux, sans logo de secours. Contrôles navigateur des cinq titres dans Music Hub et la discographie, et des six liens de la collaboration Makéda.
- Filtres : six logiciels, recherche Render Nexus avec un seul résultat. Huit projets et sept captures affichés. Zéro fausse démo disponible.
- Les suites sécurité, régression des médias, rendu musical V14 déplacé et routage SW passent. Les tests de comportement CMS et renderer d’origine passent avec une fixture explicite en mémoire.
- Les tests bruts `content-20261013.test.js` et `release-hardening.test.js` restent FAIL : ils imposent les anciens liens d’octobre, Prince en une et BrainRot sans liens. Les fichiers d’origine sont conservés. L’adaptateur `v15-release-fixture.test.cjs` exécute les tests CMS/renderer avec leur fixture de liens manquants, sans exécuter l’ancien instantané éditorial ; les contenus actuels sont vérifiés séparément. Aucun ancien manifeste n’est modifié pour masquer ces différences.
- Les autres réserves historiques et vérifications non exécutées restent décrites dans les rapports antérieurs. iPhone Safari réel, accessibilité complète, authentification, paiements et fonctionnalités internes des logiciels : NON TESTÉ dans cette mise à jour.

Preuves : `preuves/update-20261123/static-checks.json`, `ui-update-qa.json`, `summary.json`, journaux et captures. Les contrôles du déploiement seront enregistrés hors du commit dans `../evidence/`.

## Sauvegarde, publication et maintenance

Baseline avant cette intervention : `0aedf54305772caa78b6c7a4a55432dee3bc50fc`. Archive Git complète vérifiée : `../backups/v15-before-content-update-20261123.zip`, empreinte dans `preuves/content-update-20261123.json`. Retour arrière par revert du commit de cette livraison, tests puis push normal autorisé. Aucun rollback de base de données nécessaire.

Une seule branche de travail est conservée. La publication reste GitHub Pages sur le domaine officiel ; les workflows Supabase, règles Firebase, secrets et Worker de publication sont inchangés. Le cache public passe à v3-content-showcase sans effacement de favoris ou profils.

Sources maintenables : `preview/v15/data/engineering.json` pour la vitrine, les générateurs existants pour les pages, `preview/v15/corporate-update.css` pour ces ajustements. Les scripts datés de mise à jour éditoriale et de préparation des captures documentent cette livraison ; ne pas les réappliquer aveuglément après de nouvelles sorties ou captures. Toujours contrôler les informations et zones privées avant une future publication.
