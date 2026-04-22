ACE Dashboard is a web‑based control panel for Anycubic Color Engine Pro (ACE) units running Klipper. It gives you complete, real‑time control over filament management, drying, and printer integration.

Key Features
Multi‑Instance Support – Switch between multiple ACE units connected to the same printer.

Filament Slot Management

View slot status (Ready / Empty / Busy)

Set material type, nozzle temperature, and filament color (with live color preview)

Assign Orca‑compatible preset names – saved to the printer and reloaded after reboot

Feed / Retract with custom length & speed

One‑click Load / Unload filament

Feed Assist (auto‑feed while printing) – enable/disable per slot

Preset Library

Import filament profiles from Orca Slicer .json files

Store material + temperature combinations

Apply presets directly to any slot (updates material, temp, and preset name)

Dryer Control

Set target temperature (20–55°C) and duration (hours + minutes)

Start / Stop drying cycle

Real‑time progress bar and remaining time countdown

Data Persistence

Save to Printer – exports all slot settings (material, temp, color, preset name) to a JSON file on the printer

Load from Printer – restores settings from that file and writes them to the ACE driver (with WebSocket updates temporarily blocked to prevent overwrites)

Save Inventory – pushes current slot data to the ACE driver and persists it to flash memory

Real‑time Status

WebSocket connection for instant updates

Live device status (temperature, firmware, USB port, RFID state)

Automatic refresh every 10 seconds

Quick Actions

Stop all Feed Assist on all instances

Refresh status manually

Dark Theme UI – Clean, modern interface with responsive layout for desktop and tablets.

# ACE Dashboard (Mainsail/Fluidd compatible)

Static files for the ACE dashboard. Symlink them into the directory your UI serves:

- `ace.html`
- `ace-dashboard.css`
- `ace-dashboard.js`
- `ace-dashboard-config.js`
- `favicon.svg`
- (optional) `ace_dashboard.nginx.conf` sample


How to use:

sudo apt-get update

sudo apt-get install -y git

cd ~

git clone -b main https://github.com/ducati1198/acepro-mmu-dashboard

cd ~/acepro-mmu-dashboard/acepro_dashboard

chmod +x install.sh

./install.sh

Answer the interactive prompts to choose which components to install and where.

Open `http://<host>/ace.html` after linking. Adjust `ace-dashboard-config.js` if you need a fixed API host.

To uninstall:

cd ~/acepro-mmu-dashboard

chmod +x uninstall.sh

./uninstall.sh

Follow the interactive prompts to choose which components to remove


AFTER A UPDATE OR FRESH INSTALL NEED TO FORCE A HARD REFRESH OR CLEAR YOUR CACHE IN YOUR BROWSER:

You can force a hard refresh on your browser each time you update:

Windows/Linux: Ctrl + F5 or Ctrl + Shift + R

Mac: Cmd + Shift + R
