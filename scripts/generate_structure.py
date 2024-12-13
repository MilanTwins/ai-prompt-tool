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
    return lang_map.get(extension.lower(), "text")

def is_too_high_in_hierarchy(source_dir):
    forbidden_paths = ["/", "/home"]
    abs_source = os.path.abspath(source_dir)
    return abs_source in forbidden_paths

def build_tree_structure(source_directory, exclude_patterns, selected_files):
    """
    Construit une structure interne représentant l'arborescence du projet.
    """
    # Convert selected_files paths to be relative to source_directory
    source_dir_abs = os.path.abspath(source_directory)
    normalized_selected_files = set()
    for file_path in selected_files:
        if isinstance(file_path, str):
            if os.path.isabs(file_path):
                rel_path = os.path.relpath(file_path, source_dir_abs)
            else:
                rel_path = file_path
            normalized_selected_files.add(rel_path.replace('\\', '/'))

    # Create code_context for storing file contents
    code_context_root = ET.Element("code_context")

    # Create structure output string
    structure_output = []
    
    def process_directory(dir_path, level=0):
        items = sorted(os.listdir(dir_path))
        dirs = []
        files = []
        
        for item in items:
            full_path = os.path.join(dir_path, item)
            rel_path = os.path.relpath(full_path, source_directory).replace('\\', '/')
            
            if is_excluded(full_path, exclude_patterns):
                continue
                
            if os.path.isdir(full_path):
                dirs.append(item)
            elif rel_path in normalized_selected_files:
                files.append(item)
                
                # Add file to code context
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
        
        if dirs or files:
            indent = "  " * level
            if level == 0:
                structure_output.append(f"Project Root: {os.path.basename(dir_path) or '.'}")
            else:
                structure_output.append(f"{indent}Directory: {os.path.basename(dir_path)}/")
            
            for f in sorted(files):
                structure_output.append(f"{indent}  - {f}")
            
            for d in sorted(dirs):
                process_directory(os.path.join(dir_path, d), level + 1)
    
    process_directory(source_directory)
    
    # Write code context to file
    if not os.path.exists("output"):
        os.makedirs("output")
    
    # Save code context as XML (needed for backward compatibility)
    ET.ElementTree(code_context_root).write("output/code_context.xml", 
                                          encoding="utf-8", 
                                          xml_declaration=True)
    
    # Save structure as text file
    with open("output/code_structure.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(structure_output))

def main():
    source_directory, exclude_patterns, selected_files = load_settings()

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high.")
        sys.exit(1)

    if not os.path.exists("output"):
        os.makedirs("output")

    # Remove existing files if they exist
    for file in ["code_context.xml", "code_structure.txt"]:
        path = os.path.join("output", file)
        if os.path.exists(path):
            os.remove(path)

    build_tree_structure(source_directory, exclude_patterns, selected_files)
    print("Code structure generated successfully.")

if __name__ == "__main__":
    main()
