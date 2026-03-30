#!/bin/bash

# =============================================================================
# ACE Dashboard - Interactive Uninstaller
# =============================================================================
# This script removes the ACE Dashboard symlinks from Mainsail/Fluidd,
# removes the Moonraker component, and cleans up configuration.
#
# Usage: ./uninstall.sh
# =============================================================================

set -u

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Resolve installation user/home for defaults
INSTALL_USER="${SUDO_USER:-$(id -un)}"
INSTALL_HOME="$(getent passwd "$INSTALL_USER" 2>/dev/null | cut -d: -f6 || true)"
if [ -z "$INSTALL_HOME" ]; then
    INSTALL_HOME="$HOME"
fi

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Yes/No prompt
prompt_yes_no() {
    local prompt="$1"
    local response
    while true; do
        read -p "$(echo -e ${BLUE}${prompt}${NC} [y/N]: )" response
        case "$response" in
            [yY][eE][sS]|[yY]) return 0 ;;
            [nN][oO]|[nN]|"") return 1 ;;
            *) echo "Please answer y or n" ;;
        esac
    done
}

# Prompt for input with default
prompt_input() {
    local prompt="$1"
    local default="$2"
    local response
    read -p "$(echo -e ${BLUE}${prompt}${NC} [${default}]: )" response
    echo "${response:-$default}"
}

# Remove a symlink if it exists (only if it's a symlink)
remove_symlink() {
    local file="$1"
    local description="$2"
    if [ -L "$file" ]; then
        local target=$(readlink "$file")
        rm -f "$file"
        print_success "Removed symlink: $file (pointed to $target)"
        return 0
    elif [ -e "$file" ]; then
        print_warning "$file exists but is not a symlink. Skipping."
        return 1
    else
        print_info "$file not found (already removed)."
        return 0
    fi
}

# Remove [ace_status] section from moonraker.conf (create backup first)
remove_moonraker_section() {
    local conf="$1"
    if [ ! -f "$conf" ]; then
        print_warning "$conf does not exist, nothing to do."
        return 0
    fi

    # Check if section exists
    if ! grep -qi '^[[:space:]]*\[ace_status\]' "$conf"; then
        print_info "No [ace_status] section found in $conf"
        return 0
    fi

    # Create backup
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup="${conf}.backup_uninstall_${timestamp}"
    cp "$conf" "$backup"
    print_success "Backed up $conf → $backup"

    # Remove the section using awk
    # This removes lines from the first line matching [ace_status] (possibly with spaces)
    # until the next line that starts with '[' (next section) or end of file.
    awk '
        BEGIN { in_section = 0; output = 1; }
        /^[[:space:]]*\[ace_status\]/ { in_section = 1; output = 0; next; }
        /^[[:space:]]*\[/ && in_section { in_section = 0; output = 1; }
        output { print }
    ' "$conf" > "${conf}.tmp" && mv "${conf}.tmp" "$conf"

    print_success "Removed [ace_status] section from $conf"
}

# ============================================================================
# Main Uninstall
# ============================================================================

main() {
    print_header "ACE Dashboard - Interactive Uninstaller"

    # ========================================================================
    # Gather user input for target locations
    # ========================================================================

    # 1. Mainsail
    if prompt_yes_no "\nRemove dashboard files from Mainsail?"; then
        DEFAULT_MAINSAIL_DIR="$INSTALL_HOME/mainsail"
        MAINSAIL_DIR=$(prompt_input "Mainsail installation directory" "$DEFAULT_MAINSAIL_DIR")
        if [ ! -d "$MAINSAIL_DIR" ]; then
            print_warning "Directory $MAINSAIL_DIR does not exist."
            if ! prompt_yes_no "Continue anyway?"; then
                MAINSAIL_DIR=""
            fi
        fi
    else
        MAINSAIL_DIR=""
    fi

    # 2. Fluidd
    if prompt_yes_no "\nRemove dashboard files from Fluidd?"; then
        DEFAULT_FLUIDD_DIR="$INSTALL_HOME/fluidd"
        FLUIDD_DIR=$(prompt_input "Fluidd installation directory" "$DEFAULT_FLUIDD_DIR")
        if [ ! -d "$FLUIDD_DIR" ]; then
            print_warning "Directory $FLUIDD_DIR does not exist."
            if ! prompt_yes_no "Continue anyway?"; then
                FLUIDD_DIR=""
            fi
        fi
    else
        FLUIDD_DIR=""
    fi

    # 3. Moonraker component
    if prompt_yes_no "\nRemove Moonraker ACE status component?"; then
        DEFAULT_MOONRAKER_DIR="$INSTALL_HOME/moonraker"
        MOONRAKER_DIR=$(prompt_input "Moonraker installation directory" "$DEFAULT_MOONRAKER_DIR")
        if [ ! -d "$MOONRAKER_DIR" ]; then
            print_error "Moonraker directory not found: $MOONRAKER_DIR"
            print_info "Skipping Moonraker component removal."
            MOONRAKER_DIR=""
        else
            DEFAULT_MOONRAKER_CONF="$INSTALL_HOME/printer_data/config/moonraker.conf"
            MOONRAKER_CONF=$(prompt_input "moonraker.conf path" "$DEFAULT_MOONRAKER_CONF")
        fi
    else
        MOONRAKER_DIR=""
    fi

    # ========================================================================
    # Summary
    # ========================================================================

    echo ""
    print_header "Uninstall Summary"
    if [ -n "$MAINSAIL_DIR" ]; then
        echo "Mainsail:  $MAINSAIL_DIR"
    else
        echo "Mainsail:  not selected"
    fi
    if [ -n "$FLUIDD_DIR" ]; then
        echo "Fluidd:    $FLUIDD_DIR"
    else
        echo "Fluidd:    not selected"
    fi
    if [ -n "$MOONRAKER_DIR" ]; then
        echo "Moonraker component: $MOONRAKER_DIR/moonraker/components/ace_status.py"
        echo "Moonraker config:    $MOONRAKER_CONF"
    else
        echo "Moonraker component: not selected"
    fi

    if ! prompt_yes_no "\nProceed with uninstallation?"; then
        print_info "Uninstall cancelled."
        exit 0
    fi

    # ========================================================================
    # Remove symlinks from Mainsail/Fluidd
    # ========================================================================

    if [ -n "$MAINSAIL_DIR" ]; then
        print_header "Removing dashboard files from Mainsail"
        for file in ace.html ace-dashboard.js ace-dashboard.css ace-dashboard-config.js favicon.svg; do
            remove_symlink "$MAINSAIL_DIR/$file" "Mainsail $file"
        done
    fi

    if [ -n "$FLUIDD_DIR" ]; then
        print_header "Removing dashboard files from Fluidd"
        for file in ace.html ace-dashboard.js ace-dashboard.css ace-dashboard-config.js favicon.svg; do
            remove_symlink "$FLUIDD_DIR/$file" "Fluidd $file"
        done
    fi

    # ========================================================================
    # Remove Moonraker component
    # ========================================================================

    moonraker_changed=0

    if [ -n "$MOONRAKER_DIR" ]; then
        print_header "Removing Moonraker ACE status component"
        COMPONENT_FILE="$MOONRAKER_DIR/moonraker/components/ace_status.py"
        remove_symlink "$COMPONENT_FILE" "Moonraker ace_status component"
        if [ $? -eq 0 ] && [ -L "$COMPONENT_FILE" ]; then
            moonraker_changed=1
        fi

        if [ -n "$MOONRAKER_CONF" ]; then
            if prompt_yes_no "\nRemove [ace_status] section from $MOONRAKER_CONF?"; then
                remove_moonraker_section "$MOONRAKER_CONF"
                moonraker_changed=1
            else
                print_info "Skipping moonraker.conf modification."
            fi
        fi
    fi

    # ========================================================================
    # Optional: Remove generated config files
    # ========================================================================

    if prompt_yes_no "\nRemove generated configuration files (ace_dashboard_settings.json, ace_orca_presets.json) from printer config directory?"; then
        PRINTER_CONFIG_DIR="$INSTALL_HOME/printer_data/config"
        if [ -d "$PRINTER_CONFIG_DIR" ]; then
            rm -f "$PRINTER_CONFIG_DIR/ace_dashboard_settings.json"
            rm -f "$PRINTER_CONFIG_DIR/ace_orca_presets.json"
            print_success "Removed config files from $PRINTER_CONFIG_DIR"
        else
            print_warning "Printer config directory not found: $PRINTER_CONFIG_DIR"
        fi
    else
        print_info "Skipped removing config files."
    fi

    # ========================================================================
    # Restart Moonraker if needed
    # ========================================================================

    if [ $moonraker_changed -eq 1 ]; then
        print_header "Moonraker Restart"
        echo "Moonraker component and/or configuration have been removed."
        if prompt_yes_no "Restart Moonraker service now?"; then
            print_info "Restarting Moonraker..."
            sudo systemctl restart moonraker
            if [ $? -eq 0 ]; then
                print_success "Moonraker restarted"
            else
                print_error "Failed to restart Moonraker"
            fi
        else
            print_warning "Moonraker not restarted. You can restart manually:"
            echo "  sudo systemctl restart moonraker"
        fi
    fi

    # ========================================================================
    # Uninstall complete
    # ========================================================================

    print_header "Uninstall Complete!"
    echo "The ACE Dashboard has been removed from your system."
    echo ""
    echo "If you also want to delete the original source repository, you can remove it manually:"
    echo "  rm -rf $(dirname "$(readlink -f "$0")")"
    echo ""
    echo "Thank you for using ACE Dashboard!"
}

# ============================================================================
# Entry Point
# ============================================================================

if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi