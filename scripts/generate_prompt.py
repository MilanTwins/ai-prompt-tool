#!/usr/bin/env python3
import os
import sys
import yaml
import xml.etree.ElementTree as ET
import argparse
from jinja2 import Environment, FileSystemLoader

def load_user_config():
    with open("config/user_config.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def load_project_data():
    user_conf = load_user_config()
    project_data_file = user_conf.get("selected_project_data", "project_data.yaml")
    
    try:
        with open(f"config/{project_data_file}", "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data if data else {}
    except Exception:
        return {}

def load_final_request():
    with open("config/final_request.yaml", "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data.get("final_request", "Please explain the codebase.")

def parse_code_context(root):
    files_data = []
    for f in root.findall("./file"):
        path = f.get("path", "")
        code_elem = f.find("./code")
        language = code_elem.get("language", "none") if code_elem is not None else "none"
        lines_data = []
        if code_elem is not None:
            for line_elem in code_elem.findall("./line"):
                text = line_elem.text if line_elem.text else ""
                lines_data.append({"text": text})
        files_data.append({"path": path, "language": language, "lines": lines_data})
    return files_data

def load_format_data(format_name):
    format_file = f"config/formats/{format_name}.txt"
    if not os.path.exists(format_file):
        print("Format file not found.")
        sys.exit(1)

    instructions = []
    examples = []
    current_section = None

    with open(format_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if line == '[INSTRUCTIONS]':
                current_section = 'instructions'
                continue
            elif line == '[EXAMPLES]':
                current_section = 'examples'
                continue

            if current_section == 'instructions' and line.strip():
                instructions.append(line.strip())
            elif current_section == 'examples' and line.strip():
                examples.append(line.strip())

    return instructions, examples

def main():
    parser = argparse.ArgumentParser(description="Generate a final prompt from project context.")
    parser.add_argument("format", help="The format for the prompt.")
    parser.add_argument("--include-role-and-expertise", action="store_true", help="Include the role and expertise section.")
    parser.add_argument("--include-final-request", action="store_true", help="Include the final request section.")
    parser.add_argument("--include-format-instructions", action="store_true", help="Include the format instructions section.")
    parser.add_argument("--include-project-info", action="store_true", help="Include the project information section.")
    parser.add_argument("--include-structure", action="store_true", help="Include the project structure section.")
    parser.add_argument("--include-code-content", action="store_true", help="Include the code content section.")
    
    args = parser.parse_args()
    chosen_format = args.format.lower()

    project_data = load_project_data()
    final_request = load_final_request()

    # Load generated contexts
    code_files = []
    if os.path.exists("output/code_context.xml"):
        root_cc = ET.parse("output/code_context.xml").getroot()
        code_files = parse_code_context(root_cc)

    code_structure = ""
    if os.path.exists("output/code_structure.txt"):
        with open("output/code_structure.txt", "r", encoding="utf-8") as f:
            code_structure = f.read().strip()
    elif os.path.exists("output/code_structure.xml"):
        with open("output/code_structure.xml", "r", encoding="utf-8") as f:
            code_structure = f.read().strip()

    # Build files_info from codebase_context if it exists
    files_root = ET.Element("files")
    if "codebase_context" in project_data:
        for cf in project_data["codebase_context"]:
            file_elem = ET.SubElement(files_root, "file")
            p = ET.SubElement(file_elem, "path")
            p.text = cf.get("path", "")
            d = ET.SubElement(file_elem, "description")
            d.text = cf.get("description", "")
    files_info = files_root.findall("./file")

    # Load format from .txt file
    format_instructions, format_examples = load_format_data(chosen_format)

    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("prompt_template.txt.jinja2")

    # Prepare template context
    prompt_options = {
        "include_role_and_expertise": args.include_role_and_expertise,
        "include_final_request": args.include_final_request,
        "include_format_instructions": args.include_format_instructions,
        "include_project_info": args.include_project_info,
        "include_structure": args.include_structure,
        "include_code_content": args.include_code_content,
    }

    template_context = {
        "project_name": project_data.get("project_name", ""),
        "project_data": project_data,
        "code_structure": code_structure,
        "files_info": files_info,
        "code_files": code_files,
        "request": final_request,
        "chosen_format": chosen_format,
        "format_instructions": format_instructions,
        "format_examples": format_examples,
        "prompt_options": prompt_options
    }

    prompt = template.render(**template_context)
    print(prompt)

if __name__ == "__main__":
    main()
