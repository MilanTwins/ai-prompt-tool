#!/usr/bin/env python3
import sys
import re
import os
import subprocess
import tempfile

def extract_diff_from_text(text):
    """
    Extracts the unified diff code block from the AI response.
    We now look for a code block starting with <<<diff on a line
    and ending with >>> on a line.

    The pattern:
    <<<diff
    ... diff lines ...
    >>>
    """

    # Regex to capture code block starting with <<<diff and ending with >>>
    # We use re.MULTILINE and re.DOTALL to handle line breaks.
    pattern = r'^<<<diff\s*\n(.*?)\n>>>\s*$'
    match = re.search(pattern, text, flags=re.DOTALL | re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None

def main():
    if len(sys.argv) < 2:
        print("Usage: apply_diff.py <ai_response_file>")
        sys.exit(1)

    response_file = sys.argv[1]

    if not os.path.isfile(response_file):
        print(f"Error: File '{response_file}' not found.")
        sys.exit(1)

    # Read the AI response
    with open(response_file, 'r', encoding='utf-8') as f:
        content = f.read()

    diff_content = extract_diff_from_text(content)
    if not diff_content:
        print("No diff code block found in the AI response.")
        sys.exit(1)

    # Write diff to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.patch') as tmpfile:
        patch_path = tmpfile.name
        tmpfile.write(diff_content)

    # Apply the patch
    try:
        result = subprocess.run(["patch", "-p1", "-i", patch_path], check=False, capture_output=True, text=True)
        if result.returncode != 0:
            print("Failed to apply patch. Output:")
            print(result.stdout)
            print(result.stderr)
            sys.exit(1)
        else:
            print("Patch applied successfully.")
    finally:
        # Remove the temporary patch file
        os.remove(patch_path)

if __name__ == "__main__":
    main()
