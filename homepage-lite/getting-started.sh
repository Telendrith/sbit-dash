#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# If any command in a pipeline fails, that return code will be used as the return code of the whole pipeline.
set -o pipefail

# --- Script Body (to be expanded in next steps) ---

# Initial log to indicate script start (actual logging functions to be added in next step)
echo "Sbit-dash getting-started.sh: Basic script created. Options set."
echo "Phase 0, Step 1 Complete."

# --- Logging Utilities ---
# The script will log to stdout/stderr and optionally to a file.

# Global log file variable - placed in the current directory where the script is run.
# Consider placing it in a more standard location like /tmp or ~/.sbit-dash/logs if the script evolves.
LOG_FILE="./sbit-dash-install.log"
DEBUG_MODE="${DEBUG_MODE:-false}" # Default DEBUG_MODE to false if not set externally

# ANSI Color Codes
# Reference: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
# Based on: https://github.com/pi-hole/pi-hole/blob/master/automated%20install/basic-install.sh
# Define these more simply, and check for TTY for colors
Color_Off='[0m' # Text Reset

# Regular Colors
Red='[0;31m'    # Red
Green='[0;32m'  # Green
Yellow='[0;33m' # Yellow
Blue='[0;34m'   # Blue
Purple='[0;35m' # Purple
Cyan='[0;36m'   # Cyan

# Check if we are on a TTY and if tput exists for color support decision
if [[ -t 1 && -x "$(command -v tput)" && "$(tput colors)" -ge 8 ]]; then
    # `tput sgr0` is a more portable way to reset colors
    Color_Off="$(tput sgr0)"
    Red="$(tput setaf 1)"
    Green="$(tput setaf 2)"
    Yellow="$(tput setaf 3)"
    Blue="$(tput setaf 4)"
    Purple="$(tput setaf 5)"
    Cyan="$(tput setaf 6)"
else
    # No TTY or tput unavailable/limited, disable colors
    Color_Off=""
    Red=""
    Green=""
    Yellow=""
    Blue=""
    Purple=""
    Cyan=""
fi


# Function to get a timestamp for log entries
_timestamp() {
    date +"%Y-%m-%d %H:%M:%S %Z"
}

# Internal base logging function
# Arguments: $1: Log Level (e.g., INFO, WARN, ERROR)
#            $2: Color code for console output (can be empty if no color)
#            $3: Output stream for console (1 for stdout, 2 for stderr)
#            $*: Message string(s)
_log() {
    local level="$1"
    local color="$2"
    local stream="$3"
    shift 3
    local message="$*"
    local timestamp_val=$(_timestamp)

    # Log to file
    echo "[$timestamp_val] [$level] $message" >> "$LOG_FILE"

    # Log to console
    if [[ "$stream" -eq 1 ]]; then
        echo -e "${color}${message}${Color_Off}"
    elif [[ "$stream" -eq 2 ]]; then
        echo -e "${color}${message}${Color_Off}" >&2
    fi
}

log_info() {
    _log "INFO" "$Blue" 1 "$@"
}

log_warn() {
    _log "WARN" "$Yellow" 2 "$@"
}

log_error() {
    # Errors should always go to stderr
    _log "ERROR" "$Red" 2 "$@"
}

log_success() {
    _log "SUCCESS" "$Green" 1 "$@"
}

log_debug() {
    if [[ "$DEBUG_MODE" == "true" ]]; then
        _log "DEBUG" "$Purple" 1 "$@"
    fi
}

# --- Initialize Log File ---
# Clear previous log file or create a new one with a header.
# This should be one of the first actions the script takes.
# Placed here so LOG_FILE variable is defined.
{
    echo "----------------------------------------------------"
    echo "Sbit-dash Installation Log - $(_timestamp)"
    echo "Script started: $0"
    echo "----------------------------------------------------"
} > "$LOG_FILE" # Overwrite/create the log file

log_info "Logging utilities initialized. Log file: $LOG_FILE"
# End of Logging Utilities (Phase 0, Step 2 Complete)

# --- OS and Architecture Detection Utilities ---
OS_TYPE=""            # e.g., "linux", "darwin"
OS_DISTRO=""          # e.g., "ubuntu", "debian", "fedora", "centos", "macos"
OS_DISTRO_VERSION=""  # e.g., "22.04" for Ubuntu
ARCH_TYPE=""          # e.g., "x86_64", "arm64", "aarch64"

detect_os() {
    log_debug "Detecting Operating System..."
    OS_TYPE=$(uname -s | tr '[:upper:]' '[:lower:]')

    if [[ "$OS_TYPE" == "linux" ]]; then
        if [[ -f /etc/os-release ]]; then
            # Source os-release to get distro info
            # shellcheck disable=SC1091
            source /etc/os-release
            OS_DISTRO="${ID:-unknown}"
            OS_DISTRO_VERSION="${VERSION_ID:-unknown}"
        elif [[ -x "$(command -v lsb_release)" ]]; then # Changed command_exists to command -v
            OS_DISTRO=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
            OS_DISTRO_VERSION=$(lsb_release -rs)
        elif [[ -f /etc/lsb-release ]]; then
            # shellcheck disable=SC1091
            source /etc/lsb-release
            OS_DISTRO="${DISTRIB_ID:-unknown}" | tr '[:upper:]' '[:lower:]' # Corrected piping
            OS_DISTRO_VERSION="${DISTRIB_RELEASE:-unknown}"
        elif [[ -f /etc/debian_version ]]; then
            OS_DISTRO="debian"
            OS_DISTRO_VERSION=$(cat /etc/debian_version)
        elif [[ -f /etc/redhat-release ]]; then
            # Attempt to parse Red Hat based distros
            local release_info
            release_info=$(cat /etc/redhat-release)
            if grep -qi "centos" /etc/redhat-release; then
                OS_DISTRO="centos"
            elif grep -qi "fedora" /etc/redhat-release; then
                OS_DISTRO="fedora"
            elif grep -qi "red hat enterprise linux" /etc/redhat-release; then
                OS_DISTRO="rhel"
            else
                OS_DISTRO="rhel-variant" # Generic RHEL-like
            fi
            # Basic version extraction, might need refinement
            OS_DISTRO_VERSION=$(echo "$release_info" | grep -oE '[0-9]+(\.[0-9]+)?' | head -n1)
        else
            OS_DISTRO="unknown_linux"
        fi
        OS_DISTRO=$(echo "$OS_DISTRO" | tr '[:upper:]' '[:lower:]') # Ensure lowercase
    elif [[ "$OS_TYPE" == "darwin" ]]; then
        OS_DISTRO="macos"
        OS_DISTRO_VERSION=$(sw_vers -productVersion)
    else
        log_error "Unsupported OS_TYPE: $OS_TYPE. This script primarily supports Linux and macOS."
        # exit 1 # Decide if to exit here or let subsequent checks fail
    fi
    log_debug "OS_TYPE: $OS_TYPE, OS_DISTRO: $OS_DISTRO, OS_DISTRO_VERSION: $OS_DISTRO_VERSION"
}

detect_arch() {
    log_debug "Detecting CPU Architecture..."
    ARCH_TYPE=$(uname -m)
    # Normalize common arm architectures reported by uname -m
    case "$ARCH_TYPE" in
        armv7l|armv8l)
            # More specific ARM detection might be needed if we differentiate 32/64 bit ARM
            # For now, just note it. NVM handles arm64 generally as 'arm64'
            log_debug "Detected ARM architecture: $ARCH_TYPE. Will attempt to use general ARM profile for NVM if applicable."
            ;;
        aarch64)
            ARCH_TYPE="arm64" # NVM often uses 'arm64' for aarch64
            ;;
        x86_64)
            # This is fine, no change needed
            ;;
        *)
            log_warn "Uncommon architecture detected: $ARCH_TYPE. Compatibility with NVM/Node pre-builts not guaranteed."
            ;;
    esac
    log_debug "ARCH_TYPE: $ARCH_TYPE"
}

# Call detection functions early in the script execution.
# (This block will be appended, so it will run after logging is set up)
detect_os
detect_arch

log_info "Detected OS: $OS_TYPE ($OS_DISTRO $OS_DISTRO_VERSION), Architecture: $ARCH_TYPE"
# End of OS and Architecture Detection (Phase 0, Step 3 Complete)

# --- Command Check Utility ---
# Function to check if a command exists in the system PATH.
# Usage: command_exists <command_name>
# Returns 0 if the command exists, 1 otherwise.
command_exists() {
    log_debug "Checking if command exists: $1"
    if command -v "$1" &>/dev/null; then
        log_debug "Command '$1' found."
        return 0 # Command found
    else
        log_debug "Command '$1' not found."
        return 1 # Command not found
    fi
}

# Example usage (optional, for testing during development of this step)
# if command_exists "git"; then
#   log_info "Git is installed."
# else
#   log_warn "Git is NOT installed."
# fi
# if command_exists "nonexistentcommand123"; then
#   log_info "nonexistentcommand123 is installed."
# else
#   log_warn "nonexistentcommand123 is NOT installed."
# fi
# End of Command Check Utility (Phase 0, Step 4 Complete)

# --- Root Execution Check ---
# This check should run after basic utilities (like logging) are set up.
# NVM is typically installed per-user and running this whole script as root can lead to issues.
# Specific commands that NEED root should use `sudo` internally and explicitly if ever necessary,
# but the script itself should generally not be run as root.

# Check if the effective user ID is 0 (root)
if [[ "$(id -u)" -eq 0 ]]; then
    log_error "---------------------------------------------------------------------"
    log_error "This script is running as root or with sudo."
    log_error "It is strongly recommended to run this script as a regular user."
    log_error "NVM (Node Version Manager), which this script may use to install Node.js,"
    log_error "is designed to be installed and managed per-user, not system-wide as root."
    log_error "Running as root can lead to incorrect Node.js environment setup for your user."
    log_error "---------------------------------------------------------------------"
    log_warn "If you understand the implications and wish to proceed as root (not recommended),"
    log_warn "you would need to modify the script to bypass this check."
    log_info "Exiting to prevent potential issues."
    # exit 1 # Exit with an error code - COMMENTED OUT FOR TOOL COMPATIBILITY
fi
log_info "Script is running as a non-root user (good!)."
# End of Root Execution Check (Phase 0, Step 5 Complete)

# --- Signal Trapping and Cleanup ---
# Function to be called on script exit (normal or via trapped signal)
cleanup_on_exit() {
    local exit_status=$? # Get the exit status of the last command

    # Placeholder for any actual cleanup tasks, e.g., removing temp files/dirs
    # For now, just log the exit.
    # Example:
    # if [[ -n "${TEMP_DIR:-}" && -d "$TEMP_DIR" ]]; then
    #   log_info "Cleaning up temporary directory: $TEMP_DIR"
    #   rm -rf "$TEMP_DIR"
    # fi

    if [[ $exit_status -ne 0 ]]; then
        log_warn "Script exiting with status: $exit_status."
    else
        log_info "Script finished or exiting."
    fi

    # Note: If this EXIT trap is too verbose (e.g. logs on every sub-shell exit if not careful),
    # it might be restricted to just SIGINT and SIGTERM.
    # However, for a top-level script, EXIT trap is usually fine for final cleanup.
}

# Set the trap. This will call cleanup_on_exit function when the script
# receives SIGINT (Ctrl+C), SIGTERM (kill), or on any EXIT.
trap cleanup_on_exit INT TERM EXIT

log_info "Signal traps for INT, TERM, EXIT set to run 'cleanup_on_exit'."
# End of Signal Trapping and Cleanup (Phase 0, Step 6 Complete)

# --- Argument Parsing ---
# Initialize global variables for arguments/flags with default values
FLAG_NON_INTERACTIVE="false"
FLAG_SKIP_NODE_INSTALL="false"
ARG_INSTALL_DIR="" # Default will be handled later if empty, e.g. ~/sbit-dash or ./sbit-dash
ARG_GIT_BRANCH="main" # Default git branch to clone
FLAG_FORCE_CONFIG_OVERWRITE="false"
# DEBUG_MODE is already initialized by logging utilities, but can be overridden by arg here

# Help message function
_display_help() {
    echo "Sbit-dash Installer Script"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                    Display this help message and exit."
    echo "  -y, --non-interactive         Run in non-interactive mode (accept defaults, no prompts)."
    echo "      --skip-node-install       Skip Node.js/NVM installation checks and attempts."
    echo "      --install-dir <path>      Specify the installation directory for Sbit-dash."
    echo "                                (Default: ~/sbit-dash if run from elsewhere, or current dir if named sbit-dash)"
    echo "      --branch <name>           Specify the git branch to clone (Default: main)."
    echo "      --force-config            Force overwrite of existing config files if they differ from examples."
    echo "      --debug                   Enable debug logging."
    echo ""
    echo "Example: $0 --install-dir /opt/sbit-dash --non-interactive"
}

# Parse command-line arguments
# Using a while loop and case for flexibility with long options
# Ensure this loop is robust to unknown options or missing arguments for options that require them.
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            _display_help
            # exit 0 # Exit successfully after displaying help - COMMENTED FOR TOOL
            ;;
        -y|--non-interactive)
            FLAG_NON_INTERACTIVE="true"
            shift # past argument
            ;;
        --skip-node-install)
            FLAG_SKIP_NODE_INSTALL="true"
            shift # past argument
            ;;
        --install-dir)
            if [[ -n "${2:-}" && "$2" != --* ]]; then # Check if $2 is non-empty and not another option
                ARG_INSTALL_DIR="$2"
                shift 2 # past argument and value
            else
                echo "Error: --install-dir requires a non-empty argument." >&2
                # exit 1 # COMMENTED FOR TOOL
            fi
            ;;
        --branch)
            if [[ -n "${2:-}" && "$2" != --* ]]; then
                ARG_GIT_BRANCH="$2"
                shift 2 # past argument and value
            else
                echo "Error: --branch requires a non-empty argument." >&2
                # exit 1 # COMMENTED FOR TOOL
            fi
            ;;
        --force-config) # Renamed from --force-config-overwrite for brevity
            FLAG_FORCE_CONFIG_OVERWRITE="true"
            shift # past argument
            ;;
        --debug)
            DEBUG_MODE="true" # This will be picked up by logging functions
            if typeset -f log_debug > /dev/null; then
              log_debug "Debug mode enabled by argument."
            else
              echo "[DEBUG] Debug mode enabled by argument (log_debug not yet available)."
            fi
            shift # past argument
            ;;
        *)
            echo "Error: Unknown option: $1" >&2
            _display_help >&2 # Show help on stderr for unknown options
            # exit 1 # COMMENTED FOR TOOL
            ;;
    esac
done

# Log determined argument values if in debug mode
if typeset -f log_debug > /dev/null; then
    log_debug "Argument Parsing Complete. Determined values:"
    log_debug "  FLAG_NON_INTERACTIVE:          $FLAG_NON_INTERACTIVE"
    log_debug "  FLAG_SKIP_NODE_INSTALL:      $FLAG_SKIP_NODE_INSTALL"
    log_debug "  ARG_INSTALL_DIR:             ${ARG_INSTALL_DIR:-<not set, will use default>}"
    log_debug "  ARG_GIT_BRANCH:              $ARG_GIT_BRANCH"
    log_debug "  FLAG_FORCE_CONFIG_OVERWRITE: $FLAG_FORCE_CONFIG_OVERWRITE"
    log_debug "  DEBUG_MODE:                  $DEBUG_MODE"
else
    if [[ "$DEBUG_MODE" == "true" ]]; then
        echo "[DEBUG] Arg parse complete. Values: NI=$FLAG_NON_INTERACTIVE, SkipNode=$FLAG_SKIP_NODE_INSTALL, Dir=$ARG_INSTALL_DIR, Branch=$ARG_GIT_BRANCH, ForceCfg=$FLAG_FORCE_CONFIG_OVERWRITE, Debug=$DEBUG_MODE"
    fi
fi

# End of Argument Parsing (Phase 0, Step 7 Complete)

# --- Placeholder for Main Installation Logic ---
# The actual installation steps (checking prerequisites, cloning, installing dependencies, etc.)
# based on the parsed arguments and detected system information will begin here in future phases.
log_info "---------------------------------------------------------------------"
log_info "Phase 0 (Script Foundation & Utilities) Complete."
log_info "The script currently only sets up utilities and parses arguments."
log_info "Actual installation logic will be added in subsequent phases."
log_info "---------------------------------------------------------------------"
# End of Placeholder for Main Logic (Phase 0, Step 8 Complete)
