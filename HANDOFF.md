# BÀN GIAO — skill `doc-code` + app xem sơ đồ

> File này để **tiếp tục công việc trên máy khác**. Người dùng KHÔNG rành lập trình, giao
> tiếp bằng **tiếng Việt**, giọng kiên nhẫn, ẩn dụ đời thường. Đọc hết file này trước khi làm.

## 1. Đây là gì

Hai thứ đi kèm nhau, giúp người dùng **tự đọc code** để bớt phụ thuộc AI:

- **Skill `doc-code`** (bản trong repo: [`skill/doc-code/SKILL.md`](skill/doc-code/SKILL.md)):
  dạy người dùng tự đọc code dự án của họ (bắt đoán trước, sửa tại chỗ), và xuất ra file
  `sodo.json` mô tả cấu trúc dự án bằng tiếng Việt đời thường.
- **App này** (thư mục `doc-code-app/`): PWA đọc `sodo.json`, vẽ **sơ đồ kết nối** tương tác
  + danh sách chi tiết. Đã deploy GitHub Pages.

## 2. Vị trí & link

- **Repo app:** https://github.com/tranthanh-huy/doc-code-app (công khai)
- **App chạy trực tuyến (GitHub Pages):** https://tranthanh-huy.github.io/doc-code-app/
- **Git identity của repo:** name `tranthanh-huy`, email
  `285710254+tranthanh-huy@users.noreply.github.com`
- **Skill (chỗ Claude Code dùng được):** phải nằm ở `~/.claude/skills/doc-code/SKILL.md`.
  Trên máy mới: copy `skill/doc-code/SKILL.md` từ repo này vào `~/.claude/skills/doc-code/`.

## 3. Trạng thái hiện tại — ĐÃ XONG

- **Skill `doc-code`**: viết xong, đã test thật. Phần chỉ dẫn bằng tiếng Anh (tiết kiệm
  token) nhưng **mọi đầu ra cho người dùng phải bằng tiếng Việt** (có luật cứng đầu file).
- **App**: xong và đã test kỹ (qua DOM vì công cụ chụp ảnh hay treo). Gồm:
  - Sơ đồ vòng tròn tương tác; **bố cục giãn không đè nhau**; **nhãn mũi tên né va chạm**
    (đặt vào chỗ trống, đủ chữ, không cắt cụt).
  - **Pan tự do mọi hướng** (chuột + chạm), **zoom** bằng nút / cuộn chuột (quanh con trỏ) /
    **pinch 2 ngón**; nút "Vừa" canh cả sơ đồ.
  - **Tủ nhiều dự án**: nhớ nhiều dự án (localStorage), có ô chọn + nút Xoá.
  - **Giao diện E Ink**: đen–trắng tương phản cao, KHÔNG bóng/gradient/hiệu ứng động.
  - **Đồng bộ từ link** (mới xong): nút "Từ link…" nhập dự án bằng URL + nhớ link; **tự làm
    mới khi mở app / khi đổi dự án**; nút "Làm mới" tải tay. Link hỏng báo lỗi tử tế.
- **CORS đã kiểm tra**: app tải được từ hạ tầng GitHub raw → Gist chắc chắn hoạt động.

## 4. Mắt xích cuối — đồng bộ máy tính ↔ điện thoại/E Ink qua Gist bí mật — ĐÃ XONG (2026-07-17)

**Mục tiêu:** học xong → skill tự đẩy `sodo.json` lên **Gist bí mật** → mở app ở máy khác là
**tự thấy bản mới** (không tải, không nhập tay). Đã chốt: dùng **secret Gist** (Drive bị chặn
CORS; người dùng chọn Gist vì tái dùng GitHub sẵn có, CORS ổn định).

**Đã làm xong & test đầu-cuối trên máy mới (đăng nhập `gh` sẵn, tài khoản `tranthanh-huy`):**

- Tạo Gist bí mật bằng `gh gist create <file>` (LƯU Ý: `gh` bản này KHÔNG có cờ `--secret` —
  gist mặc định đã bí mật; đừng dùng `--secret` kẻo lỗi).
- Link raw `https://gist.githubusercontent.com/<user>/<GIST_ID>/raw/<file>` trả **200 +
  `Access-Control-Allow-Origin: *`** → app trên GitHub Pages tải được.
- Trong app thật: gọi luồng "Từ link…" → app nhập, lưu vào tủ, **gắn link đồng bộ** (tự làm
  mới lần sau). Sơ đồ vẽ đúng 3 node / 2 edge.
- `gh gist edit <ID> <file>` đẩy bản mới OK (API xác nhận).
- **CAVEAT quan trọng — CDN cache ~15–30 giây:** link raw của Gist bị CDN (Fastly) cache; tham
  số `?t=` của app KHÔNG phá được. Sau khi đẩy, app có thể thấy bản CŨ tới ~30s → chờ chút rồi
  bấm **"Làm mới"** là ra bản mới. Bình thường, không phải lỗi. (Đã ghi vào skill.)

**Gist demo (dữ liệu bịa, an toàn):** `GIST_ID = dacc1b9bc4367c85af83a267d0642055`
(từ `sample-sodo.json`). Xoá lúc nào cũng được: `gh gist delete <ID>`.

**Skill đã cập nhật** để tự làm việc này: có mục "Syncing to the review app via a secret Gist"
(cài đặt 1 lần + đẩy cuối mỗi buổi bằng `gh gist edit $(cat .doc-code/gist-id.txt)
.doc-code/sodo.json`, lưu id ở `.doc-code/gist-id.txt`). Đã cài bản mới vào
`~/.claude/skills/doc-code/SKILL.md` trên máy này.

**Còn lại:** làm tương tự cho `license-tool` — NHƯNG xem mục Bảo mật (đừng để lộ link).

## 5. Quyết định thiết kế đã chốt (embedded — vì memory không theo máy)

- Skill dạy kiểu **đoán-trước, sửa tại chỗ**; **vĩ mô trước** (bản đồ) rồi vi mô.
- `sodo.json` chỉ chứa **CẤU TRÚC** (project, ngayTao, diemBatDau, nodes[{id,loai,ten,moTa,
  con[]}], edges[{tu,den,nhan}]). **KHÔNG có trạng thái học** — id phải ỔN ĐỊNH khi vẽ lại.
  `loai` gồm khuVuc | file | ham | ngoai (app bao dung loại lạ).
- **Chức năng ôn tập flashcard đã bị gỡ** (người dùng thấy chưa đúng ý). App hiện chỉ
  xem bản đồ + chi tiết. Nếu làm lại "ôn tập", hỏi người dùng muốn kiểu gì trước.
- App **chỉ đọc**, không sửa `sodo.json`. Không backend, không tài khoản (trừ GitHub để host
  + Gist). Chạy trong trình duyệt = 0 token.

## 6. Cách chạy & lưu ý dev

- **Chạy app tại chỗ:** `cd doc-code-app && python -m http.server 8123` → mở
  `http://localhost:8123`.
- **QUAN TRỌNG — service worker cache:** mỗi lần sửa file app phải **tăng số `CACHE`** trong
  `sw.js` (đang **`doc-code-app-v11`** → v12…) kẻo trình duyệt phục vụ bản cũ. Khi test hay
  phải xoá SW + cache + hard reload (thêm `?bust=<số>` vào URL).
- **Đẩy cập nhật:** `git add -A && git commit -m "..." && git push` (remote `origin` đã set,
  credential đã cache trên MÁY CŨ — máy mới phải đăng nhập git lần đầu khi push).
- Kết thúc commit bằng dòng: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 7. Bảo mật — QUAN TRỌNG

- Repo app CÔNG KHAI. `.gitignore` chặn `sodo.json` thật + `.doc-code/`. File mẫu
  `sample-sodo.json` là dự án **bịa** (todo-app), KHÔNG phải dữ liệu thật.
- **TUYỆT ĐỐI không đưa `sodo.json` của `_license_tool` lên nơi công khai** — nó mô tả kiến
  trúc chống-lậu. Gist bí mật = "riêng tư nếu không lộ link" (người dùng đã chấp nhận mức
  này). Để Gist của license-tool ở chế độ **secret**, đừng chia sẻ link.

## 8. Việc nhỏ còn treo

- Loạt commit gần đây đã đẩy hết lên GitHub (xem `git log`).
- Mắt xích Gist ĐÃ XONG + test (mục 4). Mới chỉ có Gist DEMO (todo bịa); chưa gắn Gist cho
  dự án thật nào của người dùng — làm khi họ học dự án thật.
- **Chưa làm Gist cho `license-tool`** (nhạy cảm) — làm khi cần, giữ link bí mật (mục 7).
- **Drift cần người dùng quyết:** skill vẫn nhắc "ôn tập flashcard" (mục 3 & End of session)
  nhưng app đã GỠ flashcard/tiến-độ. Hoặc bỏ nhắc flashcard trong skill, hoặc làm lại tính
  năng ôn tập trong app — hỏi người dùng muốn hướng nào trước khi sửa.
- Nếu muốn, sau này thêm "ôn tập" phiên bản người dùng thích (đã gỡ flashcard).
