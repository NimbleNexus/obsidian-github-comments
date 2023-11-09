import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";

import CommentThread from "./CommentThread.svelte";
import { type CreateCommentsParams, type ThreadLocation } from "./stores/comments";
import type GitHubComments from "main";

export const COMMENT_THREAD_VIEW = "ogc-comment-thread-view";

export interface CommentThreadViewState {
	threadLocation?: ThreadLocation;
}

export class CommentThreadView extends ItemView {
	component?: CommentThread;

	constructor(leaf: WorkspaceLeaf, private plugin: GitHubComments) {
		super(leaf);
	}

	getViewType() {
		return COMMENT_THREAD_VIEW;
	}

	getDisplayText() {
		return "GitHub Comment Thread";
	}

	async onOpen() {
		this.component = new CommentThread({
			target: this.contentEl,
		});
	}

	setState(state: CommentThreadViewState, result: ViewStateResult): Promise<void> {
		if (this.component) {
			this.component.$set({
				comments: this.plugin.comments,
				...state,
				createComment: (createCommentsParams: CreateCommentsParams) => {
					this.app.workspace.trigger("ogc:create-comment", createCommentsParams);
				}
			});
		}
		return super.setState(state, result);
	}

	async onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}
