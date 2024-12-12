#!/usr/bin/env python3
import os
import fnmatch
import sys
import yaml
import xml.etree.ElementTree as ET

def load_settings():
    with open("config/user_config.yaml", "r", encoding="utf-8") as f:
        data = yaml.load(f, Loader=yaml.SafeLoader)
    source_directory = data.get("source_directory", ".")
    exclude_patterns = data.get("exclude_patterns", [])
    return source_directory, exclude_patterns

def is_excluded(path, exclude_patterns):
    norm_path = path.replace("\\", "/")
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(norm_path, pattern) or pattern in norm_path:
            return True
    return False

def detect_language(extension):
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
    return lang_map.get(extension, "")

def is_too_high_in_hierarchy(source_dir):
    forbidden_paths = ["/", "/home"]
    abs_source = os.path.abspath(source_dir)
    return abs_source in forbidden_paths

def build_tree_structure(source_directory, exclude_patterns):
    """
    Construit une structure interne représentant l'arborescence du projet.
    Renvoie un dictionnaire imbriqué, où chaque clé est un nom de répertoire,
    et "files" est une liste des fichiers, par exemple :
    {
      'name': '.',
      'directories': [
          {
             'name': 'src',
             'directories': [...],
             'files': [...]
          },
      ],
      'files': []
    }
    """
    tree = {
        'name': os.path.basename(os.path.normpath(source_directory)) or '.',
        'directories': [],
        'files': []
    }

    dir_map = {os.path.abspath(source_directory): tree}

    for root, dirs, files in os.walk(source_directory, topdown=True):
        dirs[:] = [d for d in dirs if not is_excluded(os.path.join(root, d), exclude_patterns)]
        current_node = dir_map[os.path.abspath(root)]

        for filename in files:
            full_path = os.path.join(root, filename)
            if not is_excluded(full_path, exclude_patterns):
                current_node['files'].append(filename)

        for d in dirs:
            abs_d = os.path.abspath(os.path.join(root, d))
            new_dir_node = {
                'name': d,
                'directories': [],
                'files': []
            }
            current_node['directories'].append(new_dir_node)
            dir_map[abs_d] = new_dir_node

    return tree

def tree_to_xml(parent_elem, node):
    """
    Convertit le dictionnaire 'node' en XML imbriqué.
    node = { 'name': str, 'directories': [...], 'files': [...] }
    """
    dir_elem = ET.SubElement(parent_elem, "directory", name=node['name'])
    for f in sorted(node['files']):
        file_elem = ET.SubElement(dir_elem, "file")
        file_elem.text = f
    for d in sorted(node['directories'], key=lambda x: x['name']):
        tree_to_xml(dir_elem, d)

def main():
    source_directory, exclude_patterns = load_settings()

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high.")
        sys.exit(1)

    if not os.path.exists("output"):
        os.makedirs("output")

    project_tree = build_tree_structure(source_directory, exclude_patterns)

    code_structure = ET.Element("code_structure")
    tree_to_xml(code_structure, project_tree)
    ET.ElementTree(code_structure).write("output/code_structure.xml", encoding="utf-8", xml_declaration=True)

    print("Code structure generated successfully.")

if __name__ == "__main__":
    main()
