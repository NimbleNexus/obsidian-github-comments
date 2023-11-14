import { getInsertPositionForLine } from './patch';

describe('getInsertPositionForLine', () => {
	const ADD_ONLY_PATCH = `@@ -0,0 +1,8 @@
+# Obsidian GitHub Comments Design Document
+
+Sketch:
+- check for the presence of a git repository in the hierarchy
+- check for an origin pointing to GitHub
+- authenticate user with GitHub
+- sync comment data using GitHub API
+- decorate editor view with comment markers`;

	const REMOVE_AND_ADD_PATCH = `@@ -32,11 +32,10 @@ const GET_BLAME_QUERY = /* GraphQL */ \`
 export function blameStore(graphqlWithAuth: (typeof graphql), { owner, repo, commitSha, path }: { owner: string, repo: string, commitSha: string, path: string }) {
 	const store = writable<{ [key: string]: any } | undefined>()
 	async function refresh() {
-		const variables = {
+		const response: { [key: string]: any } = await graphqlWithAuth(GET_BLAME_QUERY, {
 			resourceUrl: \`https://github.com/\${owner}/\${repo}/commit/\${commitSha}\`,
 			path,
-		};
-		const response: { [key: string]: any } = await graphqlWithAuth(GET_BLAME_QUERY, variables);
+		});
 		store.set(response);
 		return response;
 	}`;

	// https://github.com/NimbleNexus/obsidian-github-comments/commit/1846d54f1dc5f9a4f58676fb0b26fe113b7d601f
	const MULTI_PATCH = `@@ -7,6 +7,7 @@ import { CommentThreadView, COMMENT_THREAD_VIEW, type CommentThreadViewState } f
 import { commentsMarginField, listComments } from "src/CommentsMarginPlugin";
 import { commentsStore, type Comments, threadKeyOf, type CreateCommentsParams } from "src/stores/comments";
 import { viewerStore } from "src/stores/viewer";
+import { blameStore } from "src/stores/blame";
 
 declare module "obsidian" {
 	interface Workspace {
@@ -151,6 +152,21 @@ export default class GitHubComments extends Plugin {
 			viewer.subscribe(($viewer) => {
 				console.log('viewer', $viewer);
 			});
+
+			const blame = blameStore(graphqlWithAuth, { owner: this.settings.owner, repo: this.settings.repo, commitSha: "HEAD", path: "DEVELOPMENT.md" });
+			blame.refresh();
+			blame.subscribe(($blame) => {
+				console.log('blame', $blame);
+			});
+
+			const commit = octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
+				owner: this.settings.owner,
+				repo: this.settings.repo,
+				ref: "HEAD",
+				headers: {
+					"X-GitHub-Api-Version": "2022-11-28",
+				},
+			}).then(console.log);
 		}
 	}`;

	describe('returns correct position for valid line number', () => {
		test('in add-only patch', () => {
			expect(getInsertPositionForLine(ADD_ONLY_PATCH, 4)).toBe(4);
			expect(getInsertPositionForLine(ADD_ONLY_PATCH, 8)).toBe(8);
		});

		test('in remove-and-add patch', () => {
			expect(getInsertPositionForLine(REMOVE_AND_ADD_PATCH, 35)).toBe(5);
			expect(getInsertPositionForLine(REMOVE_AND_ADD_PATCH, 38)).toBe(10);
		});

		test('in multi-patch', () => {
			expect(getInsertPositionForLine(MULTI_PATCH, 158)).toBe(15);
		});
	});

	test('returns -1 for line number out of range', () => {
		expect(getInsertPositionForLine(ADD_ONLY_PATCH, 0)).toBe(-1);
		expect(getInsertPositionForLine(ADD_ONLY_PATCH, 9)).toBe(-1);
	});

	test('throws error for invalid patch string', () => {
		expect(() => getInsertPositionForLine('invalid patch string', 1)).toThrow('Invalid patch string');
	});
});