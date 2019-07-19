'use strict'

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let indexedComplItems = {};
const userDictFilename = getUserDictFilename();

export function activate(context: vscode.ExtensionContext) {
    // Built-in wordlist
    const builtInWords = fs.readFileSync(context.asAbsolutePath('words')).toString().split(/\r?\n/);

    loadOtherWordsAndRebuildIndex(builtInWords);

    context.subscriptions.push(vscode.commands.registerCommand('completion.openUserDict', () => {
        if (vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')) {
            if (!fs.existsSync(userDictFilename)) {
                fs.closeSync(fs.openSync(userDictFilename, 'w'));
            }

            vscode.workspace.openTextDocument(userDictFilename).then(doc => vscode.window.showTextDocument(doc));
        } else {
            vscode.commands.executeCommand('workbench.action.openSettingsJson');
        }
    }));

    vscode.workspace.onDidSaveTextDocument(doc => {
        if (
            vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')
            && doc.fileName.toLowerCase() === userDictFilename.toLowerCase()
        ) {
            loadOtherWordsAndRebuildIndex(builtInWords);
        }
    });

    vscode.workspace.onDidChangeConfiguration(e => {
        if (
            e.affectsConfiguration('dictCompletion.useExternalUserDictFile')
            || (
                e.affectsConfiguration('dictCompletion.userDictionary')
                && !vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')
            )
        ) {
            loadOtherWordsAndRebuildIndex(builtInWords);
        }
    });

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(getDocSelector('markdown'), new DictionaryCompletionItemProvider("markdown")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('latex'), new DictionaryCompletionItemProvider("latex")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('html'), new DictionaryCompletionItemProvider("html"))
    );
}

function getDocSelector(lang: string) {
    return [{ language: lang, scheme: 'file' }, { language: lang, scheme: 'untitled' }];
}

/**
 * Add followed words and rebuild index
 * - User wordlist
 * - `Code Spell Checker` extension user words if exist
 */
function loadOtherWordsAndRebuildIndex(builtInWords: string[]) {
    // User wordlist
    let userWords = [];
    if (vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')) {
        if (fs.existsSync(userDictFilename)) {
            let userWordListStr = fs.readFileSync(userDictFilename).toString();
            if (userWordListStr.length > 0) {
                userWords = userWordListStr.split(/\r?\n/);
            }
        }
    } else {
        userWords = vscode.workspace.getConfiguration('dictCompletion').get<Array<string>>('userDictionary', []);
    }

    // User words from `Code Spell Checker` extension
    let otherWordLists = [];
    const activeDoc = vscode.window.activeTextEditor.document;
    if (vscode.workspace.getConfiguration('cSpell', activeDoc.uri)) {
        otherWordLists.push(vscode.workspace.getConfiguration('cSpell', activeDoc.uri).get<Array<string>>('userWords', []));
        otherWordLists.push(vscode.workspace.getConfiguration('cSpell', activeDoc.uri).get<Array<string>>('words', []));
    }

    // All the words
    let words = builtInWords.concat(userWords, ...otherWordLists);

    words = Array.from(new Set(words));
    words = words.filter(word => word.length > 0 && !word.startsWith('//'));

    indexedComplItems = {};

    words.forEach(word => {
        let firstLetter = word.charAt(0).toLowerCase();
        let item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Text);
        
        if (!indexedComplItems.hasOwnProperty(firstLetter)) {
            indexedComplItems[firstLetter] = [];
        }
        indexedComplItems[firstLetter].push(item);
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

        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);
        const wordBefore = textBefore.replace(/\W/g, ' ').split(/[\s]+/).pop();
        const firstLetter = wordBefore.charAt(0);
        const followingChar = lineText.charAt(position.character);
        const addSpace = vscode.workspace.getConfiguration('dictCompletion').get<boolean>('addSpaceAfterCompletion') && !followingChar.match(/[ ,.:;?!\-]/);

        if (wordBefore.length < vscode.workspace.getConfiguration('dictCompletion').get<number>('leastNumOfChars')) {
            return [];
        }

        switch (this.fileType) {
            case "markdown":
                // [caption](don't complete here)
                if (/\[[^\]]*\]\([^\)]*$/.test(textBefore)) {
                    return [];
                }
                return this.completeByFirstLetter(firstLetter, addSpace);
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
                return this.completeByFirstLetter(firstLetter, addSpace);
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
                return this.completeByFirstLetter(firstLetter, addSpace);
        }
    }

    private completeByFirstLetter(firstLetter: string, addSpace: boolean): Thenable<vscode.CompletionItem[]> {
        if (firstLetter.toLowerCase() == firstLetter) { /* Lowercase */
            let completions: vscode.CompletionItem[] = indexedComplItems[firstLetter];
            if (addSpace) {
                completions.forEach(item => item.insertText = item.label + ' ');
            }
            return new Promise((resolve, reject) => resolve(completions));
        } else { /* Uppercase */
            let completions: vscode.CompletionItem[] = indexedComplItems[firstLetter.toLowerCase()].map(item => {
                let newLabel = item.label.charAt(0).toUpperCase() + item.label.slice(1);
                let newItem = new vscode.CompletionItem(newLabel, vscode.CompletionItemKind.Text);
                if (addSpace) {
                    newItem.insertText = newLabel + ' ';
                }
                return newItem;
            });
            return new Promise((resolve, reject) => resolve(completions));
        }
    }
}
