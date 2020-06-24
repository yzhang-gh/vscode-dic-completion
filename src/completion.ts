'use strict'

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let indexedComplItems = {};

export function activate(context: vscode.ExtensionContext) {
    // Built-in wordlist
    const builtInWords = fs.readFileSync(context.asAbsolutePath('words')).toString().split(/\r?\n/);

    loadOtherWordsAndRebuildIndex(builtInWords);

    context.subscriptions.push(vscode.commands.registerCommand('completion.openUserDict', () => {
        if (vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')) {
            vscode.window.showQuickPick(getUserDictFilenames(), { placeHolder: 'Select a dictionary file' }).then(userDictFilename => {
                if (!userDictFilename) {
                    return;
                }
                if (!fs.existsSync(userDictFilename)) {
                    fs.closeSync(fs.openSync(userDictFilename, 'w'));
                }
                vscode.workspace.openTextDocument(userDictFilename).then(doc => vscode.window.showTextDocument(doc));
            });
        } else {
            vscode.commands.executeCommand('workbench.action.openSettingsJson');
        }
    }));

    vscode.workspace.onDidSaveTextDocument(doc => {
        if (
            vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')
            && getUserDictFilenames().map(n => n.toLowerCase()).includes(doc.fileName.toLowerCase())
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

        if (e.affectsConfiguration('dictCompletion.programmingLanguage')) {
            vscode.window.showInformationMessage("Please restart VSCode to take effect.")
        }
    });

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(getDocSelector('markdown'), new DictionaryCompletionItemProvider("markdown")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('latex'), new DictionaryCompletionItemProvider("latex")),
        vscode.languages.registerCompletionItemProvider(getDocSelector('html'), new DictionaryCompletionItemProvider("html"))
    );

    const triggerChars = 'abcdefghijklmnopqrstuvwxyz'.split('');

    if (vscode.workspace.getConfiguration('dictCompletion').get<boolean>('programmingLanguage')) {
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(getDocSelector('javascript'), new DictionaryCompletionItemProvider("javascript"), ...triggerChars),
            vscode.languages.registerCompletionItemProvider(getDocSelector('typescript'), new DictionaryCompletionItemProvider("typescript"), ...triggerChars),
            vscode.languages.registerCompletionItemProvider(getDocSelector('python'), new DictionaryCompletionItemProvider("python"), ...triggerChars)
        );
    }
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
    // User wordlists
    let userWordlists = [];
    if (vscode.workspace.getConfiguration('dictCompletion').get<boolean>('useExternalUserDictFile')) {
        for (const dictFilename of getUserDictFilenames()) {
            if (fs.existsSync(dictFilename)) {
                let userWordListStr = fs.readFileSync(dictFilename).toString();
                if (userWordListStr.length > 0) {
                    let list = userWordListStr.split(/\r?\n/);

                    //// Hunspell format compatibility
                    if (/\d+/.test(list[0])) {
                        list.splice(0, 1);
                    }
                    list = list.map(word => word.replace(/\/.*$/, ''));

                    userWordlists.push(list);
                }
            }
        }
    } else {
        userWordlists.push(vscode.workspace.getConfiguration('dictCompletion').get<Array<string>>('userDictionary', []));
    }

    // User words from `Code Spell Checker` extension (#13)
    let otherWordLists = [];
    let cSpellConfig: vscode.WorkspaceConfiguration;
    const folders = vscode.workspace.workspaceFolders || [];
    folders.forEach(folder => {
        cSpellConfig = vscode.workspace.getConfiguration('cSpell', folder.uri);
        if (cSpellConfig) {
            otherWordLists.push(cSpellConfig.get<Array<string>>('words', []));
        }
    })

    cSpellConfig = vscode.workspace.getConfiguration('cSpell', null);
    if (cSpellConfig) {
        otherWordLists.push(cSpellConfig.get<Array<string>>('userWords', []));
    }

    // All the words
    let words = builtInWords.concat(...userWordlists, ...otherWordLists);

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

// Adapted from https://github.com/bartosz-antosik/vscode-spellright/blob/master/src/spellright.js
function getUserDictFilenames() {
    let defaultDictFile = '';
    let codeFolder = 'Code';
    const dictName = 'wordlist';
    if (vscode.version.indexOf('insider') >= 0)
        codeFolder = 'Code - Insiders';
    if (process.platform == 'win32')
        defaultDictFile = path.join(process.env.APPDATA, codeFolder, 'User', dictName);
    else if (process.platform == 'darwin')
        defaultDictFile = path.join(process.env.HOME, 'Library', 'Application Support', codeFolder, 'User', dictName);
    else if (process.platform == 'linux')
        defaultDictFile = path.join(process.env.HOME, '.config', codeFolder, 'User', dictName);

    const cfgDictFiles = vscode.workspace.getConfiguration('dictCompletion').get<string[]>('externalUserDictFiles');
    return [defaultDictFile, ...cfgDictFiles];
};

/**
 * Provide completion according to the first letter
 */
class DictionaryCompletionItemProvider implements vscode.CompletionItemProvider {
    fileType: string;
    constructor(fileType: string) {
        this.fileType = fileType;
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken):
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
                //// Inside <style> or <srcipt>
                let docBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
                if (
                    docBefore.includes('<style>')
                    && (
                        !docBefore.includes('</style>')
                        || docBefore.match(/<style>/g).length > docBefore.match(/<\/style>/g).length
                    )
                ) {
                    return [];
                }
                if (
                    docBefore.includes('<script>')
                    && (
                        !docBefore.includes('</script>')
                        || docBefore.match(/<script>/g).length > docBefore.match(/<\/script>/g).length
                    )
                ) {
                    return [];
                }
                return this.completeByFirstLetter(firstLetter, addSpace);
            case "javascript":
            case "typescript":
                if (
                    /\/{2,}/.test(textBefore)
                    || (textBefore.match(/(?<!\\)'/g)?.length ?? 0) % 2 !== 0
                    || (textBefore.match(/(?<!\\)"/g)?.length ?? 0) % 2 !== 0
                ) {
                    return this.completeByFirstLetter(firstLetter, addSpace);
                }
                return [];
            case "python":
                if (
                    /#+/.test(textBefore)
                    || (textBefore.match(/(?<!\\)'/g)?.length ?? 0) % 2 !== 0
                    || (textBefore.match(/(?<!\\)"/g)?.length ?? 0) % 2 !== 0
                ) {
                    return this.completeByFirstLetter(firstLetter, addSpace);
                }
                return [];
        }
    }

    private completeByFirstLetter(firstLetter: string, addSpace: boolean = false): Thenable<vscode.CompletionItem[]> {
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
