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
    selected_files = data.get("selected_files", [])
    return source_directory, exclude_patterns, selected_files

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

def build_tree_structure(source_directory, exclude_patterns, selected_files):
    """
    Construit une structure interne représentant l'arborescence du projet.
    """
    tree = {
        'name': os.path.basename(os.path.normpath(source_directory)) or '.',
        'directories': [],
        'files': []
    }

    dir_map = {os.path.abspath(source_directory): tree}

    # Convert selected_files paths to be relative to source_directory
    source_dir_abs = os.path.abspath(source_directory)
    normalized_selected_files = set()
    for file_path in selected_files:
        if isinstance(file_path, str):  # Ensure file_path is a string
            if os.path.isabs(file_path):
                rel_path = os.path.relpath(file_path, source_dir_abs)
            else:
                rel_path = file_path
            normalized_selected_files.add(rel_path.replace('\\', '/'))

    # Create code_context root element
    code_context_root = ET.Element("code_context")

    for root, dirs, files in os.walk(source_directory, topdown=True):
        dirs[:] = [d for d in dirs if not is_excluded(os.path.join(root, d), exclude_patterns)]
        current_node = dir_map[os.path.abspath(root)]

        for filename in files:
            if isinstance(filename, str):  # Ensure filename is a string
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, source_directory).replace('\\', '/')
                
                if not is_excluded(full_path, exclude_patterns) and rel_path in normalized_selected_files:
                    current_node['files'].append(filename)

                    # Add file to code context
                    file_elem = ET.SubElement(code_context_root, "file", path=rel_path)
                    code_elem = ET.SubElement(file_elem, "code", language=detect_language(os.path.splitext(filename)[1]))
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            for i, line in enumerate(f, 1):
                                line_elem = ET.SubElement(code_elem, "line", number=str(i))
                                line_elem.text = line.rstrip('\n')
                    except Exception as e:
                        print(f"Warning: Could not read file {full_path}: {e}")
                        continue

        for d in dirs:
            if isinstance(d, str):  # Ensure directory name is a string
                abs_d = os.path.abspath(os.path.join(root, d))
                new_dir_node = {
                    'name': d,
                    'directories': [],
                    'files': []
                }
                current_node['directories'].append(new_dir_node)
                dir_map[abs_d] = new_dir_node

    # Write code context to file
    if not os.path.exists("output"):
        os.makedirs("output")
    ET.ElementTree(code_context_root).write("output/code_context.xml", encoding="utf-8", xml_declaration=True)

    return tree

def tree_to_xml(parent_elem, node):
    """
    Convertit le dictionnaire 'node' en XML imbriqué.
    """
    dir_elem = ET.SubElement(parent_elem, "directory", name=node['name'])
    for f in sorted(node['files']):
        file_elem = ET.SubElement(dir_elem, "file")
        file_elem.text = f
    for d in sorted(node['directories'], key=lambda x: x['name']):
        tree_to_xml(dir_elem, d)

def main():
    source_directory, exclude_patterns, selected_files = load_settings()

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high.")
        sys.exit(1)

    if not os.path.exists("output"):
        os.makedirs("output")

    # Remove existing code_context.xml if it exists
    code_context_path = "output/code_context.xml"
    if os.path.exists(code_context_path):
        os.remove(code_context_path)

    project_tree = build_tree_structure(source_directory, exclude_patterns, selected_files)

    code_structure = ET.Element("code_structure")
    tree_to_xml(code_structure, project_tree)
    ET.ElementTree(code_structure).write("output/code_structure.xml", encoding="utf-8", xml_declaration=True)

    print("Code structure generated successfully.")

if __name__ == "__main__":
    main()
