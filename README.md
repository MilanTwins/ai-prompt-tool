# AI Prompt Tool

## Présentation du projet

L'AI Prompt Tool est un outil permettant de générer des prompts structurés et complets à partir d'un codebase. Le but est d'offrir à l'utilisateur (par exemple un développeur ou un data scientist) un moyen cohérent et automatisé de créer un contexte riche destiné à un modèle d'IA (comme ChatGPT), afin de faciliter l'analyse, le conseil, le refactoring, ou l'explication du code.

## Fonctionnalités principales

- **Analyse du code source** : Le script scanne votre répertoire de code, en extrait la structure, les chemins de fichiers et leur contenu.
- **Consolidation d'information** : Le projet s'appuie sur un fichier de configuration global (`config/user_config.yaml`) pour centraliser les paramètres (répertoire source, patterns d'exclusion, instructions du projet, contexte, etc.) et un fichier séparé pour la requête finale (`config/final_request.yaml`).
- **Génération d'un prompt complet** : À partir des informations fournies dans les YAML de configuration et des données extraites du code source, l'outil produit un prompt final au format XML. Ce prompt inclut :
  - Les instructions du projet (objectifs, conventions, performances, UX, etc.)
  - La structure du projet (fichiers, arborescence)
  - Le contexte de la base de code (extraits de code, descriptions)
  - Le format de réponse attendu (basé sur le format choisi par l'utilisateur)
  - La requête finale personnalisée

## Architecture et répertoires

- **`config/`** : Contient les fichiers de configuration utilisateur.
  - `user_config.yaml` : Fichier principal où l'utilisateur définit :
    - Le répertoire source du code à analyser.
    - Les patterns d'exclusion (fichiers et dossiers à ignorer).
    - Les instructions du projet (objectifs, conventions, UX, etc.).
    - Le contexte du codebase (chemins et descriptions de fichiers clés).
  - `final_request.yaml` : Contient la demande finale séparée (la requête que vous voulez poser au modèle d'IA).
  - `formats/` : Répertoire contenant les formats de sortie disponibles (XML, Markdown, JSON, diff, etc.). Chaque format est décrit dans un fichier XML.

- **`scripts/`** : Contient les scripts Python pour l'analyse et la génération.
  - `generate_structure.py` : Analyse l'arborescence du code source défini dans user_config.yaml, génère la structure et le contexte du code.
  - `generate_prompt.py` : Lit user_config.yaml, final_request.yaml et les données générées par generate_structure.py pour créer le prompt final.

- **`templates/`** : Contient le template Jinja2 (`prompt_template.xml.jinja2`) pour générer le prompt final au format XML.

- **`output/`** : Répertoire où sont stockés les fichiers générés automatiquement :
  - `code_structure.xml` : Représentation de la structure du code.
  - `code_context.xml` : Contexte détaillé (extraits de code).
  - `final_prompt.xml` : Le prompt final prêt à être utilisé avec un modèle d'IA.

- **`run_full_process.sh`** : Script principal qui orchestre tout le processus.

## Flux de fonctionnement

1. **Préparation** :
   - L'utilisateur modifie `config/user_config.yaml` pour définir le répertoire source, les exclusions, et les instructions du projet.
   - L'utilisateur définit sa requête finale dans `config/final_request.yaml`.
   - Les autres fichiers de configuration (`config/formats/*`) et le template (`templates/prompt_template.xml.jinja2`) sont préconfigurés.

2. **Exécution du script principal** :
   - L'utilisateur lance `./run_full_process.sh`.
   - Le script vérifie la présence des répertoires et fichiers nécessaires.

3. **Analyse de la structure** :
   - `generate_structure.py` est exécuté.
   - Il scanne `source_directory` (défini dans user_config.yaml) pour créer `output/code_structure.xml` et `output/code_context.xml`.

4. **Choix du format** :
   - Le script `run_full_process.sh` affiche les formats disponibles (détectés dans `config/formats/`) et demande à l'utilisateur d'en choisir un (ex. none, xml, markdown, etc.).

5. **Génération du prompt final** :
   - `generate_prompt.py` est exécuté avec le format choisi.
   - Il lit `user_config.yaml` et `final_request.yaml`.
   - Il charge la structure et le contexte générés précédemment depuis `output/`.
   - Il charge le template Jinja2 dans `templates/`.
   - Il construit le prompt final, puis l'écrit dans `output/final_prompt.xml`.

6. **Résultat** :
   - Le prompt final est un fichier XML structuré, enrichi de toutes les instructions et du contexte nécessaire, prêt à être copié-collé dans votre modèle d'IA.
   - Le script affiche le nombre de caractères et une estimation du nombre de tokens.

## Avantages de la nouvelle organisation

- **Clarté** :
  - Un seul fichier principal de configuration (`user_config.yaml`) pour toutes les informations projet/code.
  - Un fichier séparé pour la requête finale (`final_request.yaml`).
  - Un répertoire de sortie (`output/`) distinct pour tous les fichiers générés.

- **Évolutivité** :
  - Facile d'ajouter ou de modifier les formats de sortie dans `config/formats/`.
  - Simple de changer la structure du projet, d'ajouter des catégories, ou de nouveaux objectifs dans le YAML.

- **Simplicité d'utilisation** :
  - L'utilisateur n'a qu'à éditer `user_config.yaml` et `final_request.yaml`.
  - L'exécution de `run_full_process.sh` gère le reste.

## Personnalisation

- Vous pouvez ajuster le template Jinja2 (`templates/prompt_template.xml.jinja2`) pour modifier la structure du prompt final.
- Vous pouvez créer votre propre format en ajoutant un fichier XML dans `config/formats/`.
- Vous pouvez changer le répertoire source du code, le format par défaut ou les patterns d'exclusion dans `user_config.yaml`.

## Exemple d'utilisation

1. Modifier `config/user_config.yaml` et `config/final_request.yaml` selon vos besoins.
2. Lancer :
   ```
   ./run_full_process.sh
   ```
3. Lorsque le script demande un format, saisir par exemple `none`.
4. Le prompt final apparaîtra dans `output/final_prompt.xml`.

## Support et extensions

- **Support multi-langages** : Le prompt final peut être adapté en différentes langues.
- **Integration CI/CD** : Vous pouvez exécuter ce script dans une pipeline CI pour générer régulièrement des prompts à jour en fonction du code source.
- **Ajout de nouveaux formats** : Créez un nouveau fichier dans `config/formats/` et modifiez le template si nécessaire.
