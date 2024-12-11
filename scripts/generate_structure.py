#!/usr/bin/env python3
import os
import json
import yaml
import fnmatch
import sys

def load_settings():
    """
    Load settings from config/settings.yaml
    """
    settings_path = os.path.join("config", "settings.yaml")
    if not os.path.exists(settings_path):
        raise FileNotFoundError("settings.yaml not found in config directory.")
    with open(settings_path, "r") as f:
        settings = yaml.safe_load(f)
    return settings["settings"]

def is_excluded(path, exclude_patterns):
    """
    Check if a given path matches any of the exclude patterns.
    """
    norm_path = path.replace("\\", "/")
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(norm_path, pattern) or pattern in norm_path:
            return True
    return False

def detect_language(extension):
    """
    Return a language name based on the file extension for code fencing in Markdown.
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
        ".md": "markdown",
    }
    return lang_map.get(extension, "")

def is_too_high_in_hierarchy(source_dir):
    """
    Check if the source directory is too high in the filesystem hierarchy.
    For example, we might disallow scanning root '/' or '/home' directly.
    
    Customize this logic as needed:
    - You could forbid scanning '/' or '/home'
    - You could ensure the directory is not above a certain known project directory
    """
    # Example: Disallow scanning if source_directory is '/' or '/home' (too broad)
    forbidden_paths = ["/", "/home"]
    abs_source = os.path.abspath(source_dir)
    if abs_source in forbidden_paths:
        return True
    
    # You can add more logic if needed.
    
    return False

def main():
    # Load settings
    settings = load_settings()
    source_directory = settings.get("source_directory", "../my-project")
    exclude_patterns = settings.get("exclude_patterns", [])

    abs_source = os.path.abspath(source_directory)
    print(f"About to scan: {abs_source}")

    if is_too_high_in_hierarchy(source_directory):
        print("Error: The source directory is too high in the filesystem hierarchy. Aborting.")
        sys.exit(1)

    user_input = input("Do you want to proceed? (y/n): ").strip().lower()
    if user_input != "y":
        print("Aborted by user.")
        sys.exit(0)

    code_structure = []
    code_context_lines = []

    # Ensure data directory exists
    if not os.path.exists("data"):
        os.makedirs("data")

    for root, dirs, files in os.walk(source_directory, topdown=True):
        dirs[:] = [d for d in dirs if not is_excluded(os.path.join(root, d), exclude_patterns)]

        for filename in files:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, source_directory)

            if is_excluded(rel_path, exclude_patterns):
                continue

            code_structure.append({"path": rel_path})

            _, ext = os.path.splitext(filename)
            code_lang = detect_language(ext)

            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as fc:
                    content = fc.read()
            except Exception as e:
                content = f"Could not read file due to: {e}"

            code_context_lines.append(f"## File: {rel_path}\n\n")
            if code_lang:
                code_context_lines.append(f"```{code_lang}\n{content}\n```\n\n")
            else:
                code_context_lines.append(f"```\n{content}\n```\n\n")

    # Write code_structure.json
    with open("data/code_structure.json", "w", encoding="utf-8") as f:
        json.dump(code_structure, f, indent=2)

    # Write code_context.md
    with open("data/code_context.md", "w", encoding="utf-8") as f:
        f.writelines(code_context_lines)

    print("Code structure and context generated successfully.")

if __name__ == "__main__":
    main()
