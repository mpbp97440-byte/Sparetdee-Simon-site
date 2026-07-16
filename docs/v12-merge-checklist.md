# Checklist avant merge V12

- [ ] `v12-premium` est à jour et la recette HTTPS séparée est signée.
- [ ] `main` pointe toujours vers la base V11 attendue ; aucun CNAME n’est modifié.
- [ ] Tests desktop/iPhone, VoiceOver/NVDA et PWA installable réussis.
- [ ] Les quatre ancres MPBP TV, artistes, Music Hub, `#actus`, galerie et radio sont validés.
- [ ] Manifest et service worker sont validés sur le vrai hostname cible.
- [ ] Les fichiers protégés locaux sont hors index et présents.
- [ ] Diff relu : aucun MP4, asset officiel, back-office ou secret n’est ajouté.
- [ ] Plan de rollback ci-dessous est approuvé.
- [ ] Autorisation explicite obtenue avant merge puis déploiement.

Ne pas créer de tag V12 ni pousser sur `main` avant ces validations.
