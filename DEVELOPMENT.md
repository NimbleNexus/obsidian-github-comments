# Obsidian GitHub Comments Design Document

Sketch:
- check for the presence of a git repository in the hierarchy
- check for an origin pointing to GitHub
- authenticate user with GitHub
- sync comment data using GitHub API
- decorate editor view with comment markers

## Minimum Viable Product

The smallest investment for the most value
- Use [Authenticating with a personal access token](https://docs.github.com/en/enterprise-server@3.8/rest/guides/scripting-with-the-rest-api-and-javascript#authenticating-with-a-personal-access-token) to get started quickly _(see [#^202310241437](#^202310241437))_
- Support only [Commit comments](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28) in the first iteration _(see [#^202310241439](#^202310241439))_
- Display only in the Live Preview as an [Editor extension](https://docs.obsidian.md/Plugins/Editor/Editor+extensions) in the first iteration _(see [#^202310241511](#^202310241511))_

### Config

Onboarding
- detect git repository and origin
- ask for personal access token in settings

### Data

Features, working backwards from the API
- View comments with [List commit comments for a repository](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#list-commit-comments-for-a-repository)
  + Find the most recent commit referenced in the origin
  + Use file diff to adjust line references
  + Use the same API to check for new comments periodically
- [Create a commit comment](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#create-a-commit-comment)
- [Update a commit comment](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#update-a-commit-comment)
- [Delete a commit comment](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#delete-a-commit-comment)
- Refresh threads in current note using [List commit comments](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#list-commit-comments)
- Locally refresh comment using [Get a commit comment](https://docs.github.com/en/rest/commits/comments?apiVersion=2022-11-28#get-a-commit-comment)

Caching
- cache response from `GET /repos/{owner}/{repo}/comments`
- optimistically update based on other operations
- diff & notify UI when updates occur
- design internal API using reactive stores, see [svelte/store](https://svelte.dev/docs/svelte-store)

### UI

#### Comment icons

Display [widget decoration](https://codemirror.net/docs/ref/#view.Decoration^widget) using a [View plugin](https://docs.obsidian.md/Plugins/Editor/View+plugins) to show comment icons to the side of each line.
- See examples in [Providing decorations](https://docs.obsidian.md/Plugins/Editor/Decorations#Providing+decorations)

#### Comment blocks

Display [widget decoration](https://codemirror.net/docs/ref/#view.Decoration^widget) using a [State field](https://docs.obsidian.md/Plugins/Editor/State+fields) to show open comment blocks below each line.
- We may be able to get the same thing done with a View plugin, but that means we'd have to keep state separately or risk losing input. The expectation is that only a few such blocks would be open at a time. We may even limit this to one.

## Out of scope for MVP

A better way to authenticate users would be through an [OAuth apps - GitHub Docs](https://docs.github.com/en/apps/oauth-apps). <a name="^202310241437"></a>

It might be useful to support [Pull request review comments - GitHub Docs](https://docs.github.com/en/rest/pulls/comments?apiVersion=2022-11-28) as well, though this is a more advanced use. <a name="^202310241439"></a>

It will be useful to decorate the Reading mode with [Markdown post processing](https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing), though the most useful view at this time would be Live Preview, in Obsidian. <a name="^202310241511"></a>
