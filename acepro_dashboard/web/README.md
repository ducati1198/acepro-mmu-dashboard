# ACE Dashboard (Mainsail/Fluidd compatible)

Static files for the ACE dashboard. Symlink them into the directory your UI serves:

- `ace.html`
- `ace-dashboard.css`
- `ace-dashboard.js`
- `ace-dashboard-config.js`
- `favicon.svg`
- (optional) `ace_dashboard.nginx.conf` sample


cd ~

git clone -b main https://github.com/ducati1198/AcePro-MMU-Dashboardd

source ~/klippy-env/bin/activate

- Mainsail: ln -s ~/ace_dashboard/web/ace.* ~/mainsail/
- Fluidd: ln -s ~/ace_dashboard/web/ace.* ~/fluidd/

Moonraker ace_status.py:

ln -s ~/ace_dashboard/moonraker/ace_status.py ~/moonraker/moonraker/components/

Open `http://<host>/ace.html` after linking. Adjust `ace-dashboard-config.js` if you need a fixed API host.

