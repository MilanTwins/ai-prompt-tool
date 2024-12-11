#!/usr/bin/env bash

# Exit on error
set -e

echo "Checking required directories..."
REQUIRED_DIRS=("config" "data" "templates" "scripts")
for d in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$d" ]; then
        echo "Error: Directory '$d' not found. Please create it and add necessary files."
        exit 1
    fi
done

echo "Checking required config files..."
REQUIRED_CONFIG=("config/project_instructions.yaml" "config/codebase_context.yaml" "config/settings.yaml")
for f in "${REQUIRED_CONFIG[@]}"; do
    if [ ! -f "$f" ]; then
        echo "Error: Configuration file '$f' not found."
        exit 1
    fi
done

# We don't strictly require final_request.txt and template here because they should already exist
if [ ! -f "config/final_request.txt" ]; then
    echo "Warning: 'config/final_request.txt' not found. A default request will be used."
fi

if [ ! -f "templates/prompt_template.jinja2" ]; then
    echo "Error: Template file 'templates/prompt_template.jinja2' not found."
    exit 1
fi

if [ ! -f "scripts/generate_structure.py" ] || [ ! -f "scripts/generate_prompt.py" ]; then
    echo "Error: generate_structure.py or generate_prompt.py not found in scripts."
    exit 1
fi

SOURCE_DIR=$(python3 -c "import yaml;f=open('config/settings.yaml');data=yaml.safe_load(f);print(data['settings']['source_directory'])" 2>/dev/null || true)
if [ -z "$SOURCE_DIR" ]; then
    SOURCE_DIR="./"
fi

ABS_SOURCE_DIR=$(cd "$SOURCE_DIR" && pwd)
echo "We are about to scan the project source directory at: $ABS_SOURCE_DIR"

read -p "Do you want to proceed? (y/n): " USER_INPUT
if [ "$USER_INPUT" != "y" ]; then
    echo "Aborted by user."
    exit 0
fi

echo "Running generate_structure.py..."
python3 scripts/generate_structure.py

if [ ! -f "data/code_structure.json" ]; then
    echo "Error: 'data/code_structure.json' not found after running generate_structure.py."
    exit 1
fi

if [ ! -f "data/code_context.md" ]; then
    echo "Warning: 'data/code_context.md' not found. Possibly no files included."
fi

echo "Running generate_prompt.py..."
python3 scripts/generate_prompt.py | tee data/final_prompt.txt

if [ ! -f "data/final_prompt.txt" ]; then
    echo "Error: 'data/final_prompt.txt' was not created."
    exit 1
fi

CHAR_COUNT=$(wc -m < data/final_prompt.txt | tr -d '[:space:]')
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

echo "----------------------------------------"
echo "Prompt successfully generated and saved to data/final_prompt.txt"
echo "Character count: $CHAR_COUNT"
echo "Estimated tokens (approx): $TOKEN_ESTIMATE"
echo "----------------------------------------"
echo "You can now use the content of 'data/final_prompt.txt' with your AI assistant."
echo "Process completed successfully."
