import { graphql } from "@octokit/graphql";
import { writable } from "svelte/store";

// TODO: Infer these types from GraphQL schema
export interface Viewer {
	login: string;
}

const VIEWER_QUERY = /* GraphQL */ `
	{
		viewer {
			login
		}
	}
`;

export function viewerStore(graphqlWithAuth: (typeof graphql)) {
	const store = writable<Viewer | undefined>()
	async function refresh() {
		const { viewer }: { viewer: Viewer } = await graphqlWithAuth(VIEWER_QUERY);
		store.set(viewer);
	}
	return {
		subscribe: store.subscribe,
		refresh,
	}
}
