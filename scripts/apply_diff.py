#!/usr/bin/env python3
import sys
import re
import os
import subprocess
import tempfile
import yaml

def extract_diff_from_text(text):
    """
    Extracts the unified diff code block from the AI response.
    We look for a code block starting with <<<diff on a line
    and ending with >>> on a line, with no additional text outside.

    Updated the regex to handle different newline conventions.
    """
    pattern = r'^<<<diff\r?\n(.*?)\r?\n>>>$'
    match = re.search(pattern, text, flags=re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

def parse_diff(diff_content):
    """
    Parse the diff content and produce a summary of changes.
    """
    lines = diff_content.split('\n')
    file_changes = []
    current_file = None
    additions = 0
    deletions = 0

    file_start_regex = re.compile(r'^--- a/(.*)$')
    file_end_regex = re.compile(r'^\+\+\+ b/(.*)$')
    hunk_regex = re.compile(r'^@@ ')

    for line in lines:
        f_start = file_start_regex.match(line)
        f_end = file_end_regex.match(line)
        if f_start:
            if current_file:
                file_changes.append((current_file, additions, deletions))
            current_file = None
            additions = 0
            deletions = 0
        elif f_end:
            if f_end and current_file is None:
                current_file = f_end.group(1)
        elif current_file:
            if hunk_regex.match(line):
                continue
            else:
                if line.startswith('+') and not line.startswith('+++'):
                    additions += 1
                elif line.startswith('-') and not line.startswith('---'):
                    deletions += 1

    if current_file:
        file_changes.append((current_file, additions, deletions))

    return file_changes

def main():
    if len(sys.argv) < 2:
        print("Usage: apply_diff.py <ai_response_file>")
        sys.exit(1)

    response_file = sys.argv[1]

    if not os.path.isfile(response_file):
        print(f"Error: File '{response_file}' not found.")
        sys.exit(1)

    with open(response_file, 'r', encoding='utf-8') as f:
        content = f.read()

    diff_content = extract_diff_from_text(content)
    if not diff_content:
        print("Error: No diff code block found in the AI response.")
        print("The response must contain a diff block starting with <<<diff and ending with >>>")
        sys.exit(1)

    # Load user_config to determine source_directory
    user_config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'user_config.yaml')
    try:
        with open(user_config_path, 'r', encoding='utf-8') as uf:
            user_config = yaml.safe_load(uf) or {}
    except Exception as e:
        print(f"Error loading user_config.yaml: {e}")
        sys.exit(1)

    source_directory = user_config.get("source_directory", ".")
    if not os.path.isdir(source_directory):
        print(f"Error: The source_directory '{source_directory}' does not exist or is not a directory.")
        sys.exit(1)

    # Print the directory where we will apply the diff
    print(f"Applying diff in directory: {source_directory}")

    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.patch') as tmpfile:
        patch_path = tmpfile.name
        tmpfile.write(diff_content)

    try:
        # Run patch in the source_directory defined by user_config
        result = subprocess.run(
            ["patch", "-p1", "-i", patch_path],
            check=False,
            capture_output=True,
            text=True,
            cwd=source_directory
        )
        if result.returncode != 0:
            print("Failed to apply patch. Details:")
            print("\nPatch command output:")
            print(result.stdout)
            print("\nError messages:")
            print(result.stderr)
            print("\nPossible reasons for failure:")
            print("1. The files to be modified don't match the expected state")
            print("2. The files have been modified since the diff was created")
            print("3. The paths in the diff don't match your directory structure")
            print("\nRejected changes have been saved to .rej files")
            sys.exit(1)
        else:
            print("Patch applied successfully.\n")

            file_changes = parse_diff(diff_content)
            print("Summary of changes:")
            for fname, add, remove in file_changes:
                print(f"- {fname}: +{add} lines, -{remove} lines")
            print("\nNote: Please verify the changes in your files to ensure they were applied correctly.")
    finally:
        os.remove(patch_path)

if __name__ == "__main__":
    main()
