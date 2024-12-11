# AI Prompt Tool

## Présentation du projet

L'AI Prompt Tool est un outil permettant de générer des prompts structurés et complets à partir d'un codebase. Le but est d'offrir à l'utilisateur (par exemple un développeur ou un data scientist) un moyen cohérent et automatisé de créer un contexte riche destiné à un modèle d'IA (comme ChatGPT), afin de faciliter l'analyse, le conseil, le refactoring, ou l'explication du code.

## Fonctionnalités principales

- **Analyse du code source** : Le script scanne votre répertoire de code, en extrait la structure, les chemins de fichiers et leur contenu.
- **Consolidation d'information** : Le projet s'appuie sur des fichiers de configuration pour centraliser les paramètres (répertoire source, patterns d'exclusion, instructions du projet, contexte, etc.) et la requête finale.
- **Génération d'un prompt complet** : À partir des informations fournies dans les configurations et des données extraites du code source, l'outil produit un prompt final. Ce prompt inclut :
  - Les instructions du projet (objectifs, conventions, performances, UX, etc.)
  - La structure du projet (fichiers, arborescence)
  - Le contexte de la base de code (extraits de code, descriptions)
  - Le format de réponse attendu (basé sur le format choisi par l'utilisateur)
  - La requête finale personnalisée
- **Interface Web** : Une interface utilisateur web pour faciliter l'utilisation de l'outil.

## Architecture et répertoires

- **`config/`** : Contient les fichiers de configuration.
  - `user_config.yaml` : Configuration principale de l'utilisateur.
  - `final_request.yaml` : Contient la demande finale (la requête pour le modèle d'IA).
  - `formats/` : Répertoire contenant les formats de sortie disponibles.

- **`scripts/`** : Contient les scripts Python pour l'analyse et la génération.
  - `generate_structure.py` : Analyse l'arborescence du code source.
  - `generate_prompt.py` : Crée le prompt final.

- **`templates/`** : Contient le template pour générer le prompt final.

- **`web_ui/`** : Contient les fichiers de l'interface utilisateur web.
  - `index.html` : Page principale de l'interface web.
  - `styles.css` : Styles pour l'interface web.
  - `main.js` : Script JavaScript pour la logique côté client.

- **`server.js`** : Serveur Express.js pour gérer les requêtes de l'interface web.

- **`run_full_process.sh`** : Script principal pour exécuter le processus en ligne de commande.

## Utilisation de l'interface web

1. Démarrer le serveur :
   ```
   node server.js
   ```
2. Ouvrir un navigateur et aller à `http://localhost:3000`.
3. Utiliser l'interface pour :
   - Choisir le répertoire source du code à analyser.
   - Sélectionner le format de sortie.
   - Entrer la requête finale.
   - Générer le prompt.

## Flux de fonctionnement (via l'interface web)

1. L'utilisateur sélectionne le répertoire source et le format via l'interface web.
2. L'utilisateur entre sa requête finale dans le champ prévu.
3. En cliquant sur "Générer", l'interface web envoie une requête au serveur.
4. Le serveur exécute les scripts Python pour analyser le code et générer le prompt.
5. Le prompt généré est renvoyé à l'interface web et affiché à l'utilisateur.

## Utilisation en ligne de commande

Pour utiliser l'outil en ligne de commande :

1. Modifier `config/user_config.yaml` et `config/final_request.yaml` selon vos besoins.
2. Lancer :
   ```
   ./run_full_process.sh
   ```
3. Suivre les instructions pour choisir le format.
4. Le prompt final sera généré dans le répertoire de sortie.

## Personnalisation

- Modifier les fichiers de configuration dans `config/` pour ajuster les paramètres.
- Ajouter de nouveaux formats dans `config/formats/`.
- Personnaliser le template de prompt dans `templates/`.

## Support et extensions

- **Support multi-langages** : Le prompt final peut être adapté en différentes langues.
- **Integration CI/CD** : Possibilité d'exécuter le script dans une pipeline CI.
- **Ajout de nouveaux formats** : Créer un nouveau fichier dans `config/formats/`.

## Dépendances

- Node.js et npm pour le serveur et l'interface web.
- Python 3 pour les scripts d'analyse et de génération.
- Dépendances Node.js : Express, js-yaml.
- Dépendances Python : (à spécifier selon les imports dans les scripts Python)

## Installation

1. Cloner le repository.
2. Installer les dépendances Node.js : `npm install`.
3. Installer les dépendances Python : `pip install -r requirements.txt` (si un fichier requirements.txt est fourni).

## Contribution

Les contributions sont les bienvenues. Veuillez suivre les pratiques de développement standard et soumettre des pull requests pour toute modification majeure.
