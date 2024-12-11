#!/usr/bin/env python3
import os
import sys
import yaml
import json
from jinja2 import Environment, FileSystemLoader

def load_yaml(file_path):
    if not os.path.exists(file_path):
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def load_json(file_path):
    if not os.path.exists(file_path):
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_text(file_path):
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def format_instructions(project_instructions):
    lines = []
    if "project_name" in project_instructions:
        lines.append(f"**Project Name:** {project_instructions['project_name']}\n")
    if "objectives" in project_instructions:
        lines.append("**Objectives:**")
        for obj in project_instructions["objectives"]:
            lines.append(f"- {obj}")
        lines.append("")
    if "code_conventions" in project_instructions:
        lines.append("**Code Conventions:**")
        cc = project_instructions["code_conventions"]
        if "language_stack" in cc:
            lines.append("Language Stack:")
            for k,v in cc["language_stack"].items():
                lines.append(f"- {k}: {v}")
        if "directories_structure" in cc:
            lines.append("Directories Structure:")
            for k,v in cc["directories_structure"].items():
                lines.append(f"- {k}: {v}")
        if "coding_style" in cc:
            lines.append("Coding Style:")
            for rule in cc["coding_style"]:
                lines.append(f"- {rule}")
        lines.append("")

    if "privacy_and_legal" in project_instructions:
        lines.append("**Privacy and Legal:**")
        for rule in project_instructions["privacy_and_legal"]:
            lines.append(f"- {rule}")
        lines.append("")

    if "performance_and_architecture" in project_instructions:
        lines.append("**Performance and Architecture:**")
        for p in project_instructions["performance_and_architecture"]:
            lines.append(f"- {p}")
        lines.append("")

    if "ux_guidelines" in project_instructions:
        lines.append("**UX Guidelines:**")
        for ux in project_instructions["ux_guidelines"]:
            lines.append(f"- {ux}")
        lines.append("")

    if "advertising" in project_instructions:
        lines.append("**Advertising:**")
        for ad in project_instructions["advertising"]:
            lines.append(f"- {ad}")
        lines.append("")

    if "evolutivity" in project_instructions:
        lines.append("**Evolutivity:**")
        for evo in project_instructions["evolutivity"]:
            lines.append(f"- {evo}")
        lines.append("")

    return "\n".join(lines)

def format_codebase_context(codebase_context):
    lines = []
    files = codebase_context.get("files", [])
    if files:
        lines.append("**Codebase Key Files Context:**")
        for f_info in files:
            path = f_info.get("path", "unknown path")
            desc = f_info.get("description", "")
            lines.append(f"- **{path}:** {desc}")
    return "\n".join(lines)

def load_format_instructions(chosen_format):
    format_path = os.path.join("config", "formats", f"{chosen_format}.yaml")
    data = load_yaml(format_path)
    if not data:
        # Format non trouvé ou fichier vide, fallback sur none
        data = load_yaml(os.path.join("config", "formats", "none.yaml"))
    lines = []
    lines.append(f"**Selected Response Format:** {chosen_format}\n")
    if "instructions" in data and data["instructions"]:
        lines.append("Instructions:")
        for instr in data["instructions"]:
            lines.append(f"- {instr}")
        lines.append("")
    if "examples" in data and data["examples"]:
        lines.append("Examples:")
        for ex in data["examples"]:
            lines.append(ex)
        lines.append("")
    return "\n".join(lines)

def format_project_structure(code_structure):
    if not code_structure:
        return ""
    lines = []
    lines.append("**Project Structure (files included):**")
    for item in code_structure:
        lines.append(f"- {item['path']}")
    return "\n".join(lines)

def main():
    project_instructions = load_yaml("config/project_instructions.yaml")
    codebase_context = load_yaml("config/codebase_context.yaml")
    code_structure = load_json("data/code_structure.json")
    settings = load_yaml("config/settings.yaml")

    code_context_full = load_text("data/code_context.md")

    final_request = load_text("config/final_request.txt").strip()
    if not final_request:
        final_request = "Please explain the codebase."

    supported_formats = settings.get("settings", {}).get("supported_formats", ["markdown"])

    chosen_format = None
    while True:
        print("Formats disponibles :")
        for f in supported_formats:
            print(f"- {f}")
        user_input = input("Veuillez saisir un format : ").strip().lower()
        if user_input not in supported_formats:
            print(f"Erreur : Le format '{user_input}' n'est pas supporté. Veuillez sélectionner un format valide.\n")
        else:
            chosen_format = user_input
            break

    instructions_str = format_instructions(project_instructions)
    codebase_context_str = format_codebase_context(codebase_context)
    response_format_str = load_format_instructions(chosen_format)
    project_structure_str = format_project_structure(code_structure)

    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("prompt_template.jinja2")

    prompt = template.render(
        instructions=instructions_str,
        project_structure=project_structure_str,
        codebase_context=codebase_context_str,
        response_format=response_format_str,
        request=final_request,
        full_code_context=code_context_full
    )

    print(prompt)

if __name__ == "__main__":
    main()
