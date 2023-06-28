const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */

const realValue = (value) => {
	let varValue = value;
	const parsedValue = parseFloat(value);

	if (!isNaN(parsedValue)) {
		varValue = parsedValue;
	}

	if (value === "true" || value === "false") {
		varValue = value === "true";
	} else if (value === "null") {
		varValue = null;
	} else if (value === "undefined") {
		varValue = undefined;
	}
	return varValue;
};

function activate(context) {
	console.log(
		'Congratulations, your extension "ts-type-extractor" is now active!'
	);
	let disposable = vscode.commands.registerCommand(
		"ts-type-extractor.extractSelection",
		() => {
			const editor = vscode.window.activeTextEditor;
			const selection = editor.selection;
			if (selection && !selection.isEmpty) {
				const selectionRange = new vscode.Range(
					selection.start.line,
					selection.start.character,
					selection.end.line,
					selection.end.character
				);

				const highlighted = editor.document.getText(selectionRange);
				const noWhitespace = highlighted.replaceAll(/\s/g, "");
				const regex = /(const|let|var)\s+(\w+)\s+=\s+(.+)/;
				const match = highlighted.match(regex);

				if (match) {
					const varName = match[1];
					const value = match[2].trim();

					if (noWhitespace[noWhitespace.indexOf("=") + 1] === "{") {
						console.log("Object");
					} else if (
						noWhitespace[noWhitespace.indexOf("=") + 1] === "["
					) {
						console.log("Array");
					} else {
						let varValue = realValue(value);
						console.log("====");
						console.log("Variable Name: ", varName);
						console.log("Value: ", varValue);
						console.log("Type", typeof varValue);
					}
					vscode.window.showInformationMessage(
						"Type Copied to Clipboard"
					);
				} else {
					vscode.window.showErrorMessage("No Variable Selected!");
				}
			} else {
				vscode.window.showErrorMessage("No Variable Selected!");
			}
		}
	);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
