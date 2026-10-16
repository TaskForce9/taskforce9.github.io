# Task Force 9 website (GitHub Pages)

Upload the contents of this folder—not the outer `GitHub Pages` folder—to the
root of your GitHub repository. The site files belong directly at the
repository root so the homepage loads at `https://taskforce9.github.io/`.

```text
your-github-repository/
├── .github/
│   └── workflows/
│       └── pages.yml
├── index.html
├── config.js
├── script.js
├── styles.css
├── assets/
├── wordle/
└── README.md
```

`config.js` has the public Discord application ID and Wispbyte API address
configured. It must contain only public settings; never put a Discord client
secret or bot token in this file.

In the GitHub repository, open **Settings → Pages** and choose **GitHub
Actions** as the build and deployment source. The workflow publishes the
root-level site files listed above (not the repository README or workflow).

The repository page on `github.com` shows the README and file list; the
published Pages website is a separate URL. Open the Pages deployment URL from
the successful GitHub Actions run to see the actual website.

After deployment, use the Pages URL shown by the GitHub Actions deployment.
The Wordle Activity page is `https://taskforce9.github.io/wordle/`.
