import { derived } from 'svelte/store';
import { Octokit } from 'octokit';
import { type Endpoints } from "@octokit/types";
import { jsonFileCachedWritable } from './jsonFileCachedWritable';
import { type Vault } from 'obsidian';

const COMMENTS_ROUTE = "GET /repos/{owner}/{repo}/comments";
export type Comments = Endpoints[typeof COMMENTS_ROUTE]["response"]["data"];

export type ThreadLocation = {
	path: string;
	line: number;
	position: number;
};

export function commentsStore({ octokit, owner, repo }: { octokit: Octokit, owner: string; repo: string }, filename: string, vault: Vault) {
	const store = jsonFileCachedWritable<Comments>(filename, vault);
	
	async function refresh() {
		const response = await octokit.request(
			COMMENTS_ROUTE,
			{
				owner,
				repo,
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			}
		);
		store.set(response.data);
	}

	return {
		subscribe: store.subscribe,
		forFile: (path: string) => derived(store, ($comments) => $comments?.filter(({ path: commentPath }) => commentPath === path)),
		refresh,
	};
}

export function threadKeyOf(comment: ThreadLocation | Comments[0]) {
	return `${comment.path}:${comment.line}:${comment.position}`;
}