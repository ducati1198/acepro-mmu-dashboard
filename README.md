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

cd ~/acepro-mmu-dashboard

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
