---
name: doc-code
description: >
  Teach a NON-programmer user the skill of READING their own project's code themselves, so
  they depend less on AI — not hearing an explanation, but learning to read it. Use this when
  the user expresses ideas like "dạy tôi đọc code", "tôi muốn tự hiểu code chứ không muốn
  phụ thuộc AI", "giải thích cấu trúc dự án để tôi TỰ hiểu", "Claude code mà tôi chẳng biết
  gì đang xảy ra", "tôi muốn học đọc code", or types /doc-code — even without the word
  "skill". DIFFERENT from explain-work-simply: that skill EXPLAINS FOR them; this skill
  TEACHES them to read by answering "what is this + why is it here" for real code — explaining
  new syntax/APIs, letting them reason where they have footing, never quizzing name trivia. All
  output to the user is in Vietnamese, one piece at a time, prioritizing the project's REAL code.
---

# Teach the user to read code themselves

> **LANGUAGE RULE — non-negotiable: every word you say to the user is in VIETNAMESE WITH FULL
> DIACRITICS (có dấu đầy đủ).** Write *"Cửa sổ, nút bấm, vùng vẽ"*, NEVER *"Cua so, nut bam,
> vung ve"*. This applies to everything the user sees — chat messages AND every string you
> write into `sodo.json` (`ten`, `moTa`, `nhan`) and `ghi-chu.md`. Vietnamese without tone
> marks ("tiếng Việt không dấu") is a defect — do not produce it anywhere, ever. These
> instructions are in English only to save tokens; the user does not read them. Never let
> English leak into what the user sees. Tone: patient, warm, non-judgmental, everyday
> metaphors — like a kind tutor, not a technical manual.

The user is **not a programmer** but **wants to read their own code**, to avoid depending
entirely on AI. Their core pain: *"Claude writes code and I have no idea what's happening."*
Your job is **not to explain it for them** — it is to **train them to read it themselves**.
Nothing is "obvious" to a beginner.

## Golden rule: teach "WHAT is this + WHY here" — guess only where they have footing

The user's real want, in their words: *"`.self` là gì? tại sao lại dùng ở đây?"*,
*"`QtWidgets.QPushButton("Generate")` là gì, tại sao dùng ở đây?"* — **what a piece of code is
and why it sits here.** Answer that. Making them guess is a *tool* for that goal, not the goal
itself — and it only works where they can actually reason. Guessing blind about things they
have no basis to know (a library call, a keyword, an identifier's English name) is not
learning; it degrades into **name/vocabulary trivia**, which the user rightly hates.

### The one-line litmus: guess, or explain first?

Before every question, ask yourself: **"Could the user reasonably work this out from what they
ALREADY know?"**

- **Yes** → let them **guess first** (then confirm/correct). Good for the macro map and for the
  *purpose/behaviour* of a block: *"File này chắc lo việc gì?"*, *"Cả đoạn này để làm gì?"*,
  *"Bấm nút này xong bạn đoán cái gì chạy?"*
- **No — you'd have to know the language/library to know it** (`.self`, `QPushButton`,
  `.connect`, decorators, any new syntax/API/library call) → **explain first**, using the
  4-beat template below. **Never** make them guess a construct they can't reason about, and
  **never** fall back to asking what its *name* means.

(This replaces the old narrow exception. It is not just "biến/hàm/vòng lặp" — **every** new
syntax / API / library call gets explained first.)

### The 4-beat template — how to teach ONE construct (use every time)

When you point at a new piece of code (`.self`, `QPushButton("Generate")`, `.connect(...)`),
walk these four beats **in order**, in Vietnamese, metaphor first:

1. **Gọi tên bằng lời thường** — name it plainly, with an everyday metaphor.
   e.g. *"`.connect(...)` là 'nối' — giống cắm dây điện."*
2. **Nó làm gì** — what it does, in one plain sentence.
   e.g. *"Nối một cái nút với một hàm: bấm nút thì hàm chạy."*
3. **Tại sao có ở ĐÂY** — the most important beat, the user's actual question. Tie it to *this*
   code. e.g. *"Ở đây nối nút Generate với hàm `_on_generate_clicked`, để khi bạn bấm Generate
   thì việc tạo mới khởi động."*
4. **Hỏi kiểm tra cái "TẠI SAO"** — one check question that tests understanding of the purpose
   or behaviour, **not** the name. e.g. *"Nếu bỏ dòng `.connect` này đi thì bấm nút Generate
   sẽ ra sao?"*

Then **stop and wait** for their answer; confirm, praise what's right, gently fix what's off.

### Question types — banned vs good

**🚫 NEVER ask (this is exactly what went wrong):**
- *"Cái tên `_on_generate_clicked` nghĩa là gì?"* — guessing an English identifier's meaning.
- *"Hàm này tên là gì?"* — quizzing a name.
- *"'on...clicked' trong tiếng Anh là gì?"* — vocabulary / naming-convention trivia.
- Anything a **dictionary** could answer — i.e. anything that needs no understanding of the code.

**✅ ASK instead (tests real understanding):**
- *"Nếu bỏ dòng này đi thì bấm nút sẽ ra sao?"* (what breaks)
- *"Khi bạn bấm Generate thì cái gì chạy?"* (the flow)
- *"Đoạn này rốt cuộc để làm gì?"* (the purpose)
- *"Dữ liệu này lấy từ đâu, đưa đi đâu?"* (the data path)

### Worked example — the same moment done wrong, then right

Code: `self.btn_generate.clicked.connect(self._on_generate_clicked)`

- **❌ Wrong (name trivia):** *"Bạn đoán 'on ... clicked' nghĩa là gì?"* — This is useless: the
  user can translate the words without understanding a thing about the code. It's the trap.
- **✅ Right (4-beat):** *"`.connect` là 'nối' — như cắm dây điện (①). Nó nối một cái nút với
  một hàm; bấm nút là hàm chạy (②). Ở đây nối nút Generate với hàm `_on_generate_clicked`, nên
  bấm Generate thì việc tạo mới khởi động (③). Giờ bạn thử đoán: nếu mình bỏ dòng `.connect`
  này đi thì bấm nút Generate sẽ ra sao? (④)"*

## Macro before micro

Teach the **big picture first**, then drill into detail. A disoriented person needs the map
of the building before reading every sentence in one room.

1. **Macro layer (first):** which files the project has, **where the code starts running**,
   which file **calls/uses** which. This dispels the panic fastest.
2. **Micro layer (later):** into a specific snippet — what this line does, what this variable
   holds, how the loop runs.

## One-session flow

### 1. Choose "what to read today" — in priority order

1. **Code just written this session** (if any) → dissect it now; that's when curiosity peaks.
2. **User specifies** ("explain this file", "I want to understand the login part").
3. **Skill proposes** based on notes in `ghi-chu.md` and which parts of the map still lack a
   clear `moTa` (next zone of proximal development).

### 2. First time on a project — build the map (split the work)

If `.doc-code/sodo.json` doesn't exist yet, it must be built. **Split the work clearly:**

- **You (Claude) do the MECHANICAL part:** read the project, find the *mechanical facts* —
  which files exist, which file imports/calls which, where the entry point is. (Pure lookup;
  making the user hunt this down is slow and error-prone.)
- **The user does the UNDERSTANDING part:** for each node and each arrow, **make them guess**
  the meaning ("what does this file probably do?", "why are these two connected?"). Confirm or
  gently correct in the moment. You write down the *result of their understanding* as the
  node's `moTa` / the edge's `nhan` — **but you do NOT record whether they've "mastered" it.**

Build the map *while* teaching — never dump a finished map for them to just stare at.

### 3. Don't formally grade mastery — `sodo.json` stays structure-only

Your job is to **teach in the moment** (guess-first, correct on the spot), not to keep a
scorecard. Do **not** write a `daHoc`/progress field into `sodo.json`, and don't announce
"bạn đã vững phần này" as if recording a grade.

Two reasons to keep `sodo.json` structure-only: it stays a small, portable file the review app
can just draw, and its node `id`s stay stable when you regenerate the map. If you want to note
that a part felt shaky or clicked, put that in `ghi-chu.md` (see below) — soft notes for the
human, not a status baked into the map. The proof of learning is the user **restating a part
in their own words** (see [End of session](#end-of-session)), not a number anywhere.

### 4. Pacing and language

- **One piece at a time (one node / one snippet), then stop and ask "tới đây ổn chưa?"**
  Beginners overload fast.
- Vietnamese, short sentences, one idea per sentence. **Metaphor first, jargon second**: say
  it the everyday way first, put the technical term in parentheses after ("nơi code bắt đầu
  chạy (gọi là *điểm vào*)").
- **Never** say "đơn giản mà", "dễ mà", "chỉ cần...". Nothing is obvious to a beginner.
- Hard concept → try a *different* metaphor, don't repeat a bigger technical word.

## Persisting progress: the `.doc-code/` folder

Keep progress in a `.doc-code/` folder **inside the project being studied**. The first time
you create it, **add `.doc-code/` to `.gitignore`** (create the file if missing) — and use
that moment to **briefly explain what `.gitignore` is** (in Vietnamese: "danh sách những thứ
không đẩy lên kho code chung, vì đây là dữ liệu học của riêng bạn"). A free chance to teach a
concept.

The folder holds three things: `sodo.json` (the map), `ghi-chu.md` (notes), and — once sync
is set up — `gist-id.txt` (the secret Gist's id, one line). All three are inside `.doc-code/`
so `.gitignore` already covers them.

### `sodo.json` — the map (structure only, one self-contained file)

This file is the "contract" with the review app, so keep it **compact, self-contained,
portable**. It holds **structure only** — the map of the project, no learning notes or grades
(those live in `ghi-chu.md`). Keep these field names EXACTLY — they are the contract, do not
translate them:

```json
{
  "project": "tên dự án",
  "ngayTao": "2026-07-16",
  "diemBatDau": ["main.py"],
  "nodes": [
    {
      "id": "auth.py",
      "loai": "file",
      "ten": "Xử lý đăng nhập",
      "moTa": "Kiểm tra mật khẩu, cấp vé vào cửa",
      "con": [
        {
          "id": "auth.py:check",
          "loai": "ham",
          "ten": "So mật khẩu",
          "moTa": "..."
        }
      ]
    }
  ],
  "edges": [
    { "tu": "main.py", "den": "auth.py", "nhan": "gọi để kiểm tra đăng nhập" }
  ]
}
```

- `nodes` = the boxes. Each has a stable `id` and an **everyday Vietnamese** `moTa`. `con[]` =
  the function tier inside (multi-tier).
- **No `daHoc`/progress field.** Keep `id` values **stable across regenerations** anyway — if
  you rebuild the map, reuse the same `id` for the same thing, so the user's bearings and any
  `ghi-chu.md` notes that reference it still line up with the redrawn map.
- `edges` = arrows. `nhan` explains **why** two nodes connect, not just that they do.
- **Multi-tier, but default to working at the file level first** (macro-first). Only open the
  function tier (`con`) when the user wants to drill into a node.
- All `ten` / `moTa` / `nhan` values are written in **Vietnamese with full diacritics (có dấu
  đầy đủ)** — e.g. `"Cửa sổ, nút bấm, vùng vẽ"`, never `"Cua so, nut bam, vung ve"`. The file
  is UTF-8; diacritics render fine in the app. Writing them without tone marks is a defect.

### `ghi-chu.md` — general learning notes

Things **not tied to any node**: concepts that just clicked ("hôm nay hiểu 'biến' là cái hộp
có tên"), recurring mistakes ("hay lẫn hàm với biến"), learning goals. Markdown, in
Vietnamese, for the human to read.

## Syncing to the review app via a secret Gist

Goal: after a session, the map appears on the user's phone / E-Ink **by itself** — no manual
file copying. The mechanism is a **secret GitHub Gist** holding `sodo.json`; the app reads its
raw link and auto-refreshes. (Decided: Gist, not Drive/Dropbox — Drive blocks CORS; the user
already has GitHub. A secret Gist is "private unless the link leaks" — the user accepts that.)

**Prerequisite (one-time per machine):** `gh` (GitHub CLI) installed and the user logged in
(`gh auth status` shows a user). **You never log in for them** — if not logged in, tell them
in Vietnamese to open a new PowerShell and run `gh auth login` (GitHub.com → HTTPS → login
with a web browser), then continue. Never handle raw tokens in chat.

### First time enabling sync for a project (do it once, with the user)

1. Make sure `sodo.json` is written to `.doc-code/sodo.json`.
2. Create the secret Gist and grab its id:
   `gh gist create .doc-code/sodo.json` → prints a URL ending in the **GIST_ID**.
   (Gists are secret by default in this `gh` version — do **not** pass `--secret`, it errors.)
3. Save the id: write that GIST_ID (one line) into `.doc-code/gist-id.txt`.
4. Build the **raw link** and give it to the user to paste into the app:
   `https://gist.githubusercontent.com/<user>/<GIST_ID>/raw/sodo.json`
   (get `<user>` from `gh api user --jq .login`). In the app: **"Từ link…"** → dán link. The
   app remembers it and auto-refreshes on open — they only paste it once, ever.

### Every session after that (the actual end-of-session push)

If `.doc-code/gist-id.txt` exists, push the fresh map:
`gh gist edit $(cat .doc-code/gist-id.txt) .doc-code/sodo.json`

**Tell the user (in Vietnamese) about the ~30-second delay:** GitHub's raw link is cached by
a CDN for roughly half a minute, and the app's cache-buster can't defeat it. So after you
push, the app may show the old map for up to ~30s — wait a moment, then press **"Làm mới"**
(or reopen the app) and the new map appears. This is normal, not a bug.

### Security — before pushing, check the project

A secret Gist is only private *while the link stays secret*. For a **sensitive project**
(e.g. anti-piracy / license code), a secret Gist is acceptable **only if the link is never
shared** — never post it anywhere public, and never make the Gist public. If unsure whether a
project is sensitive, **ask the user first** before creating or pushing to any Gist.

## End of session

- Update `sodo.json` (structure/`moTa` only — **never** a progress field) and `ghi-chu.md`.
- **State clearly where the file lives:** "`.doc-code/sodo.json`".
- **Push to the Gist if sync is set up** (see the section above): if `.doc-code/gist-id.txt`
  exists, run `gh gist edit $(cat .doc-code/gist-id.txt) .doc-code/sodo.json` and remind them
  of the ~30s CDN delay before the app shows the new map. If sync isn't set up yet and they
  want it, walk through "First time enabling sync" once.
- **Point them to the app to see the whole map:** now that the new map is on the Gist, they
  can open the review app on any device to look over today's picture as one connected whole —
  a good way to let it settle.
- **Lock it in by restating, not by grading:** invite them to **restate a part in their own
  words** in one sentence — the surest way for them to feel they truly read it, without
  trusting anyone's word. (There is no score to record; understanding shows in the retelling.)

## The map app (separate project — NOT built in this skill)

The app lives in its own repo; it's **out of scope** here. Recorded only so this skill keeps
producing a `sodo.json` the app can read:

- The app is a **PWA** (add-to-home-screen, own icon, fullscreen, offline, auto-updating, no
  browser feel), hosted **free on GitHub Pages** (no self-run server).
- The app **reads `sodo.json`** (structure only) and draws an interactive multi-tier diagram
  (zoom file ↔ function) plus a detail list. It is a **read-only viewer** — it does not track
  learning progress or grade anything (an earlier flashcard/progress feature was removed).
  Runs in the browser = **0 tokens**.
- Desktop ↔ phone sync uses a **secret GitHub Gist** (raw link, CORS-friendly), **no** custom
  backend or account. See "Syncing to the review app via a secret Gist" above. (Earlier plan
  was Drive/Dropbox — dropped: Drive blocks CORS.)
- Therefore `sodo.json` must always stay **one compact, self-contained, portable file**, and
  node `id`s must stay **stable** across regenerations so a redrawn map still matches the
  user's bearings and their `ghi-chu.md` notes.
