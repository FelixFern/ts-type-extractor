const vscode = require("vscode");
const ncp = require("copy-paste");
/**
 * @param {vscode.ExtensionContext} context
 */

let types = { type: undefined, key: undefined, children: [] };

const realValue = (val) => {
	let varValue = val.replaceAll(";", "");
	const parsedValue = parseFloat(val);

	if (!isNaN(parsedValue)) {
		varValue = parsedValue;
	} else if (varValue == "true" || varValue == "false") {
		varValue = val === "true";
	} else if (varValue === "null") {
		console.log("test");
		varValue = null;
	} else if (varValue === "undefined") {
		console.log("test1");
		varValue = undefined;
	}
	return varValue;
};

const checkObjectType = (object) => {};

const checkArrayType = (array) => {
	const temp = {
		type: "array",
		key: "",
		children: [],
	};

	array.map((val) => {
		temp.children.push({
			type: typeof realValue(val),
			key: null,
			children: null,
		});
	});

	return temp;
};

const capitalizeString = (value) => {
	return value.charAt(0).toUpperCase() + value.slice(1);
};

const addToClipboard = (varName, types) => {
	let typeClipboard = `type T${capitalizeString(varName)}=`;

	if (typeof types !== "object" || types === null || types === undefined) {
		ncp.copy(`${typeClipboard} ${types}`, function () {
			vscode.window.showInformationMessage(
				"Type copied to the clipboard"
			);
		});
	} else {
		if (types.type === "array") {
			const arrayType = [];

			types.children.map((type) => {
				if (typeof type.type === "object") {
				} else {
					arrayType.push(type.type);
				}
			});

			const uniqueType = arrayType.filter(
				(value, index, self) => self.indexOf(value) === index
			);

			uniqueType.map((type, index) => {
				if (index === uniqueType.length - 1) {
					if (uniqueType.length > 1) {
						typeClipboard += `${type})[]`;
					} else {
						typeClipboard += `${type}[]`;
					}
				} else {
					if (index === 0) {
						typeClipboard += `(${type}|`;
					} else {
						typeClipboard += `${type}|`;
					}
				}
			});

			console.log(typeClipboard);
			ncp.copy(`${typeClipboard}`, function () {
				vscode.window.showInformationMessage(
					"Type copied to the clipboard"
				);
			});
		} else {
		}
	}
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
				const regexConst = /const\s+(\w+)\s+=\s+(.+)/;
				const regexLet = /let\s+(\w+)\s+=\s+(.+)/;
				const regexVar = /var\s+(\w+)\s+=\s+(.+)/;

				const match =
					highlighted.match(regexConst) ??
					highlighted.match(regexLet) ??
					highlighted.match(regexVar);

				if (match) {
					const varName = match[1];
					const value = match[2].trim();

					if (noWhitespace[noWhitespace.indexOf("=") + 1] === "{") {
						let splittedObject = noWhitespace.split(",");

						splittedObject[0] = splittedObject[0].substring(
							splittedObject[0].indexOf("{")
						);
					} else if (
						noWhitespace[noWhitespace.indexOf("=") + 1] === "["
					) {
						let splittedObject = noWhitespace.split(",");

						splittedObject[0] = splittedObject[0]
							.substring(splittedObject[0].indexOf("["))
							.replaceAll("[", "");

						splittedObject[splittedObject.length - 1] =
							splittedObject[splittedObject.length - 1]
								.replaceAll("]", "")
								.replaceAll(";", "");

						types = checkArrayType(splittedObject);
						addToClipboard(varName, types);
					} else {
						const varValue = realValue(value);
						addToClipboard(
							varName,
							varValue === null
								? null
								: varValue === undefined
								? undefined
								: typeof varValue
						);
					}
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
