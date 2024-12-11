#!/usr/bin/env python3
import os
import fnmatch
import sys
import yaml
import xml.etree.ElementTree as ET

def load_settings():
    with open("config/user_config.yaml", "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
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

def main():
    source_directory, exclude_patterns = load_settings()

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high.")
        sys.exit(1)

    code_structure = ET.Element("code_structure")
    code_context = ET.Element("code_context")

    if not os.path.exists("output"):
        os.makedirs("output")

    for root, dirs, files in os.walk(source_directory, topdown=True):
        dirs[:] = [d for d in dirs if not is_excluded(os.path.join(root, d), exclude_patterns)]
        for filename in files:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, source_directory)
            if is_excluded(rel_path, exclude_patterns):
                continue

            item = ET.SubElement(code_structure, "file")
            item.text = rel_path

            _, ext = os.path.splitext(filename)
            code_lang = detect_language(ext)

            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as fc:
                    content = fc.read()
            except Exception as e:
                content = f"Could not read file: {e}"

            file_elem = ET.SubElement(code_context, "file")
            file_elem.set("path", rel_path)
            code_block = ET.SubElement(file_elem, "code")
            code_block.set("language", code_lang if code_lang else "none")
            lines = content.split('\n')
            for i, line in enumerate(lines, start=1):
                line_elem = ET.SubElement(code_block, "line")
                line_elem.set("number", str(i))
                line_elem.text = line

    ET.ElementTree(code_structure).write("output/code_structure.xml", encoding="utf-8", xml_declaration=True)
    ET.ElementTree(code_context).write("output/code_context.xml", encoding="utf-8", xml_declaration=True)

    print("Code structure and context generated successfully.")

if __name__ == "__main__":
    main()
