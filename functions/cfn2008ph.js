const ADMIN_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin CFN</title>
  <meta name="robots" content="noindex,nofollow" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="site-shell admin-shell">
    <header class="topbar">
      <a href="/" class="brand">
        <img src="/logo.jpg" alt="Logo CFN" class="brand-logo" />
        <span><strong>/cfn2008ph</strong><small>Administration sécurisée</small></span>
      </a>
      <a class="admin-link" href="/">Retour au site</a>
    </header>

    <main class="admin-layout">
      <section class="panel is-visible">
        <div class="panel-head">
          <p class="eyebrow">Authentification sécurisée</p>
          <h2>Gestion des événements</h2>
          <p class="panel-note">Ajouter, modifier, supprimer, joindre plusieurs photos et garder le même style que les cartes publiques.</p>
        </div>

        <div id="authBox" class="glass-card auth-box">
          <div class="form-grid single">
            <label class="form-field">
              <span>Utilisateur</span>
              <input id="username" type="text" autocomplete="username" placeholder="admin" />
            </label>
            <label class="form-field">
              <span>Mot de passe</span>
              <input id="password" type="password" autocomplete="current-password" placeholder="••••••••" />
            </label>
          </div>
          <button class="primary-btn" id="loginBtn" type="button">Se connecter</button>
          <p class="auth-note">Le mot de passe vient des variables Cloudflare, pas du code.</p>
        </div>

        <div id="editorBox" class="editor-grid hidden">
          <div class="glass-card editor-card">
            <div class="card-headline">
              <h3 id="formTitle">Ajouter un événement</h3>
              <button class="text-btn" id="newBtn" type="button">Nouveau</button>
            </div>

            <div class="form-grid">
              <label class="form-field"><span>Date</span><input id="eventDate" type="date" /></label>
              <label class="form-field"><span>Badge</span><input id="eventBadge" type="text" placeholder="22 avril 2026" /></label>
              <label class="form-field"><span>Catégorie</span><input id="eventCategory" type="text" placeholder="Conférence" /></label>
              <label class="form-field"><span>Titre</span><input id="eventTitle" type="text" placeholder="Nom de l’événement" /></label>
              <label class="form-field full"><span>Description</span><textarea id="eventDescription" placeholder="Résumé court"></textarea></label>
              <label class="form-field full"><span>Photos (plusieurs possibles)</span><input id="eventImages" type="file" accept="image/*" multiple /></label>
            </div>

            <div class="admin-actions">
              <button class="primary-btn" id="saveBtn" type="button">Ajouter</button>
              <button class="secondary-btn" id="resetBtn" type="button">Effacer</button>
              <button class="secondary-btn" id="exportBtn" type="button">Télécharger JSON</button>
              <button class="secondary-btn" id="copyBtn" type="button">Copier JSON</button>
            </div>
            <p class="hint">Les images sont stockées comme des données intégrées dans D1. C’est simple, pas magique.</p>
          </div>

          <div class="glass-card editor-card">
            <div class="card-headline">
              <h3>Événements enregistrés</h3>
              <button class="text-btn" id="refreshBtn" type="button">Rafraîchir</button>
            </div>
            <div id="previewList" class="preview-list"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script defer src="/admin.js"></script>
</body>
</html>`;

export async function onRequest() {
  return new Response(ADMIN_HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
