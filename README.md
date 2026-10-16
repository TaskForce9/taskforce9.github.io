# GitHub Pages repository files

The contents of this folder are arranged to match the root of your GitHub
repository. Upload the contents of this folder—not the outer `GitHub Pages`
folder—to the repository root.

```text
your-github-repository/
├── .github/
│   └── workflows/
│       └── pages.yml
└── website/
    ├── index.html
    ├── config.js
    ├── assets/
    ├── wordle/
    ├── script.js
    └── styles.css
```

`website/config.js` already has the Discord application ID and Wispbyte API
address configured. It must contain only public settings; never put a Discord
client secret or bot token in this file.

In the GitHub repository, open **Settings → Pages** and choose **GitHub
Actions** as the build and deployment source. The workflow publishes the
contents of `website/`.

After deployment, use the Pages URL shown by the GitHub Actions deployment.
The Wordle Activity page is that URL with `/wordle/` appended (for example,
`https://owner.github.io/repository/wordle/` for a project site).
