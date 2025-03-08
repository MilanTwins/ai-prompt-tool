#!/usr/bin/env python3
import os
import fnmatch
import sys
import yaml
import xml.etree.ElementTree as ET

def load_ignore_config():
    """Charge la configuration des fichiers à ignorer."""
    ignore_path = "config/ignore_config.yaml"
    if os.path.exists(ignore_path):
        with open(ignore_path, "r", encoding="utf-8") as f:
            data = yaml.load(f, Loader=yaml.SafeLoader)
        return data.get("ignore_patterns", [])
    return []

def load_settings():
    """
    Charge les paramètres utilisateur depuis user_config.yaml
    et combine avec les patterns d'ignorance (ignore_config.yaml).
    """
    with open("config/user_config.yaml", "r", encoding="utf-8") as f:
        data = yaml.load(f, Loader=yaml.SafeLoader)
    source_directory = data.get("source_directory", ".")
    
    # Combiner les patterns d'exclusion
    user_exclude = data.get("exclude_patterns", [])
    ignore_exclude = load_ignore_config()
    exclude_patterns = list(set(user_exclude + ignore_exclude))
    
    selected_files = data.get("selected_files", [])
    return source_directory, exclude_patterns, selected_files

def is_excluded(path, exclude_patterns):
    """
    Vérifie si un chemin doit être exclu en utilisant fnmatch pour les wildcards.
    On préfixe automatiquement un pattern ne contenant pas de slash par '**/' pour
    qu'il puisse matcher n'importe où dans l'arborescence.
    """
    norm_path = path.replace("\\", "/")

    for original_pattern in exclude_patterns:
        # On travaille sur une copie pour ne pas modifier la liste de base.
        pattern = original_pattern
        
        # Si le pattern ne contient pas de slash et ne commence pas déjà par '**/',
        # on le préfixe par '**/' pour qu'il puisse matcher le fichier à n'importe quel niveau.
        if "/" not in pattern and not pattern.startswith("**/"):
            pattern = f"**/{pattern}"
        
        if fnmatch.fnmatch(norm_path, pattern):
            return True
    return False

def detect_language(extension):
    """
    Détecte le langage en fonction de l'extension.
    """
    lang_map = {
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".py": "python",
        ".html": "html",
        ".css": "css",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".md": "markdown"
    }
    return lang_map.get(extension.lower(), "text")

def is_too_high_in_hierarchy(source_dir):
    """
    Évite de scanner des emplacements trop 'sensibles'.
    Vous pouvez personnaliser cette liste si besoin.
    """
    forbidden_paths = ["/", "/home"]
    abs_source = os.path.abspath(source_dir)
    return abs_source in forbidden_paths

def build_tree_structure(source_directory, exclude_patterns, selected_files):
    """
    Construit une structure interne représentant l'arborescence complète du projet,
    en ignorant les fichiers correspondant aux patterns.
    """
    structure_output = []
    
    def process_directory(dir_path, level=0):
        items = sorted(os.listdir(dir_path))
        dirs = []
        files = []
        
        for item in items:
            full_path = os.path.join(dir_path, item)
            
            if is_excluded(full_path, exclude_patterns):
                continue
                
            if os.path.isdir(full_path):
                dirs.append(item)
            else:
                files.append(item)
        
        if dirs or files:
            indent = "  " * level
            if level == 0:
                # Racine du projet
                structure_output.append(f"Project Root: {os.path.basename(dir_path) or '.'}")
            else:
                structure_output.append(f"{indent}Directory: {os.path.basename(dir_path)}/")
            
            for f in sorted(files):
                structure_output.append(f"{indent}  - {f}")
            
            for d in sorted(dirs):
                process_directory(os.path.join(dir_path, d), level + 1)
    
    process_directory(source_directory)
    
    # Sauvegarde dans un fichier texte
    if not os.path.exists("output"):
        os.makedirs("output")
    with open("output/code_structure.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(structure_output))

def build_code_context(source_directory, exclude_patterns, selected_files):
    """
    Génère le code_context.xml uniquement pour les fichiers explicitement sélectionnés.
    """
    source_dir_abs = os.path.abspath(source_directory)
    normalized_selected_files = set()
    
    # Convertit les chemins de selected_files pour qu'ils soient relatifs au source_directory
    for file_path in selected_files:
        if isinstance(file_path, str):
            if os.path.isabs(file_path):
                rel_path = os.path.relpath(file_path, source_dir_abs)
            else:
                rel_path = file_path
            normalized_selected_files.add(rel_path.replace('\\', '/'))

    # Élément racine du code context
    code_context_root = ET.Element("code_context")
    
    def process_directory(dir_path):
        items = sorted(os.listdir(dir_path))
        
        for item in items:
            full_path = os.path.join(dir_path, item)
            rel_path = os.path.relpath(full_path, source_directory).replace('\\', '/')
            
            if is_excluded(full_path, exclude_patterns):
                continue
                
            if os.path.isdir(full_path):
                process_directory(full_path)
            elif rel_path in normalized_selected_files:
                # Ajout d'un fichier dans le code_context
                file_elem = ET.SubElement(code_context_root, "file", path=rel_path)
                code_elem = ET.SubElement(file_elem, "code",
                                          language=detect_language(os.path.splitext(item)[1]))
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            line_elem = ET.SubElement(code_elem, "line")
                            line_elem.text = line.rstrip('\n')
                except Exception as e:
                    print(f"Warning: Could not read file {full_path}: {e}")
    
    process_directory(source_directory)
    
    # Sauvegarde en XML
    if not os.path.exists("output"):
        os.makedirs("output")
    
    ET.ElementTree(code_context_root).write("output/code_context.xml",
                                            encoding="utf-8",
                                            xml_declaration=True)

def main():
    source_directory, exclude_patterns, selected_files = load_settings()

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high.")
        sys.exit(1)

    if not os.path.exists("output"):
        os.makedirs("output")

    # Supprime les fichiers de sortie existants si besoin
    for file in ["code_context.xml", "code_structure.txt"]:
        path = os.path.join("output", file)
        if os.path.exists(path):
            os.remove(path)

    # Générer la structure du projet
    build_tree_structure(source_directory, exclude_patterns, selected_files)
    
    # Générer le code_context pour les fichiers sélectionnés
    build_code_context(source_directory, exclude_patterns, selected_files)
    
    print("Code structure and context generated successfully.")

if __name__ == "__main__":
    main()
