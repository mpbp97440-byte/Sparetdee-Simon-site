# MPBP440 V12.0.6 — état d'exécution

## Corrections réalisées sur la branche

- Nouveau badge officiel Makéda : `assets/artists/makeda-muse/makeda-muse-treble-clef-badge.png`.
- L'ancienne clé de sol texte de l'introduction est remplacée par ce badge, avec `object-fit: contain`, fond noir et l'alt demandé.
- Le badge contient déjà le nom Makéda Muse : aucun libellé redondant n'est rendu sous l'image.
- Ordre collectif corrigé : Sparetdee Simon, Makéda Muse, Juste Une Plume dans l'intro, la homepage, le footer et le filtre Artistes de la galerie.

## Engagement MPBP TV — blocage de sécurité

L'audit ne trouve aucun backend existant adapté (Supabase, Firebase, API serverless ou fonction RPC). Le seul compteur existant est CountAPI (`analytics/tracker.js`), un endpoint public d'incrément sans authentification ni règles serveur. Il ne peut pas garantir des likes réversibles, des totaux anti-abus, des identifiants autorisés ou des incréments atomiques sécurisés.

Conformément à la mission, aucun compteur de vues/likes fictif n'est ajouté et aucune preview/production V12.0.6 n'est publiée.

## Action manuelle unique requise

Créer ou fournir un projet Supabase avec une URL publique, une clé anon et une fonction RPC sécurisée pour les quatre IDs autorisés (`l-argent`, `clip-je-sais-que-tu-sais`, `clip-j-existe`, `clip-dois-je-me-taire`). La fonction doit faire les incréments atomiques et les règles RLS doivent interdire l'écriture directe des compteurs. Aucune clé `service_role` ne doit être fournie au frontend.

## Vérifications

- URLs et ancres publiques inchangées.
- MPBP TV et ses vidéos inchangés : aucun code d'analytics non fonctionnel n'est ajouté.
- Les fichiers protégés locaux sont conservés.
