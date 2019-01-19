[![version](https://vsmarketplacebadge.apphb.com/version/yzhang.dictionary-completion.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.dictionary-completion)  
[![installs](https://vsmarketplacebadge.apphb.com/installs/yzhang.dictionary-completion.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.dictionary-completion)  
[![AppVeyor](https://img.shields.io/appveyor/ci/yzhang-gh/vscode-dic-completion.svg?style=flat-square&label=appveyor%20build)](https://ci.appveyor.com/project/yzhang-gh/vscode-dic-completion/build/artifacts)

> Dictionary completion allows user to get a list of keywords, based off of the current word at the cursor.  
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

| Name                             | Default | Description                                         |
| -------------------------------- | ------- | --------------------------------------------------- |
| `dictCompletion.leastNumOfChars` | `0`     | Only show completion list until typing N characters |

## Changelog

### 0.7.0 (2018.09.03)

- **New**: Option `addSpaceAfterCompletion`
- **New**: Comment out lines in user dictionary file with `//` ([#6](https://github.com/yzhang-gh/vscode-dic-completion/issues/6))
- **Other**: More words

### 0.6.1 (2018.04.27)

- **Other**: Don't complete inside HTML `<style>`, `<script>` tags

### 0.6.0 (2018.02.26)

- **New**: Option `dictCompletion.leastNumOfChars` ([#3](https://github.com/yzhang-gh/vscode-dic-completion/issues/3))

### 0.5.1 (2018.02.02)

- **New**: Add user word list ([#2](https://github.com/yzhang-gh/vscode-dic-completion/issues/2))

### 0.4.0 (2017.11.30)

- **New**: HTML support

### 0.3.0 (2017.07.09)

- **New**: Add 637 more words

A big **Thank You** to [Weihuang Wen](https://github.com/HughWen)

### 0.2.0 (2017.06.27)

- **New**: Add 995 more words
- **New**: New icon from [Flaticon](http://www.flaticon.com)

### 0.1.6 (2017.06.02), 0.1.5 (2017.05.30)

- **Other**: Minor improvement

### 0.1.4 (2017.05.27)

- **Fix**: Don't suggest words in `\cite`, `\ref` etc.

## Credit

Icons made by [Freepik](http://www.freepik.com) from [www.flaticon.com](http://www.flaticon.com) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
