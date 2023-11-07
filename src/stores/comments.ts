import { derived } from 'svelte/store';
import { Octokit } from 'octokit';
import { type Endpoints } from "@octokit/types";
import { jsonFileCachedWritable } from './jsonFileCachedWritable';
import { type Vault } from 'obsidian';

const COMMENTS_ROUTE = "GET /repos/{owner}/{repo}/comments";
export type Comments = Endpoints[typeof COMMENTS_ROUTE]["response"]["data"];

export type ThreadLocation = {
	commit_sha: string;
	path: string;
	line: number;
	position: number;
};

export type CreateCommentsParams = {
	threadLocation: ThreadLocation;
	body: string;
};

export function commentsStore({ octokit, owner, repo }: { octokit: Octokit, owner: string; repo: string }, filename: string, vault: Vault) {
	const store = jsonFileCachedWritable<Comments>(filename, vault);
	
	async function create({ threadLocation, body }: CreateCommentsParams) {
		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/commits/{commit_sha}/comments",
			{
				owner,
				repo,
				...threadLocation,
				body,
			}
		);
		store.update(($comments) => {
			if (!$comments) return [ response.data ];
			$comments.push(response.data);
			return $comments;
		});
	}
	
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
		create,
		refresh,
	};
}

export function threadKeyOf(comment: ThreadLocation | Comments[0]) {
	return `${comment.path}:${comment.line}:${comment.position}`;
}