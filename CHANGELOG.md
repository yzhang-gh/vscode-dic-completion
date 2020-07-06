### 0.9.1 (2020.07.07)

- **New**: Option `programmingLanguage` now defaults to `true` and multi-line comment is supported.

### 0.9.0 (2020.06.20)

- **New**: Option `externalUserDictFiles` which allows multiple dictionary files and Hunspell format ([#25](https://github.com/yzhang-gh/vscode-dic-completion/issues/25)).
- **Experimental**: Option `programmingLanguage` to get word suggestions when editing string and comment of common programming languages (defaults to `false`) ([#24](https://github.com/yzhang-gh/vscode-dic-completion/issues/24)).

### 0.8.4 (2019.09.29)

- [#16](https://github.com/yzhang-gh/vscode-dic-completion/issues/16)

### 0.8.3 (2019.07.19)

- Bug fixes

### 0.8.2 (2019.04.13)

- **Fix**: Import both `cSpell.userWords` and `cSpell.words` ([#13](https://github.com/yzhang-gh/vscode-dic-completion/issues/13))

### 0.8.1 (2019.03.16)

- **New**: Include word list from Code Spell extension ([#12](https://github.com/yzhang-gh/vscode-dic-completion/issues/12))

### 0.8.0 (2019.02.18)

- **New**: Options
  - `useExternalUserDictFile` (`boolean`)
  - `userDictionary` (`Array<string>`)

### 0.7.1 (2019.01.24)

- **Other**: Bug fixes and more words

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
