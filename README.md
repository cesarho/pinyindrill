# 拼音練習 — Pinyin Drill

A minimalist, spaced-repetition pinyin learning app for mastering the 4,500 most common Chinese characters.

**[Live Demo →](https://pinyindrill.netlify.app/)**

## Features

- **4,500 Characters** — Covers the most frequently used Chinese characters from the [CUHK Cantonese Frequency List](https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/faq.php)
- **Spaced Repetition** — Master characters by answering correctly 5 times in a row
- **Multiple Readings** — Accepts all valid pinyin pronunciations for characters with multiple readings
- **Progress Tracking** — All progress is saved locally in your browser
- **Hint System** — Type `hint` to reveal the answer (resets streak)
- **Mobile Friendly** — Fully responsive design optimized for practice on any device

## How It Works

1. **Choose an exercise** — Characters are grouped into sets of 100, ordered by frequency
2. **Type the pinyin** — Enter the romanized pronunciation (without tones) and press Enter or Space
3. **Build your streak** — Get 5 correct answers in a row to master a character
4. **Track your progress** — Completed exercises are highlighted in green

## Getting Started

### Run Locally

Simply open `index.html` in your browser — no build step required.

### Deploy

The app is static HTML/CSS/JS and can be deployed to any static hosting service

- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- [GitHub Pages](https://pages.github.com)

## Project Structure

```text
pinyin/
├── index.html      # Main HTML structure
├── app.js          # Application logic and state management
├── characters.js   # 4,500 character dataset
├── styles.css      # Dark theme styling
└── README.md
```

## Dependencies

- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) — Accurate pinyin conversion library (loaded via CDN)
- [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) — Chinese character font
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) — Monospace UI font

## Tips for Learning

- **Start with the first few exercises** — Characters are ordered by frequency, so the first sets contain the most useful characters
- **Practice daily** — Short, consistent sessions are more effective than long, irregular ones
- **Don't rely on hints** — Using a hint resets your streak; try to recall before peeking
- **Focus on recognition** — The goal is to recognize the sound, not memorize stroke order

## Data Source

The character list is derived from the [Chinese University of Hong Kong's Chinese Character Frequency List](https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/faq.php), representing the most commonly used characters in modern Chinese.

## License

MIT

