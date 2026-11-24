// THE WORLD TODAY — Tuesday 24 November 2026, in one picture.
// A newspaper front page drawn from scratch: a flat RGB canvas painted with
// rectangles and a rising market chart, text stamped from a hand-built 5x7
// bitmap font, then packed into a PNG by hand. Node 22 standard library only,
// no network, no dependencies, fully deterministic — the same bytes every run.
//
// The day's news (all verified from live reporting on 24 Nov 2026):
//   * Jensen Huang reinstated as Nvidia CEO; shares +31% in a day (+$950bn),
//     Nasdaq +6.5%, S&P +4.7%, Dow +1,450 — the biggest market day in years.
//   * Ukraine's drone boats sink a Russian warship in Libya; NATO sends AWACS
//     to Poland after Russian missiles landed there.
//   * COP31 climate talks in Antalya collapse with no deal — first flop since
//     Copenhagen 2009.
//   * Indonesia: 24 killed in a candy-factory fire.
//   * Gaza: Israeli strikes kill 3, including a UN aid worker.
//   * Sport: Alcaraz wins his maiden ATP Finals title; the World Chess
//     Championship opens in Geneva.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette: newsprint paper, ink, signal red, market green --------------
const PAPER = [247, 238, 216];
const CREAM = [238, 226, 196];
const WHITE = [252, 250, 244];
const INK = [24, 22, 20];
const RED = [178, 30, 30];
const GREEN = [32, 118, 58];
const GREENL = [74, 168, 96];
const NAVY = [22, 42, 74];
const SKY = [150, 196, 222];
const GREY = [118, 114, 106];
const AMBER = [214, 148, 26];

// ---- canvas: one flat RGB array, origin top-left ---------------------------
const px = new Uint8Array(W * H * 3);

function fillAll(c) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}

function rect(x, y, w, h, c) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let o = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      px[o] = c[0];
      px[o + 1] = c[1];
      px[o + 2] = c[2];
      o += 3;
    }
  }
}

function hline(x, y, w, t, c) {
  rect(x, y, w, t, c);
}

// A filled disc, used for the sun and bullet dots.
function disc(cx, cy, r, c) {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r && xx >= 0 && xx < W && yy >= 0 && yy < H) {
        const o = (yy * W + xx) * 3;
        px[o] = c[0];
        px[o + 1] = c[1];
        px[o + 2] = c[2];
      }
    }
  }
}

// ---- PNG writer: CRC32 table, chunks, zlib deflate -------------------------
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function writePng() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // One filter byte (0 = none) per scanline, then the raw RGB rows.
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "entry.png"), png);
}

// ---- bitmap font: 5 wide, 7 tall, '#' = ink --------------------------------
// Every glyph is seven rows of five characters, written by hand for this
// entry. Letters, digits and the punctuation the headlines need.
const FONT = {
  "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  "N": ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", "..#..", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  "$": ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  '"': [".#.#.", ".#.#.", ".#.#.", ".....", ".....", ".....", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
};

function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}

function drawText(x, y, s, scale, c) {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function drawCentred(y, s, scale, c) {
  drawText(Math.round((W - textWidth(s, scale)) / 2), y, s, scale, c);
}

// A small kicker label: coloured bar + word, e.g. "MARKETS".
function kicker(x, y, s, c) {
  rect(x, y, 10, 14, c);
  drawText(x + 18, y, s, 2, c);
}

// ---- layout: a newspaper front page ----------------------------------------
// Border frame around the whole page.
function frame(x, y, w, h, c, t) {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}

function drawPage() {
  fillAll(PAPER);
  frame(24, 24, 976, 976, INK, 3);

  // Masthead.
  drawCentred(42, "THE WORLD TODAY", 7, INK);
  hline(48, 106, 928, 6, RED);
  drawCentred(122, "TUESDAY 24 NOVEMBER 2026", 3, INK);

  // Lead story: the market day.
  rect(48, 164, 928, 288, CREAM);
  frame(48, 164, 928, 288, INK, 2);
  kicker(66, 182, "MARKETS", RED);
  drawText(66, 208, "HUANG IS BACK", 8, INK);
  drawText(66, 278, "NVIDIA +31% IN A DAY", 4, GREEN);
  drawText(66, 322, "WALL ST SOARS AS CEO RETURNS", 3, INK);
  drawText(66, 352, "NASDAQ +6.5%  S&P +4.7%  DOW +1,450", 3, INK);
  drawText(66, 392, "+$950 BN ADDED IN ONE DAY", 3, GREEN);
  // Chart panel: a steeply rising bar chart.
  rect(712, 182, 246, 252, NAVY);
  drawText(789, 196, "+31%", 4, WHITE);
  const bars = [18, 32, 28, 52, 44, 72, 100];
  for (let i = 0; i < bars.length; i++) {
    rect(728 + i * 32, 414 - bars[i], 20, bars[i], GREENL);
  }
  drawText(728, 420, "NVDA", 2, WHITE);

  hline(48, 468, 928, 3, INK);

  // Middle row: war spreads / climate talks collapse.
  rect(48, 484, 458, 216, WHITE);
  frame(48, 484, 458, 216, INK, 2);
  kicker(66, 500, "WAR", RED);
  drawText(66, 526, "UKRAINE SINKS", 4, INK);
  drawText(66, 566, "RUSSIAN SHIP", 4, INK);
  drawText(66, 612, "DRONE BOATS HIT A WARSHIP", 2, INK);
  drawText(66, 634, "IN LIBYA, NATO SENDS AWACS", 2, INK);
  drawText(66, 656, "TO POLAND AFTER MISSILES", 2, INK);

  rect(518, 484, 458, 216, WHITE);
  frame(518, 484, 458, 216, INK, 2);
  kicker(536, 500, "CLIMATE", GREEN);
  drawText(536, 526, "COP31 COLLAPSES", 4, INK);
  drawText(536, 566, "WITH NO DEAL", 4, INK);
  drawText(536, 612, "ANTALYA TALKS FAIL OVER", 2, INK);
  drawText(536, 634, "FOSSIL FUELS: FIRST FLOP", 2, INK);
  drawText(536, 656, "SINCE COPENHAGEN 2009", 2, INK);

  hline(48, 716, 928, 3, INK);

  // Bottom row: three short stories.
  rect(356, 732, 2, 208, GREY);
  rect(664, 732, 2, 208, GREY);
  kicker(66, 748, "INDONESIA", RED);
  drawText(66, 774, "FACTORY FIRE", 3, INK);
  drawText(66, 812, "24 KILLED IN CANDY", 2, INK);
  drawText(66, 834, "FACTORY BLAZE", 2, INK);
  drawText(66, 856, "RESCUERS SEARCH", 2, INK);

  kicker(380, 748, "GAZA", RED);
  drawText(380, 774, "STRIKES KILL 3", 3, INK);
  drawText(380, 812, "ISRAELI STRIKES HIT", 2, INK);
  drawText(380, 834, "GAZA; UN AID WORKER", 2, INK);
  drawText(380, 856, "AMONG THE DEAD", 2, INK);

  kicker(694, 748, "SPORT", GREEN);
  drawText(694, 774, "ALCARAZ WINS", 3, INK);
  drawText(694, 812, "MAIDEN ATP FINALS", 2, INK);
  drawText(694, 834, "TITLE IN TURIN", 2, INK);
  drawText(694, 856, "CHESS WORLDS OPEN", 2, INK);
  drawText(694, 878, "IN GENEVA TODAY", 2, INK);

  // Footer.
  hline(48, 952, 928, 2, INK);
  drawCentred(964, "TUESDAY 24 NOVEMBER 2026 - THE WORLD IN ONE PAGE", 2, INK);
}

drawPage();
writePng();
