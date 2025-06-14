# Sbit-dash: Ideas for a "Smart" Install/Setup Script

This document outlines ideas and desired features for a future user-friendly setup script for Sbit-dash. The goal is to provide a smooth, guided, and robust installation experience, particularly for users who might not be deeply familiar with Node.js or manual setup processes.

## Inspiration

We draw inspiration from the setup scripts of well-regarded tools:

-   **Pi-hole (`curl | bash`)**: For its simplicity in execution and guided, interactive prompts.
-   **Docker Install Script**: For its robust OS detection, prerequisite handling, and idempotency.
-   **NVM/Nodenv/Volta**: For shell awareness (modifying `.bashrc`, `.zshrc`), clear post-install messages, and managing Node.js versions (though our script might just check for Node.js rather than install it).
-   **Homebrew**: For excellent edge-case handling, helpful guidance, and clear output.

## Core Philosophy

-   **User-Friendly**: Prioritize ease of use for non-developers or those new to self-hosting Node.js apps.
-   **Informative**: Provide clear messages at each step, explaining what's happening.
-   **Robust**: Handle common issues gracefully and provide helpful error messages.
-   **Idempotent**: Safe to re-run without negative side-effects (e.g., it shouldn't break an existing setup if run again).
-   **Optional**: The manual setup described in `README.md` should always remain the primary, fully supported method. This script is an enhancement.

## Desired Features & Functionality

1.  **Execution Method**:
    -   Aim for a simple `curl -sSL https://your-domain.com/install.sh | sudo bash` (if root needed for global dirs) or `bash` (if local install).
    -   Alternatively, a downloadable script that can be inspected and then run.

2.  **Prerequisite Checks**:
    -   **OS Detection**: Basic check (Linux, macOS). May not need extensive OS-specific logic initially if Node.js handles most OS differences.
    -   **`git`**: Check if `git` is installed (needed for cloning). Offer to install or provide instructions.
    -   **Node.js & npm**:
        -   Check if Node.js is installed.
        -   If not, guide user to install it (e.g., recommend NVM, Volta, or official Node.js installers). The script might optionally offer to install NVM and then the required Node.js version.
        -   Check if the installed Node.js version meets the project's `engines` requirement from `package.json`.
    -   **`curl`/`wget`**: Needed for the script itself if fetched via `curl | bash`.

3.  **Installation Steps (Interactive where appropriate)**:
    -   **Welcome Message**: Explain what the script will do.
    -   **Installation Directory**:
        -   Ask where to clone/install Sbit-dash (e.g., default to `./sbit-dash` or `~/sbit-dash`).
        -   Handle existing directory (e.g., update if it's a git repo, or ask to overwrite/skip).
    -   **Cloning**: `git clone` the repository. If already cloned, offer to `git pull` for updates.
    -   **Dependency Installation**: Run `npm ci` (or `npm install`). Show progress or a spinner.
    -   **Configuration Guidance**:
        -   Inform the user about the `config/` directory.
        -   Offer to copy example files if they exist (e.g., `settings.example.yaml` to `settings.yaml`).
        -   Potentially ask for very basic initial settings (e.g., "Enter a title for your dashboard (leave blank for default):").
    -   **Database Migration**: Run `npm run migrate`.
    -   **(Optional) System Service / Process Manager Setup**:
        -   For more advanced users, detect `systemd` or `pm2` and offer to create a basic service file to keep Sbit-dash running. This is a more complex feature.

4.  **Idempotency**:
    -   If `sbit-dash` directory exists, check if it's a valid git repo.
    -   If `node_modules` exists, maybe skip `npm install` or ask if user wants to re-install.
    -   Migrations should be idempotent by design (`CREATE TABLE IF NOT EXISTS`).

5.  **Error Handling & Logging**:
    -   Log each major step.
    -   If a command fails (e.g., `git clone`, `npm install`), print the error and suggest common fixes or where to find help.
    -   Create a log file of the installation process for debugging.

6.  **Post-Install Messages**:
    -   Confirm successful installation.
    -   How to start the server (`npm run dev`, `npm start`).
    -   URL to access the dashboard (e.g., `http://localhost:3000`).
    -   Location of configuration files.
    -   Location of the installation log file.
    -   Basic troubleshooting tips or link to `README.md`.

7.  **Non-Interactive Mode**:
    -   Allow all options to be passed as command-line arguments or environment variables for automated setups (e.g., `INSTALL_DIR=/opt/sbit-dash ./install.sh --non-interactive`).

## Potential Script Flow (Simplified)

1.  Parse arguments (for non-interactive mode).
2.  Display welcome.
3.  Check OS (basic).
4.  Check `git`.
5.  Check Node.js & npm (version check).
6.  Determine install directory (prompt if interactive).
7.  Clone or update repository.
8.  `cd` into directory.
9.  Run `npm ci`.
10. Guide through initial config (or use defaults/args).
11. Run `npm run migrate`.
12. Display success and post-install instructions.

## Open Questions / Considerations

-   **Root privileges**: When would they be absolutely necessary? (e.g., installing Node.js system-wide, setting up systemd service). Try to avoid if possible for a standard user-space install.
-   **Installing Node.js itself**: This is complex. Best to guide users to NVM/Volta or official installers rather than the script trying to do it for all OSes.
-   **Updating Sbit-dash**: Should the script also handle updating an existing installation? (e.g., `git pull`, re-run `npm ci`, `npm run migrate`).

This document serves as a starting point for designing a comprehensive and user-friendly installation experience for Sbit-dash.
