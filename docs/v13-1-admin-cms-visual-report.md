# MPBP440 CMS V2.1 — interface visuelle et sorties synchronisées

## Périmètre

La V2.1 étend exclusivement `admin-440-mpbp-corp/`. Le site public, Supabase Auth, les rôles administrateurs, RLS, analytics, commentaires, le service worker et les Edge Functions existantes ne sont pas modifiés.

## Workflow éditorial

- Les collections Morceaux, MPBP TV, Artistes, Galerie, Événements, Actualités et Sorties disposent d'une vue cartes avec recherche, filtres et tri.
- Les actions carte conservent le brouillon local : modifier, masquer/afficher, dupliquer et supprimer avec confirmation.
- L'assistant Morceau accepte artiste principal, featuring, date, statut, pochette par glisser-déposer et liens plateformes.
- Une sortie `À venir` est synchronisée avec `data.json.upcoming` et les deux collections de compte à rebours. Le passage à `Disponible` les retire, maintient les bibliothèques et crée ou actualise l'annonce associée.
- Les sorties sont recopiées de façon cohérente dans `data.json`, `data/music-library.json` et `data/releases.json`, sans faire du CMS une nouvelle source de données.

## Sécurité

`admin-publish-site` est déjà la couche serveur de synchronisation des clips : après authentification et vérification du rôle admin, elle normalise les IDs et inscrit les clips dans `content_registry` avec l'accès service-role côté Edge Function seulement. Aucune nouvelle RPC publique, migration ou clé GitHub côté navigateur n'est nécessaire.

## Contrôles avant publication

Le CMS bloque la publication en cas d'ID de morceau, clip ou YouTube dupliqué, de source de clip manquante, de morceau sans titre/artiste/pochette, de lien non HTTPS ou d'une sortie Disponible restant dans À venir.

## Vérifications locales

- Analyse syntaxique JavaScript de `backoffice.js` et `cms-visual.js`.
- Validation JSON de l'état existant et audit des ID vidéo/YouTube dupliqués.
- Chargement local de l'écran d'authentification sans erreur console et sans overflow horizontal.
- Aucun contenu ou média temporaire n'est créé par ces contrôles.

Les tests Auth, upload Storage et publication atomique requièrent le compte admin existant ; ils seront exécutés sur l'unique preview finale, sans publication sur `main` avant validation visuelle.
