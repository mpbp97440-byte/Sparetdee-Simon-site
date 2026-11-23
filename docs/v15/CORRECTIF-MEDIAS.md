# Correctif des images musicales — 23 novembre 2026

Régression signalée sur iPhone après 384bc52 et reproduite dans le navigateur de contrôle. Un script inline historique retirait le slash initial de `/assets/`. Sous `/musique/`, les images devenaient `/musique/assets/...` ; après défilement, les erreurs déclenchaient le remplacement par le logo. Les fichiers originaux sont intacts.

Les contrôles initiaux d’images manquantes étaient insuffisants : le logo de secours chargé donnait naturalWidth > 0. Leurs conclusions concernant la préservation visuelle complète sont invalidées par cette régression.

Correction ciblée : suppression du helper inline uniquement dans l’accueil déplacé et dans son générateur. Conservation des chemins absolus d’origine. Cache SW version `mpbp440-v15-20261123-v2-media-fix`, sans effacer favoris, profils ou données. La comparaison du contenu visible exclut désormais les scripts exécutables ; seul le helper défectueux est retiré.

Preuves exécutées :

- Test VM `tools/v15-media-regression.test.cjs` : exécution du script réellement publié, 16 chemins cassés reproduits avant correction ; 16 sources statiques conservées après. Preuve `preuves/media-regression-vm.json`.
- Navigateur local : 4 clips et 3 portraits à 320/390/768/1440, soit 28 contrôles. Chaque URL réellement affichée correspond exactement au média de la baseline originale ; dimensions natives positives, aucun logo de remplacement, aucun débordement. Preuve `preuves/final-captures/media-fix-browser.json`.
- 5 pochettes de sorties et 4 images de galerie : sources véritables et chargement vérifiés après navigation aux sections.
- 234 fichiers protégés de médias, données et backend toujours identiques. Tests contenu, hardening, sécurité, routage SW et suite visuelle adaptée à l’accueil déplacé PASS. Échecs historiques inchangés et conservés.
- Captures : `preuves/final-captures/music-390.jpg`, `artist-390.jpg`, `artist-1440.jpg`.

Les sources et le déploiement officiels seront contrôlés après publication. Safari sur l’iPhone du propriétaire n’est pas directement testable depuis ce navigateur de contrôle.
