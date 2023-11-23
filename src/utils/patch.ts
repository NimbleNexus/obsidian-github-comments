
const PATCH_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/**
 * @param patch a full patch string, like the one returned by GitHub's REST API in Get Comment
 * @param lineNum the line in the file, starting from 1
 * @returns 
 */
export function getInsertPositionForLine(patch: string, lineNum: number) {
	// Split the patch string into lines
	const lines = patch.split("\n");

	// Parse the start line number and total inserted lines from the patch string
	let match = lines[0].match(PATCH_HEADER);
	if (!match) {
		throw new Error("Invalid patch string");
	}
	let addedStartLine = parseInt(match[3]);

	let currentAddedLine = addedStartLine;

	// Skip context lines
	for (let i = 1; i < lines.length; i++) {
		let match = lines[i].match(PATCH_HEADER);
		if (match) {
			addedStartLine = parseInt(match[3]);
			currentAddedLine = addedStartLine;
			continue;
		}
		if (lines[i].startsWith(" ") || lines[i].startsWith("+")) {
			if (currentAddedLine === lineNum) {
				return i;
			} else {
				currentAddedLine++;
			}
		}
	}

	// If the given line number was not found in the patch string, return -1
	return -1;
}
