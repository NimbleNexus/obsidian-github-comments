import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";

import CommentThread from "./CommentThread.svelte";

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
				threadId: undefined,
			},
		});
	}

	setState(state: { threadId: string }, result: ViewStateResult): Promise<void> {
		if (this.component) {
			this.component.$set({ threadId: state.threadId });
		}
		return super.setState(state, result);
	}

	async onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}
