import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	WidgetType,
} from "@codemirror/view";
import {
	Extension,
	StateEffect,
	StateField,
	Transaction,
} from "@codemirror/state";

export interface CommentWidgetData {
	lineNum: number;
	threadId: string;
	commentCount: number;
}

export class CommentWidget extends WidgetType {
	constructor(private data: CommentWidgetData) {
		super();
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.innerText = `${this.data.commentCount}🗨️`;
		span.style.color = "var(--text-muted)";
		span.style.whiteSpace = "nowrap";
		span.style.position = "absolute";
		span.style.right = "100%";
		span.style.marginRight = "0.5rem";
		span.style.userSelect = "none";
		span.style.cursor = "pointer";
		span.ariaLabel = `Comment on line ${this.data.lineNum}`;
		span.onclick = () => console.log(`Comment icon clicked for thread of ${this.data.threadId}`);
		return span;
	}
}

export const listComments = StateEffect.define<CommentWidgetData[]>();

export const commentsMarginField = StateField.define<DecorationSet>({
	create(state): DecorationSet {
		return Decoration.none;
	},
	update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
		for (let effect of transaction.effects) {
			if (effect.is(listComments)) {
				const builder = new RangeSetBuilder<Decoration>();
				for (const lineData of effect.value) {
					const line = transaction.newDoc.line(lineData.lineNum);
					builder.add(
						line.to, // Using line.to to allow for cases where content is added before the first line.
						line.to,
						Decoration.widget({
							widget: new CommentWidget(lineData), // TODO: Reuse widget instances by thread ID?
							side: -1,
						})
					);
				}
				return builder.finish();
			}
		}

		return oldState;
	},
	provide(field: StateField<DecorationSet>): Extension {
		return EditorView.decorations.from(field);
	},
});
