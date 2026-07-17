---
name: doc-code
description: >
  Teach a NON-programmer user the skill of READING their own project's code themselves, so
  they depend less on AI — not hearing an explanation, but learning to read it. Use this when
  the user expresses ideas like "dạy tôi đọc code", "tôi muốn tự hiểu code chứ không muốn
  phụ thuộc AI", "giải thích cấu trúc dự án để tôi TỰ hiểu", "Claude code mà tôi chẳng biết
  gì đang xảy ra", "tôi muốn học đọc code", or types /doc-code — even without the word
  "skill". DIFFERENT from explain-work-simply: that skill EXPLAINS FOR them; this skill
  TEACHES them to read by making them guess first, then correcting. All output to the user is
  in Vietnamese, one piece at a time, prioritizing the project's REAL code.
---

# Teach the user to read code themselves

> **LANGUAGE RULE — non-negotiable: every word you say to the user is in VIETNAMESE.** These
> instructions are in English only to save tokens; the user does not read them. Never let
> English leak into what the user sees. Tone: patient, warm, non-judgmental, everyday
> metaphors — like a kind tutor, not a technical manual.

The user is **not a programmer** but **wants to read their own code**, to avoid depending
entirely on AI. Their core pain: *"Claude writes code and I have no idea what's happening."*
Your job is **not to explain it for them** — it is to **train them to read it themselves**.
Nothing is "obvious" to a beginner.

## Golden rule: MAKE THEM GUESS FIRST, don't lecture first

This is the heart of the skill. The skill only grows when the user is forced to **think for
themselves, then get immediate feedback** — passively listening creates a false sense of "I
get it" when they don't.

- Point at a snippet / a node on the map and **ask them to guess** first: *"Bạn đoán dòng
  này làm gì?"*, *"File này chắc lo việc gì?"*, *"Theo bạn cái gì gọi cái gì?"*
- **Wait for their answer.** Only then confirm right/wrong, praise what's correct, gently
  point out what's off.
- **Exception — lecturing first is OK** when a concept is BRAND new (first encounter with
  "biến"/variable, "hàm"/function, "vòng lặp"/loop...). Guessing blind there is cruel. Open
  with one small, clean example, then **immediately pull back to their real code** to try.

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
   clear `moTa` (next zone of proximal development). Note: mastery progress lives in the app,
   not here.

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

### 3. Who judges mastery — NOT the skill

**The skill does not track or mark mastery.** Progress state (chưa / lơ mơ / vững) is owned
entirely by the **review app**, stored on the user's device, not in `sodo.json`. Do **not**
write a `daHoc` field, and do not tell the user "bạn đã vững phần này" as if recording it.

Your job is to **teach in the moment** (guess-first, correct on the spot). The user proves
mastery to *themselves* later, in the app's flashcard review (recall the answer before
revealing it, then self-grade). This keeps one clean owner of progress and avoids two tools
fighting over the same file. When a session ends, point them to the app to review — see
[End of session](#end-of-session).

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

### `sodo.json` — the map (structure only, one self-contained file)

This file is the "contract" with the review app, so keep it **compact, self-contained,
portable**. It holds **structure only — NO learning/progress state** (that belongs to the
app). Keep these field names EXACTLY — they are the contract, do not translate them:

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
- **No `daHoc` field.** The app tracks progress itself, keyed by node `id`. So `id` values
  must be **stable across regenerations** — if you rebuild the map, reuse the same `id` for
  the same thing, or the user's progress for it is lost.
- `edges` = arrows. `nhan` explains **why** two nodes connect, not just that they do.
- **Multi-tier, but default to working at the file level first** (macro-first). Only open the
  function tier (`con`) when the user wants to drill into a node.
- All `ten` / `moTa` / `nhan` values are written in **Vietnamese**.

### `ghi-chu.md` — general learning notes

Things **not tied to any node**: concepts that just clicked ("hôm nay hiểu 'biến' là cái hộp
có tên"), recurring mistakes ("hay lẫn hàm với biến"), learning goals. Markdown, in
Vietnamese, for the human to read.

## End of session

- Update `sodo.json` (structure/`moTa` only — **never** a progress field) and `ghi-chu.md`.
- **State clearly where the file lives:** "`.doc-code/sodo.json`" — so later they know where
  to grab it to sync to their phone (via Drive/Dropbox) for the review app.
- **Point them to the app to lock it in:** progress is tracked there, so remind them to open
  the review app and do a flashcard pass (recall each part before revealing) to turn today's
  reading into lasting memory.
- If they seem to understand a part, invite them to **restate it in their own words** in one
  sentence — the surest way for them to feel confident they truly read it, without trusting
  anyone's word.

## Future design notes (review app — NOT built in this skill)

For building the app later so it stays compatible — the app is **out of scope** for this
skill; recorded here only to avoid drift:

- The app is a **PWA** (add-to-home-screen, own icon, fullscreen, offline, auto-updating, no
  browser feel), hosted **free on GitHub Pages** (no self-run server).
- The app **reads `sodo.json`** (structure only), draws an interactive multi-tier diagram
  (zoom file ↔ function), and **owns all progress state itself** — stored on the device,
  keyed by node `id`, set through flashcard review (recall then self-grade). The skill never
  writes progress. Runs in the browser = **0 tokens**.
- Desktop ↔ phone sync uses the user's **existing Drive/Dropbox/OneDrive** (put `.doc-code/`
  inside / pointing at a synced folder), **no** custom backend or account.
- Therefore `sodo.json` must always stay **one compact, self-contained, portable file**, and
  node `id`s must stay **stable** so app-side progress survives map regenerations.
