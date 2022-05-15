# The Minimal Metronome

[Visit the landing page](https://metronome-www.vercel.app)

## Features

- [x] Tempo tapper
- [x] Time signatures
- [x] Keyboard support
- [x] Fullscreen and a mini-mode
- [x] Cross-platform support
- [x] Dark mode and light mode
- [ ] Custom themes

# Releases

The latest release can be found [here](https://github.com/ZaneH/metronome/releases).

## Run Locally

```bash
$ git clone git@github.com:ZaneH/metronome.git
$ cd metronome
$ yarn && yarn tauri dev
```

## Build target binary

Outputs to `/src-tauri/target/release/bundle`

```bash
$ yarn tauri build
```

# Contributions

Contributions are welcome! Create a PR or issue to get started.

## Formatting

Code is auto-formatted when committed using `.prettierrc`.

# Hotkeys

|  **Key**  |       **Function**       |
| :-------: | :----------------------: |
| Spacebar  |       Toggle play        |
|     d     |     Toggle dark mode     |
|     f     | Toggle metronome display |
|     m     |       Toggle mute        |
|     s     |     Toggle settings      |
|     t     |        Tap tempo         |
|    0-9    |         Edit BPM         |
|   ←↑→↓    |         Edit BPM         |
| Backspace |         Edit BPM         |
|  Escape   |      Close settings      |
