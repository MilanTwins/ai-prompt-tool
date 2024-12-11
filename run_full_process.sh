#!/usr/bin/env bash

set -e

echo "Checking required directories..."
REQUIRED_DIRS=("config" "output" "templates" "scripts")
for d in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$d" ]; then
        echo "Error: Directory '$d' not found."
        exit 1
    fi
done

if [ ! -f "config/user_config.yaml" ]; then
    echo "Error: 'config/user_config.yaml' not found."
    exit 1
fi

if [ ! -f "config/project_data.yaml" ]; then
    echo "Error: 'config/project_data.yaml' not found."
    exit 1
fi

if [ ! -f "config/final_request.yaml" ]; then
    echo "Error: 'config/final_request.yaml' not found."
    exit 1
fi

if [ ! -d "config/formats" ]; then
    echo "Error: 'config/formats' directory not found."
    exit 1
fi

if [ ! -f "templates/prompt_template.xml.jinja2" ]; then
    echo "Error: Template file 'prompt_template.xml.jinja2' not found."
    exit 1
fi

if [ ! -f "scripts/generate_structure.py" ] || [ ! -f "scripts/generate_prompt.py" ]; then
    echo "Error: Required scripts not found."
    exit 1
fi

ABS_SOURCE_DIR=$(pwd)
echo "We are about to scan the project source directory at: $ABS_SOURCE_DIR"

echo "Running generate_structure.py..."
python3 scripts/generate_structure.py

if [ ! -f "output/code_structure.xml" ]; then
    echo "Error: 'output/code_structure.xml' not found after running generate_structure.py."
    exit 1
fi

if [ ! -f "output/code_context.xml" ]; then
    echo "Warning: 'output/code_context.xml' not found. Possibly no files included."
fi

echo "Formats disponibles :"
for file in config/formats/*.xml; do
    base=$(basename "$file" .xml)
    echo "- $base"
done

read -p "Veuillez saisir un format : " USER_FORMAT
USER_FORMAT=$(echo "$USER_FORMAT" | tr '[:upper:]' '[:lower:]')

if [ ! -f "config/formats/$USER_FORMAT.xml" ]; then
    echo "Erreur : Le format '$USER_FORMAT' n'est pas supporté."
    exit 1
fi

echo "Running generate_prompt.py..."
python3 scripts/generate_prompt.py "$USER_FORMAT" | tee output/final_prompt.xml

if [ ! -f "output/final_prompt.xml" ]; then
    echo "Error: 'output/final_prompt.xml' was not created."
    exit 1
fi

CHAR_COUNT=$(wc -m < output/final_prompt.xml | tr -d '[:space:]')
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

echo "----------------------------------------"
echo "Prompt successfully generated and saved to output/final_prompt.xml"
echo "Character count: $CHAR_COUNT"
echo "Estimated tokens (approx): $TOKEN_ESTIMATE"
echo "----------------------------------------"
echo "Process completed successfully."


# Après la génération du prompt
if [ -f "output/final_prompt.xml" ]; then
    # Détection de l'OS et copie automatique
    # Exemple simple (à adapter selon vos besoins) :
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        cat output/final_prompt.xml | pbcopy
        echo "Prompt copied to clipboard (macOS)."
    elif command -v xclip &> /dev/null; then
        # Linux avec xclip installé
        cat output/final_prompt.xml | xclip -selection clipboard
        echo "Prompt copied to clipboard (Linux via xclip)."
    elif command -v wl-copy &> /dev/null; then
        # Linux avec wl-copy (Wayland)
        cat output/final_prompt.xml | wl-copy
        echo "Prompt copied to clipboard (Linux via wl-copy)."
    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
        # Windows (Git Bash, Cygwin) / PowerShell
        cat output/final_prompt.xml | clip
        echo "Prompt copied to clipboard (Windows)."
    else
        echo "No known clipboard utility found. Please install xclip/wl-copy or use pbcopy/clip."
    fi
fi
