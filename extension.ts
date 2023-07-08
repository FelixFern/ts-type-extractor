const vscode = require("vscode");
const ncp = require("copy-paste");

/**
 * @param {vscode.ExtensionContext} context
 */

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

const deconstructString = (string, isObject = false) => {
	const deconstructed = [];
	let start = 1;
	let end = start;

	let prevCommaIndex = 0;
	let numOfColon = 0;

	while (end < string.length) {
		if (!isObject) {
			if (string[start] !== "[" && string[start] !== "{") {
				if (
					string[end] !== "," &&
					string[end] !== "]" &&
					string[end] !== "}"
				) {
					end++;
				} else {
					deconstructed.push(string.substring(start, end));
					start = end + 1;
					end++;
				}
			} else if (string[start] === "[") {
				let count = 0;
				let foundClosing = false;
				end++;
				while (!foundClosing) {
					if (string[end] === "[") {
						count++;
						end++;
					} else if (string[end] === "]") {
						if (count === 0) {
							deconstructed.push(
								string.substring(start, end + 1)
							);
							start = end + 2;
							end = start;
							foundClosing = true;
						} else {
							count--;
							end++;
						}
					} else {
						end++;
					}
				}
			} else {
				let count = 0;
				let foundClosing = false;
				end++;
				while (!foundClosing) {
					if (string[end] === "{") {
						count++;
						end++;
					} else if (string[end] === "}") {
						if (count === 0) {
							deconstructed.push(
								string.substring(start, end + 1)
							);
							start = end + 2;
							end = start;
							foundClosing = true;
						} else {
							count--;
							end++;
						}
					} else {
						end++;
					}
				}
			}
		} else {
			if (end === string.length - 1) {
				deconstructed.push(string.substring(start, end));
			}
			if (string[end] === ",") {
				prevCommaIndex = end;
				end++;
			} else if (string[end] === ":") {
				if (numOfColon === 0) {
					numOfColon++;
					end++;
				} else {
					deconstructed.push(string.substring(start, prevCommaIndex));
					start = prevCommaIndex + 1;
					end++;
				}
			} else {
				end++;
			}
		}
	}

	return deconstructed;
};

const getType = (string) => {
	let temp = {
		type: null,
		key: null,
		children: null,
		value: null,
	};
	const keyRegex = /^(\w+):(.*)$/;
	const match = string.match(keyRegex);
	if (match) {
		temp = {
			type: "objectChild",
			key: match[1],
			children: [],
			value: deconstructString(match[2]),
		};
		for (let i = 0; i < temp.value.length; i++) {
			temp.children.push(getType(temp.value[i]));
		}
	} else if (string[0] === "[") {
		temp = {
			type: "array",
			key: null,
			children: [],
			value: deconstructString(string),
		};
		for (let i = 0; i < temp.value.length; i++) {
			temp.children.push(getType(temp.value[i]));
		}
	} else if (string[0] === "{") {
		temp = {
			type: "object",
			key: null,
			children: [],
			value: deconstructString(string, true),
		};
		for (let i = 0; i < temp.value.length; i++) {
			temp.children.push(getType(temp.value[i]));
		}
	} else {
		temp = {
			type: typeof realValue(string),
			key: null,
			children: null,
			value: realValue(string),
		};
	}
	return temp;
};

const capitalizeString = (value) => {
	return value.charAt(0).toUpperCase() + value.slice(1);
};

const pushType = (type) => {
	if (type.type === "array") {
		const temp = [];
		let outputType = "";
		type.children.map((child) => {
			temp.push(pushType(child));
		});

		const uniqueType = temp.filter(
			(value, index, self) => self.indexOf(value) === index
		);
		uniqueType.map((type, index) => {
			if (index === uniqueType.length - 1) {
				if (uniqueType.length > 1) {
					outputType += `${type})[]`;
				} else {
					outputType += `${type}[]`;
				}
			} else {
				if (index === 0) {
					outputType += `(${type}|`;
				} else {
					outputType += `${type}|`;
				}
			}
		});
		return outputType;
	}
	return type.type;
};

const addToClipboard = (varName, types) => {
	let typeClipboard = `type T${capitalizeString(varName)}=`;
	console.log(types);
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
				arrayType.push(pushType(type));
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

			ncp.copy(`${typeClipboard}`, function () {
				vscode.window.showInformationMessage(
					"Type copied to the clipboard"
				);
			});
		} else {
			console.log(types);
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
					let splitted = noWhitespace.split("=");
					if (
						noWhitespace[noWhitespace.indexOf("=") + 1] === "{" ||
						noWhitespace[noWhitespace.indexOf("=") + 1] === "["
					) {
						addToClipboard(varName, getType(splitted[1]));
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
