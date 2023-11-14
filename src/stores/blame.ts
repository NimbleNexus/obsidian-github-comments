import { graphql } from "@octokit/graphql";
import { writable } from "svelte/store";

// TODO: Infer types from GraphQL schema
const GET_BLAME_QUERY = /* GraphQL */ `
	query GetBlame($resourceUrl: URI!, $path: String!) {
		resource(
			url: $resourceUrl
		) {
			... on Commit {
				blame(path: $path) {
					ranges {
						startingLine
						endingLine
						age
						commit {
							oid
							messageHeadline
							author {
								name
								email
								date
							}
						}
					}
				}
			}
		}
	}
`;

export function blameStore(graphqlWithAuth: (typeof graphql), { owner, repo, commitSha, path }: { owner: string, repo: string, commitSha: string, path: string }) {
	const store = writable<{ [key: string]: any } | undefined>()
	async function refresh() {
		const variables = {
			resourceUrl: `https://github.com/${owner}/${repo}/commit/${commitSha}`,
			path,
		};
		const response: { [key: string]: any } = await graphqlWithAuth(GET_BLAME_QUERY, variables);
		store.set(response);
		return response;
	}
	return {
		subscribe: store.subscribe,
		refresh,
	}
}
