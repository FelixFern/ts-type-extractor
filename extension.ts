const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
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
				editor;
				const highlighted = editor.document.getText(selectionRange);
				console.log(highlighted);
			} else {
				vscode.window.showErrorMessage("No Variable Selected!");
			}

			vscode.window.showInformationMessage(
				"Hello World from TS Type Extractor!"
			);
		}
	);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
