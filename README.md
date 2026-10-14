# Task Force 9 website

This is the public Task Force 9 community and recruitment site. It is a static website made with HTML, CSS, and JavaScript; it does not need a Python or Java server.

## Files needed on GitHub

To publish just the website, put these files in a GitHub repository with this folder structure:

```text
your-repository/
├── .github/
│   └── workflows/
│       └── pages.yml
└── website/
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── config.js
    └── assets/
        └── tf9-server-banner.png
```

`pages.yml` is required for the included GitHub Pages deployment workflow. Keep the banner in `website/assets/` or it will not appear on the site. The README is optional. You do not need to upload the Discord bot or its Python files to publish the website. For a separate website repository, copy the contents of this `website/` folder and the `.github/workflows/pages.yml` workflow into the same paths in the new repository.

**Keep private files off GitHub.** Do not upload `.env`, `secrets.json`, bot tokens, or private bot data. A separate website-only repository is the simplest way to avoid publishing them.

## Publish with GitHub Pages

1. Push the files above to the repository's `main` branch.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. The **Deploy Task Force 9 website** workflow will run on push. You can also start it from the **Actions** tab.
4. GitHub shows the published address in **Settings → Pages** after deployment.

## Preview and edit

Open `website/index.html` in a browser to preview the site.

To change the Discord invite, edit `website/config.js` and replace the `discordInvite` URL. This updates every Discord invite button.
