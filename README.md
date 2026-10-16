# Task Force 9 website (GitHub Pages)

Upload the contents of this folder—not the outer `GitHub Pages` folder—to the
root of your GitHub repository. The site files belong directly at the
repository root so the homepage loads at `https://taskforce9.github.io/`.

```text
your-github-repository/
├── .github/
│   └── workflows/
│       └── pages.yml
├── build-site.mjs
├── index.html
├── package.json
├── package-lock.json
├── script.js
├── styles.css
├── assets/
├── activity/
│   └── index.html
├── wordle/
│   ├── config.js
│   ├── index.html
│   ├── game.css
│   └── game.js
└── README.md
```

`wordle/config.js` has the public Discord application ID and Wispbyte API
address configured; both the landing page and Activity load this shared file.
It must contain only public settings; never put a Discord client secret or bot
token in it.

In the GitHub repository, open **Settings → Pages** and choose **GitHub
Actions** as the build and deployment source. The workflow installs the locked
Node dependencies, bundles the Discord Embedded App SDK into the Activity, and
publishes the built site. The `dist/` and `node_modules/` folders are generated;
do not upload them.

If uploading through GitHub's website, include the workflow, `build-site.mjs`,
`package.json`, `package-lock.json`, and all listed site files. Make sure
`wordle/game.js` and `wordle/index.html` are updated too.

The repository page on `github.com` shows the README and file list; the
published Pages website is a separate URL. Open the Pages deployment URL from
the successful GitHub Actions run to see the actual website.

After deployment, use the Pages URL shown by the GitHub Actions deployment.
The Wordle Activity page is `https://taskforce9.github.io/wordle/`.
The Discord Activity uses the separate, unlinked entry page at
`https://taskforce9.github.io/activity/`. In the Discord Developer Portal,
keep the root mapping prefix as `/` and set its target to
`taskforce9.github.io/activity/`. The build puts the Activity's CSS, config,
and bundled game code alongside that entry page.
