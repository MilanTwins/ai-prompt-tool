#!/usr/bin/env python3
import os
import sys
import xml.etree.ElementTree as ET
from jinja2 import Environment, FileSystemLoader
import yaml

def load_xml(file_path):
    if not os.path.exists(file_path):
        return None
    tree = ET.parse(file_path)
    return tree.getroot()

def get_text_from_xpath(root, xpath):
    elem = root.find(xpath)
    if elem is not None and elem.text:
        return elem.text.strip()
    return ""

def get_list_from_xpath(root, xpath):
    return [e.text.strip() for e in root.findall(xpath)]

def parse_code_context(root):
    files_data = []
    for f in root.findall("./file"):
        path = f.get("path", "")
        code_elem = f.find("./code")
        language = code_elem.get("language", "none") if code_elem is not None else "none"
        lines_data = []
        if code_elem is not None:
            for line_elem in code_elem.findall("./line"):
                number = line_elem.get("number", "0")
                text = line_elem.text if line_elem.text else ""
                lines_data.append({'number': number, 'text': text})
        files_data.append({
            'path': path,
            'language': language,
            'lines': lines_data
        })
    return files_data

def load_settings():
    with open("config/settings.yaml", "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    source_directory = data.get("source_directory", ".")
    exclude_patterns = data.get("exclude_patterns", [])
    return source_directory, exclude_patterns

def main():
    if len(sys.argv) < 2:
        print("Error: format argument missing.")
        sys.exit(1)

    chosen_format = sys.argv[1].lower()

    project_instructions = load_xml("config/project_instructions.xml")
    codebase_context = load_xml("config/codebase_context.xml")
    # On n'utilise plus le settings en XML
    # On charge juste pour valider le fonctionnement
    source_directory, exclude_patterns = load_settings()

    final_request = load_xml("config/final_request.xml")
    format_root = load_xml(f"config/formats/{chosen_format}.xml")

    code_files = []
    if os.path.exists("data/code_context.xml"):
        code_context_root = load_xml("data/code_context.xml")
        if code_context_root is not None:
            code_files = parse_code_context(code_context_root)

    code_structure = ""
    if os.path.exists("data/code_structure.xml"):
        with open("data/code_structure.xml", "r", encoding="utf-8") as f:
            code_structure = f.read().strip()

    project_name = get_text_from_xpath(project_instructions, "./project_name")
    objectives = get_list_from_xpath(project_instructions, "./objectives/objective")
    frontend_stack = get_text_from_xpath(project_instructions, "./code_conventions/language_stack/frontend")
    backend_stack = get_text_from_xpath(project_instructions, "./code_conventions/language_stack/backend")
    directories_frontend = get_text_from_xpath(project_instructions, "./code_conventions/directories_structure/frontend")
    directories_backend = get_text_from_xpath(project_instructions, "./code_conventions/directories_structure/backend")
    coding_style = get_list_from_xpath(project_instructions, "./code_conventions/coding_style/rule")
    privacy_and_legal = get_list_from_xpath(project_instructions, "./privacy_and_legal/item")
    performance_and_arch = get_list_from_xpath(project_instructions, "./performance_and_architecture/item")
    ux_guidelines = get_list_from_xpath(project_instructions, "./ux_guidelines/item")
    advertising = get_list_from_xpath(project_instructions, "./advertising/item")
    evolutivity = get_list_from_xpath(project_instructions, "./evolutivity/item")

    files_info = codebase_context.findall("./files/file")

    request_text = get_text_from_xpath(final_request, "./request")
    if not request_text:
        request_text = "Please explain the codebase."

    format_instructions = get_list_from_xpath(format_root, "./instructions/instruction")
    format_examples = get_list_from_xpath(format_root, "./examples/example")

    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("prompt_template.xml.jinja2")

    prompt = template.render(
        project_name=project_name,
        objectives=objectives,
        frontend_stack=frontend_stack,
        backend_stack=backend_stack,
        directories_frontend=directories_frontend,
        directories_backend=directories_backend,
        coding_style=coding_style,
        privacy_and_legal=privacy_and_legal,
        performance_and_arch=performance_and_arch,
        ux_guidelines=ux_guidelines,
        advertising=advertising,
        evolutivity=evolutivity,
        code_structure=code_structure,
        files_info=files_info,
        code_files=code_files,
        request=request_text,
        chosen_format=chosen_format,
        format_instructions=format_instructions,
        format_examples=format_examples
    )

    print(prompt)

if __name__ == "__main__":
    main()
