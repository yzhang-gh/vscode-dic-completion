'use strict'

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let indexedItems = {};
const indexes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const userDictFilename = getUserDictFilename();
let addSpace = vscode.workspace.getConfiguration('dictCompletion').get<boolean>('addSpaceAfterCompletion');

export function activate(context: vscode.ExtensionContext) {
    loadWordList(context);

    context.subscriptions.push(vscode.commands.registerCommand('completion.openUserDict', () => {
        if (!fs.existsSync(userDictFilename)) {
            fs.closeSync(fs.openSync(userDictFilename, 'w'));
        }

        vscode.workspace.openTextDocument(userDictFilename).then(doc => vscode.window.showTextDocument(doc));
    }));

    vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.fileName.toLowerCase() === userDictFilename.toLowerCase()) {
            loadWordList(context);
        }
    });

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(getDocSelector('markdown'), new DictionaryCompletionItemProvider("markdown")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('latex'), new DictionaryCompletionItemProvider("latex")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('html'), new DictionaryCompletionItemProvider("html"))
    );

    vscode.commands.registerCommand('completion.removeRedundantSpace', () => {
        let editor = vscode.window.activeTextEditor;
        let cursor = editor.selection.active;
        const followingCharRange = new vscode.Range(cursor, cursor.with({ character: cursor.character + 1 }));
        if (editor.document.getText(followingCharRange) === ' ') {
            editor.edit(editBuilder => {
                editBuilder.delete(followingCharRange);
            });
        }
    });
}

function getDocSelector(lang: string) {
    return [{ language: lang, scheme: 'file' }, { language: lang, scheme: 'untitled' }];
}

function loadWordList(context: vscode.ExtensionContext) {
    let words = fs.readFileSync(context.asAbsolutePath('words')).toString().split(/\r?\n/);
    if (fs.existsSync(userDictFilename)) {
        let userWordListStr = fs.readFileSync(userDictFilename).toString();
        if (userWordListStr.length > 0) {
            words = words.concat(userWordListStr.split(/\r?\n/));
        }
    }
    words = words.filter(word => word.length > 0 && !word.startsWith('//'));

    indexedItems = {};
    indexes.forEach(i => {
        indexedItems[i] = [];
    });

    words.forEach(word => {
        let firstLetter = word.charAt(0).toLowerCase();
        let item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Text);
        if (addSpace) {
            item.insertText = word + ' ';
            item.command = { title: '', command: 'completion.removeRedundantSpace' };
        }
        indexedItems[firstLetter].push(item);
    });
}

// From https://github.com/bartosz-antosik/vscode-spellright/blob/master/src/spellright.js
function getUserDictFilename() {
    let codeFolder = 'Code';
    const dictName = 'wordlist';
    if (vscode.version.indexOf('insider') >= 0)
        codeFolder = 'Code - Insiders';
    if (process.platform == 'win32')
        return path.join(process.env.APPDATA, codeFolder, 'User', dictName);
    else if (process.platform == 'darwin')
        return path.join(process.env.HOME, 'Library', 'Application Support', codeFolder, 'User', dictName);
    else if (process.platform == 'linux')
        return path.join(process.env.HOME, '.config', codeFolder, 'User', dictName);
    else
        return '';
};

/**
 * Provide completion according to the first letter
 */
class DictionaryCompletionItemProvider implements vscode.CompletionItemProvider {
    fileType: string;
    constructor(fileType: string) {
        this.fileType = fileType;
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {

        let textBefore = document.lineAt(position.line).text.substring(0, position.character);
        let wordBefore = textBefore.replace(/\W/g, ' ').split(/[\s]+/).pop();
        let firstLetter = wordBefore.charAt(0);

        if (wordBefore.length < vscode.workspace.getConfiguration('dictCompletion').get<number>('leastNumOfChars')) {
            return [];
        }

        switch (this.fileType) {
            case "markdown":
                // [caption](don't complete here)
                if (/\[[^\]]*\]\([^\)]*$/.test(textBefore)) {
                    return [];
                }
                return this.completeByFirstLetter(firstLetter);
            case "latex":
                // `|` means cursor
                // \command|
                if (/\\[^ {\[]*$/.test(textBefore)) {
                    return [];
                }
                // \begin[...|] or \begin{...}[...|]
                if (/\\(documentclass|usepackage|begin|end|cite|ref)({[^}]*}|)?\[[^\]]*$/.test(textBefore)) {
                    return [];
                }
                // \begin{...|} or \begin[...]{...|}
                if (/\\(documentclass|usepackage|begin|end|cite|ref)(\[[^\]]*\]|)?{[^}]*$/.test(textBefore)) {
                    return [];
                }
                return this.completeByFirstLetter(firstLetter);
            case "html":
                // <don't complete here>
                if (/<[^>]*$/.test(textBefore)) {
                    return [];
                }
                let docBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
                if (docBefore.includes('<style>') &&
                    (!docBefore.includes('</style>') || docBefore.match(/<style>/g).length > docBefore.match(/<\/style>/g).length)) {
                    return new Promise((resolve, reject) => reject());
                }
                if (docBefore.includes('<script>') &&
                    (!docBefore.includes('</script>') || docBefore.match(/<script>/g).length > docBefore.match(/<\/script>/g).length)) {
                    return new Promise((resolve, reject) => reject());
                }
                return this.completeByFirstLetter(firstLetter);
        }
    }

    private completeByFirstLetter(firstLetter: string): Thenable<vscode.CompletionItem[]> {
        if (firstLetter.toLowerCase() == firstLetter) { /* Not capital */
            return new Promise((resolve, reject) => resolve(indexedItems[firstLetter]));
        } else {
            let completions = indexedItems[firstLetter.toLowerCase()]
                .map(w => {
                    let newLabel = w.label.charAt(0).toUpperCase() + w.label.slice(1);
                    return new vscode.CompletionItem(newLabel, vscode.CompletionItemKind.Text)
                });
            return new Promise((resolve, reject) => resolve(completions));
        }
    }
}
