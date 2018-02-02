'use strict'

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let indexedItems = {};
const indexes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const userDictFilename = getUserDictFilename();

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

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('markdown', new DictionaryCompletionItemProvider("markdown")));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('latex', new DictionaryCompletionItemProvider("latex")));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('html', new DictionaryCompletionItemProvider("html")));
}

function loadWordList(context: vscode.ExtensionContext) {
    let words = fs.readFileSync(context.asAbsolutePath('words')).toString().split(/\r?\n/);
    if (fs.existsSync(userDictFilename)) {
        let userWordListStr = fs.readFileSync(userDictFilename).toString();
        if (userWordListStr.length > 0) {
            words = words.concat(userWordListStr.split(/\r?\n/));
        }
    }

    indexedItems = {};
    indexes.forEach(i => {
        indexedItems[i] = [];
    });

    words.forEach(word => {
        let firstLetter = word.charAt(0).toLowerCase();
        indexedItems[firstLetter].push(new vscode.CompletionItem(word, vscode.CompletionItemKind.Text));
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

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        let textBefore = document.lineAt(position.line).text.substring(0, position.character);
        // [2017.03.24] Found that this function is only invoked when you begin a new word.
        // It means that currentWord.length === 1 when invoked.
        // (If you have not set the trigger chars)
        switch (this.fileType) {
            case "markdown":
                return this.completeByTextBefore(textBefore);
            case "latex":
                // `|` means cursor
                // \command|
                if (/\\[^{\[]*$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                // \begin[...|] or \begin{...}[...|]
                if (/\\(documentclass|usepackage|begin|end|cite|ref)({[^}]*}|)?\[[^\]]*$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                // \begin{...|} or \begin[...]{...|}
                if (/\\(documentclass|usepackage|begin|end|cite|ref)(\[[^\]]*\]|)?{[^}]*$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                return this.completeByTextBefore(textBefore);
            case "html":
                if (/<[^>]*$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                return this.completeByTextBefore(textBefore);
        }
    }

    private completeByTextBefore(textBefore: string) {
        textBefore = textBefore.replace(/\W/g, ' ');
        let firstLetter = textBefore.split(/[\s]+/).pop().charAt(0);
        return this.completeByFirstLetter(firstLetter);
    }

    private completeByFirstLetter(firstLetter: string): Thenable<vscode.CompletionItem[]> {
        if (firstLetter.toLowerCase() == firstLetter) { /* Not capital */
            return new Promise((resolve, reject) => resolve(indexedItems[firstLetter]));
        } else {
            let completions = indexedItems[firstLetter.toLowerCase()]
                // .filter(w => { return w.label.startsWith(currentWord) }) // Since currentWord == firstLetter, this line will do nothing
                .map(w => {
                    let newLabel = w.label.charAt(0).toUpperCase() + w.label.slice(1);
                    return new vscode.CompletionItem(newLabel, vscode.CompletionItemKind.Text)
                });
            return new Promise((resolve, reject) => resolve(completions));
        }
    }
}
