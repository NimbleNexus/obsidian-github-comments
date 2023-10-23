# Obsidian GitHub Comments

Context: Obsidian users have limited options to collaborate and get early feedback on their notes. We propose, seek feedback and funding for a plugin that leverages GitHub's comment system.

Examples:
- Spouses asking for comments on notes about household projects.
- Teammates asking for comments on design docs for software projects.

Audience:
- Broadly: Obsidian users who are looking for an easy way to collaborate on their notes
- First niche segment: Obsidian users who back up their vaults to GitHub
- Broadening the niche: Enable GitHub backups for everyone

Features:
![Obsidian GitHub Comments mock-up](./Obsidian%20GitHub%20Comments%20mock-up.jpg)
- View all GitHub comments and replies for the current note in the margins
  + Similar to the current Comments experience on github.dev
    - [ ] Add example recording of the current experience
- Reply to GitHub comments
- "Add GitHub comment" command
- Features to broaden the niche
  + Make it a single step to backup notes to GitHub _(given a GitHub account, created and signed into separately, in a browser)_
  + Make it a single step to open a GitHub vault
- Extended features
  + View most recent comments and replies across the entire vault
  + Keep track of comments across branches _(power user feature)_
  + Comment on notes published as HTML
    - Note: There's an opportunity here for Obsidian Publish to support GitHub comments for certain vaults.

Alternatives to consider:
- Make comments collaboration work with alternative services <a name="^202310201601"></a>
- Make comments work with a special file type that can sync just the same as Markdown files <a name="^202310201603"></a>

Attention and care:
- Make compatible with (doesn't break) official Sync and Publish plugins

## Development alternatives considered

Currently, [pursuing comments collaboration with alternative services](#^202310201601) may run into sync issues, where the references in the comments service run out of sync with files edited outside of Markdown, for any reason, especially when files are edited on multiple machines or outside of Obsidian.
- Such an implementation might be worth exploring depending on user demand for popular services such as Hypothesis.

Alternatively, [making comments work with a special file type that can sync just the same as Markdown files](#^202310201603) would be suitable for a single user vaults, the way Obsidian is currently designed to be used. There's still a risk that files would run out of sync, though it can be more easily addressed in the design.
- Such an implementation is more closely aligned with the principle of keeping all data in plain text. _(JSON counts as plain text, e.g. Canvas)_
- This would be more difficult to implement a web UI for open collaboration.

## Alternatives to discuss with community

Context: How to get comments on your Obsidian notes, something we've been looking into for the past year or so.
- Export PDF and comment in Google Drive
- Publish / Markbase plus Hypothesis
- Comments directly in GitHub and on pull requests
