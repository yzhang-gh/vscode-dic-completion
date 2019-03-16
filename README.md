[![version](https://vsmarketplacebadge.apphb.com/version/yzhang.dictionary-completion.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.dictionary-completion)
[![installs](https://vsmarketplacebadge.apphb.com/installs/yzhang.dictionary-completion.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.dictionary-completion)
[![AppVeyor](https://img.shields.io/appveyor/ci/yzhang-gh/vscode-dic-completion.svg?style=flat-square&label=appveyor%20build)](https://ci.appveyor.com/project/yzhang-gh/vscode-dic-completion/build/artifacts)

> Dictionary completion allows user to get a list of keywords, based off of the current word at the cursor.
>
> This is useful if you are typing a long word (e.g. acknowledgeable) and don't want to finish typing or don't remember the spelling
>
> Adapted from [vim wikia](http://vim.wikia.com/wiki/Dictionary_completions)

Enabled for Markdown, LaTeX and HTML.

**Note**: After version 1.10.0, the default vscode setting disables quick suggestions for Markdown. To enable this, put
```
"[markdown]": {
    "editor.quickSuggestions": true
}
```
into your `settings.json`.

## Commands

`Completion: Open User Dictionary`

## Settings

| Name                                     | Default | Description                                                                              |
| ---------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `dictCompletion.leastNumOfChars`         | `0`     | Only show completion list until typing N characters                                      |
| `dictCompletion.useExternalUserDictFile` | `true`  | When set to `false`, load custom words from `userDictionary` in the VSCode user settings |
| `dictCompletion.userDictionary`          | `[]`    | User wordlist (should be an array of string)                                             |

## Changelog

See [here](CHANGELOG.md).

## Credit

Icons made by [Freepik](http://www.freepik.com) from [www.flaticon.com](http://www.flaticon.com) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
