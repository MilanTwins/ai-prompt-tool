# AI Prompt Tool

## Project Overview

The AI Prompt Tool is a sophisticated system designed to generate structured prompts for AI models. It analyzes a given codebase, extracts relevant information, and creates a comprehensive prompt that includes project instructions, structure, context, and specific requests.

## Project Structure

The project is organized into the following main components:

- `config/`: Contains configuration files for project instructions, codebase context, response format, and settings.
- `data/`: Stores generated data such as code structure and context.
- `scripts/`: Houses Python scripts for generating project structure and prompts.
- `templates/`: Contains the Jinja2 template for the final prompt.

Key files:
- `run_full_process.sh`: Main script to execute the entire prompt generation process.
- `scripts/generate_structure.py`: Generates the project structure and code context.
- `scripts/generate_prompt.py`: Creates the final prompt using the gathered information.
- `templates/prompt_template.jinja2`: Template for structuring the final prompt.

## How It Works

1. The `run_full_process.sh` script orchestrates the entire process:
   - Checks for required directories and files.
   - Reads the source directory from settings.
   - Runs `generate_structure.py` to analyze the project structure.
   - Executes `generate_prompt.py` to create the final prompt.

2. `generate_structure.py` (not provided in the given files) likely scans the project directory and generates:
   - `data/code_structure.json`: A JSON representation of the project structure.
   - `data/code_context.md`: A Markdown file containing relevant code snippets and context.

3. `generate_prompt.py`:
   - Loads configuration files from the `config/` directory.
   - Formats the loaded data into structured sections.
   - Uses the Jinja2 template to render the final prompt.
   - Outputs the generated prompt to stdout, which is then redirected to `data/final_prompt.txt`.

4. The final prompt includes:
   - Project instructions
   - Project structure
   - Codebase context
   - Full code context
   - Expected response format
   - Specific request (from `config/final_request.txt`)

## Usage

1. Ensure all required directories and configuration files are present.
2. Customize the configuration files in the `config/` directory as needed.
3. Run the main script:
   ```
   ./run_full_process.sh
   ```
4. The generated prompt will be saved in `data/final_prompt.txt`.
5. Use the content of `data/final_prompt.txt` with your AI assistant or model.

## Customization

- Modify `config/project_instructions.yaml` to update project-specific instructions.
- Edit `config/codebase_context.yaml` to provide context for key files in your project.
- Adjust `config/response_format.yaml` to specify the desired format for AI responses.
- Update `config/settings.yaml` to change the source directory or other settings.
- Modify `config/final_request.txt` to customize the specific request for the AI model.

## Note

This tool is designed to create structured and context-rich prompts for AI models, particularly useful for code analysis, refactoring suggestions, or answering specific questions about a codebase. The generated prompt provides a comprehensive overview of the project, allowing the AI to give more accurate and relevant responses.
