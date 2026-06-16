const fs = require('fs');
const path = require('path');

const CERT_POLICY = {
  AutoSelectCertificateForUrls: [
    '{"pattern":"https://[*.]computacenter.com","filter":{}}'
  ]
};

const CERT_PREFS = {
  '[*.]computacenter.com,*': {
    expiration: '0',
    last_modified: '0',
    model: 0,
    setting: { filters: [{}] }
  }
};

function findChromeForTesting() {
  const home = process.env.HOME;
  if (!home) return null;

  const cacheBase = path.join(home, '.cache', 'selenium', 'chrome-for-testing');
  const archDirs = ['mac-arm64', 'mac-x64'];

  for (const arch of archDirs) {
    const archPath = path.join(cacheBase, arch);
    if (!fs.existsSync(archPath)) continue;

    const versions = fs.readdirSync(archPath)
      .filter(d => fs.statSync(path.join(archPath, d)).isDirectory())
      .sort()
      .reverse();

    for (const version of versions) {
      const binary = path.join(
        archPath, version, `chrome-${arch}`,
        'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'
      );
      if (fs.existsSync(binary)) return binary;
    }
  }
  return null;
}

function setupBrowserProfile(profileDir) {
  const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
  for (const lock of lockFiles) {
    const lockPath = path.join(profileDir, lock);
    try { fs.unlinkSync(lockPath); } catch (_) {}
  }

  const defaultDir = path.join(profileDir, 'Default');
  const corruptMarkers = [
    path.join(defaultDir, 'LOCK'),
    path.join(defaultDir, 'lockfile'),
  ];
  for (const marker of corruptMarkers) {
    try { fs.unlinkSync(marker); } catch (_) {}
  }

  const gracefulExit = path.join(defaultDir, 'Preferences');
  if (fs.existsSync(gracefulExit)) {
    try {
      const raw = fs.readFileSync(gracefulExit, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.profile) {
        parsed.profile.exit_type = 'Normal';
        parsed.profile.exited_cleanly = true;
        fs.writeFileSync(gracefulExit, JSON.stringify(parsed, null, 2));
      }
    } catch (_) {}
  }

  const policyDir = path.join(profileDir, 'policies', 'managed');
  fs.mkdirSync(policyDir, { recursive: true });
  fs.writeFileSync(
    path.join(policyDir, 'auto_cert.json'),
    JSON.stringify(CERT_POLICY, null, 2)
  );

  fs.mkdirSync(defaultDir, { recursive: true });

  const prefsPath = path.join(defaultDir, 'Preferences');
  let prefs = {};
  if (fs.existsSync(prefsPath)) {
    try { prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8')); } catch (_) {}
  }

  prefs.profile = prefs.profile || {};
  prefs.profile.content_settings = prefs.profile.content_settings || {};
  prefs.profile.content_settings.exceptions = prefs.profile.content_settings.exceptions || {};
  prefs.profile.content_settings.exceptions.auto_select_certificate = CERT_PREFS;

  prefs.download = prefs.download || {};
  prefs.download.prompt_for_download = false;
  prefs.download.directory_upgrade = true;

  prefs.safebrowsing = prefs.safebrowsing || {};
  prefs.safebrowsing.enabled = false;

  prefs.profile = prefs.profile || {};
  prefs.profile.exit_type = 'Normal';
  prefs.profile.exited_cleanly = true;

  fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
}

const CHROME_ARGS = [
  '--ignore-certificate-errors',
  '--ignore-ssl-errors',
  '--allow-running-insecure-content',
  '--auto-ssl-client-auth',
  '--auth-server-allowlist=*.computacenter.com',
  '--auth-negotiate-delegate-allowlist=*.computacenter.com',
  '--disable-web-security',
  '--disable-blink-features=AutomationControlled',
  '--disable-search-engine-choice-screen',
  '--disable-extensions',
  '--disable-notifications',
  '--disable-popup-blocking',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-translate',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1920,1080',
];

module.exports = { findChromeForTesting, setupBrowserProfile, CHROME_ARGS };
