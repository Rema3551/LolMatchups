# League Matchups Companion (LMC)

Une application web moderne, légère et responsive conçue pour aider les joueurs de League of Legends à organiser leur champion pool et à documenter leurs matchups stratégiques par rôle (Top, Jungle, Mid, ADC, Support).

## 🚀 Fonctionnalités

- **Champion Pool par Rôle** : Organisez vos champions favoris selon le rôle auquel vous les jouez.
- **Notes de Matchups Détaillées** : Enregistrez vos plans de jeu (Early Game, Mid/Late Game), vos choix d'équipement, de runes, et vos astuces mécaniques spécifiques contre chaque adversaire.
- **Intégration Riot Data Dragon API** : Récupération dynamique et automatique de la liste officielle des champions de League of Legends ainsi que de leurs portraits en jeu.
- **Mode Focus "Écran de chargement"** : Un affichage épuré, très contrasté et à grande lisibilité conçu pour être affiché sur un deuxième écran pendant les 30 secondes de chargement de la partie pour réviser votre plan de jeu en un coup d'œil.
- **Persistance locale** : Sauvegarde automatique de vos données dans le stockage local du navigateur (`localStorage`), aucun compte ou connexion internet permanente requis.
- **Export & Import JSON** : Sauvegardez et restaurez facilement vos fiches de matchup sous forme de fichier pour les transférer sur un autre navigateur.
- **Design Hextech Premium** : Interface sombre inspirée de l'univers de League of Legends, optimisée pour le confort visuel lors des sessions de jeu.

## 🛠️ Stack Technique

- **Structure** : HTML5 sémantique
- **Styles** : CSS3 moderne (sans framework, 100% fait main, responsive et animé)
- **Logique** : JavaScript Vanilla (ES6+, programmation asynchrone pour l'API Riot)

## 💻 Installation locale

1. Clonez ce dépôt ou téléchargez les fichiers :
   ```bash
   git clone https://github.com/Rema3551/LolMatchups.git
   ```
2. Ouvrez simplement le fichier `index.html` dans votre navigateur ou lancez un mini-serveur HTTP local (par exemple avec Python) :
   ```bash
   python -m http.server 8000
   ```
3. Accédez à `http://localhost:8000`.
