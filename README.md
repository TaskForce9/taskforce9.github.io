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
│   ├── game.js
│   ├── valid-words.json
│   └── VALID-WORDS-NOTICE.txt
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
add these URL mappings:

| Prefix | Target |
| --- | --- |
| `/api` | `tf9-game.wispbyte.app` |
| `/` | `taskforce9.github.io/activity/` |

Keep `/api` above `/` in the list. Discord consumes the `/api` mapping prefix
when forwarding a request, so the Activity calls paths such as
`/api/api/auth/exchange`: the first `/api` selects the mapping, and the second
is the API route on Wispbyte. The build puts the Activity's CSS, config, and
bundled game code alongside its entry page.

The Activity uses the mapped `/api` route rather than connecting to Wispbyte
directly. Publish the latest `wordle/game.js` through the Pages workflow. It
sends allowlisted startup/API failure categories and HTTP status codes to the
API's diagnostics route using a small GET request (no JSON preflight), trying
the direct API URL before the Discord-mapped route so that mapping failures can
still be reported. The bot must also run the latest
`Wispbyte/bot/main.py` and `Wispbyte/bot/wordle_activity.py` for events to
appear in the configured website-terminal channel. The reporter does not send
credentials, guesses, or free-form browser error messages.

The game accepts only valid five-letter English words from
`wordle/valid-words.json`; invalid guesses are rejected without consuming an
attempt. The same word list is used by the Wispbyte API. See
`wordle/VALID-WORDS-NOTICE.txt` for its source attribution and permission.
Upload the full `wordle/` directory, including these files, with the updated
game script, styles, and page markup.
Wispbyte's API must allow the Discord proxy origin derived from the application
ID (`https://<application-id>.discordsays.com`); the latest
`Wispbyte/bot/wordle_activity.py` adds that exact origin automatically. Upload
that file to Wispbyte and restart the bot after updating it.
