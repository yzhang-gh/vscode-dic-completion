'use strict';

import * as vscode from 'vscode';
import * as completion from './completion';

export function activate(context: vscode.ExtensionContext) {
    completion.activate(context);
    console.log('activate');
}

export function deactivate() { }