'use strict'

import * as vscode from 'vscode';
import * as fs from 'fs';

let indexedItems = {};

export function activate(context: vscode.ExtensionContext) {
    fs.readFile(context.asAbsolutePath('words'), (err, data) => {
        if (err) throw err;
        const indexes = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        indexes.forEach(i => {
            indexedItems[i] = [];
        });
        let words = data.toString().split(/\r?\n/);
        words.forEach(word => {
            let firstLetter = word.charAt(0).toLowerCase();
            indexedItems[firstLetter].push(new vscode.CompletionItem(word, vscode.CompletionItemKind.Text));
        });
    });
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('markdown', new DictionaryCompletionItemProvider("markdown")));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('latex', new DictionaryCompletionItemProvider("latex")));
}

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
        let firstLetter;
        // [2017.03.24] Found that this function is only invoked when you begin a new word.
        // It means that currentWord.length === 1 when invoked.
        // (If you have not set the trigger chars)
        switch (this.fileType) {
            case "markdown":
                textBefore = textBefore.replace(/\W/g, ' ');
                firstLetter = textBefore.split(/[\s]+/).pop().charAt(0);
                return this.completeByFirstLetter(firstLetter);
            case "latex":
                // Don't suggest words in [citation, reference, environment, command]
                // Regexs come from extension 'LaTeX Workshop'
                // \cite
                if (/(?:\\[a-zA-Z]*cite[a-zA-Z]*(?:\[[^\[\]]*\])?){([^}]*)$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                // \ref
                if (/(?:\\[a-zA-Z]*ref[a-zA-Z]*(?:\[[^\[\]]*\])?){([^}]*)$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                // environment
                if (/(?:\\(?:begin|end)(?:\[[^\[\]]*\])?){([^}]*)$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                // command
                if (/\\([a-zA-Z]*)$/.test(textBefore)) {
                    return new Promise((resolve, reject) => reject());
                }
                firstLetter = textBefore.split(/[\s]+/).pop().charAt(0);
                return this.completeByFirstLetter(firstLetter);
        }
    }

    private completeByFirstLetter(firstLetter: string) {
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
