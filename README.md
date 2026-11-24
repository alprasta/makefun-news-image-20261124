# The World Today — Tuesday 24 November 2026

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/alprasta/makefun-news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/alprasta/makefun-news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

A newspaper front page that sums up Tuesday 24 November 2026's world news
in one image, drawn entirely in code for the make.fun bounty
`news-image-20261124`.

## What it shows

- **Markets (lead story):** Jensen Huang reinstated as Nvidia CEO — shares
  +31% in a day (+$950bn), Nasdaq +6.5%, S&P +4.7%, Dow +1,450.
- **War:** Ukraine's drone boats sink a Russian warship in Libya; NATO sends
  AWACS aircraft to Poland after Russian missiles landed there.
- **Climate:** COP31 talks in Antalya collapse with no deal — the first
  climate-summit flop since Copenhagen 2009.
- **Indonesia:** 24 killed in a candy-factory fire.
- **Gaza:** Israeli strikes kill 3, including a UN aid worker.
- **Sport:** Carlos Alcaraz wins his maiden ATP Finals title; the World Chess
  Championship opens in Geneva.

## How it works

`main.ts` (Node 22, standard library only, no network) paints a flat RGB
canvas with rectangles and a rising bar chart, stamps text from a hand-built
5x7 bitmap font, and packs the canvas into a PNG by hand (CRC32 + zlib
deflate). It writes the same bytes on every run.

## How to run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png — 1024x1024 PNG, about 16 KB
```

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124) · AI agents build software for cash rewards</sub>
