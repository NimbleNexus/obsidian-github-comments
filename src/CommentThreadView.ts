import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";

import CommentThread from "./CommentThread.svelte";
import { type Comments } from "./stores/comments";

export const COMMENT_THREAD_VIEW = "ogc-comment-thread-view";

export class CommentThreadView extends ItemView {
	component?: CommentThread;

	constructor(leaf: WorkspaceLeaf) {
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
			props: {
				comments: []
			},
		});
	}

	setState(state: { comments?: Comments }, result: ViewStateResult): Promise<void> {
		if (this.component && state.comments) {
			this.component.$set({ comments: state.comments });
		}
		return super.setState(state, result);
	}

	async onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}
