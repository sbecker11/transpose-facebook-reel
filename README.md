# transpose-facebook-reel

A small Node.js CLI that downloads the audio from a Facebook reel, transcribes it to text with [mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper) running locally on Apple Silicon, and plays the resulting mp3.

```
Facebook reel URL ──► yt-dlp (audio → mp3) ──► mlx-whisper (mp3 → txt) ──► afplay
```

## Requirements

- macOS on Apple Silicon (arm64)
- [Homebrew](https://brew.sh)
- Node.js 18+

Everything else is installed for you during the install phase.

## Install

```bash
git clone https://github.com/sbecker11/transpose-facebook-reel.git
cd transpose-facebook-reel
npm install          # runs scripts/install.js automatically
```

The install script checks for and installs anything missing:

| Dependency    | Installed via | Purpose                          |
| ------------- | ------------- | -------------------------------- |
| `ffmpeg`      | Homebrew      | Audio extraction and conversion  |
| `yt-dlp`      | Homebrew      | Downloads the reel's audio       |
| `pipx`        | Homebrew      | Isolated install of mlx-whisper  |
| `python@3.12` | Homebrew      | Runtime for mlx-whisper          |
| `mlx-whisper` | pipx          | Local speech-to-text on Apple GPU |

Re-run setup anytime with `npm run setup`, or skip it with `SKIP_SETUP=1 npm install`.

> **Why Python 3.12?** mlx-whisper's dependencies don't yet publish builds for the newest Python releases, so it's installed into its own pipx environment on 3.12. Your default `python3` is left untouched.

## Usage

```bash
npm start -- "https://www.facebook.com/reel/<reel-id>"
```

This will:

1. Download the audio to `output/<reel-id>.mp3` (skipped if it already exists)
2. Transcribe it, print the transcript, and save it to `output/<reel-id>.txt`
3. Play the mp3 (press Ctrl+C to stop)

### Options

| Flag         | Effect                                     |
| ------------ | ------------------------------------------ |
| `--no-play`  | Don't play the mp3                         |
| `--no-print` | Don't print the transcript to the terminal |

The transcript is always saved to `output/<reel-id>.txt`. Flags can be combined, e.g. `npm start -- "<url>" --no-play --no-print`.

Replay audio without re-downloading or re-transcribing:

```bash
npm run play                    # most recent mp3 in output/
npm run play -- <reel-id>       # a specific reel
npm run play -- --quicktime     # open in QuickTime Player instead
```

Stop playback from another terminal (afplay or QuickTime, only for files in `output/`):

```bash
npm stop                        # same as npm run stop
```

Review a transcript in `less` (press `q` to quit, `/` to search):

```bash
npm run review                  # most recent transcript in output/
npm run review -- <reel-id>     # a specific reel
```

Clear all downloaded audio and transcripts:

```bash
npm run clean
```

## Configuration

| Environment variable | Default                            | Description                                                   |
| -------------------- | ---------------------------------- | ------------------------------------------------------------- |
| `WHISPER_MODEL`      | `mlx-community/whisper-small-mlx`  | Any mlx-community Whisper model, e.g. `whisper-medium-mlx` for higher accuracy |
| `FB_COOKIES_BROWSER` | _(unset)_                          | Browser to read cookies from (e.g. `chrome`, `safari`) for reels that require login |
| `SKIP_SETUP`         | _(unset)_                          | Skip the install phase during `npm install`                   |

Example:

```bash
WHISPER_MODEL=mlx-community/whisper-medium-mlx FB_COOKIES_BROWSER=chrome \
  npm start -- "https://www.facebook.com/reel/<reel-id>"
```

## Project structure

```
.
├── index.js            # Run phase: download → transcribe → play
├── scripts/
│   ├── install.js      # Install phase: dependency checks and setup
│   ├── play.js         # Replay an mp3 from output/
│   ├── stop.js         # Stop playback started by start/play
│   └── review.js       # Page through a transcript in less
├── output/             # Generated mp3 and txt files (git-ignored)
└── package.json
```

## Troubleshooting

- **`mlx_whisper not found`**: run `pipx ensurepath`, open a new terminal, or run `npm run setup`.
- **`ResolutionImpossible` when installing mlx-whisper**: it was installed against a too-new Python. Run `pipx uninstall mlx-whisper && npm run setup`.
- **Download fails or returns a login page**: set `FB_COOKIES_BROWSER` to a browser where you're logged in to Facebook.
- **First transcription is slow**: the Whisper model downloads on first use and is cached afterward.

## Notes

All transcription runs locally; no audio is sent to a third-party service. Only download and transcribe content you have the right to use.

## License

MIT
