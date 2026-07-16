# Bản đồ đọc code — app ôn tập (PWA)

App xem & ôn **sơ đồ cấu trúc dự án** do skill `doc-code` sinh ra. Nó đọc file
`sodo.json`, vẽ sơ đồ kết nối tương tác và tô màu theo mức bạn đã học
(`chưa` / `lơ mơ` / `vững`).

- **Chạy trong trình duyệt = 0 token.** Không gọi AI.
- **PWA**: cài ra màn hình chính, có icon riêng, chạy offline, tự cập nhật.
- **Chỉ đọc**: nguồn sự thật là `sodo.json` (do skill ghi). App không sửa dữ liệu.

## Chạy thử trên máy tính

Cần một server tĩnh (mở thẳng file bằng `file://` sẽ bị chặn service worker). Ví dụ:

```bash
cd doc-code-app
python -m http.server 8123
# mở http://localhost:8123
```

Lần đầu mở, app tự nạp file `sample-sodo.json` đi kèm để bạn xem thử. Bấm
**"Nhập sơ đồ…"** để chọn `sodo.json` thật của bạn (trong `.doc-code/` của dự án
đang học). App nhớ file lần trước, mở lại là thấy luôn.

## Đưa lên điện thoại (PWA)

1. **Đăng lên GitHub Pages** (miễn phí, không cần server tự nuôi):
   - Tạo một repo mới, đẩy toàn bộ thư mục `doc-code-app/` lên.
   - Vào **Settings → Pages**, chọn nhánh `main`, thư mục `/ (root)`.
   - Sau ít phút bạn có địa chỉ dạng `https://<tên-bạn>.github.io/<tên-repo>/`.
2. **Mở địa chỉ đó trên điện thoại**, rồi bấm **"Thêm vào màn hình chính"**
   (Chrome Android: menu ⋮ → *Thêm vào Màn hình chính*). Từ đó có icon riêng,
   chạm là mở toàn màn hình như app thật, chạy offline.

## Đồng bộ dữ liệu qua Drive/Dropbox

App cần file `sodo.json` để hiển thị. Cách tự động, không dựng server:

- Để thư mục `.doc-code/` của dự án nằm trong (hoặc trỏ tới) một thư mục đã được
  **Google Drive / Dropbox / OneDrive** đồng bộ sẵn.
- Sửa code ở máy tính → skill cập nhật `sodo.json` → Drive tự đẩy lên.
- Trên điện thoại, mở app Drive, tải `sodo.json` về rồi bấm **"Nhập sơ đồ…"** trong
  app này. (App nhớ lần nhập gần nhất, nên chỉ cần nhập lại khi sơ đồ đổi.)

## Cấu trúc file

| File | Việc |
|---|---|
| `index.html` | Khung giao diện |
| `style.css` | Giao diện, có chế độ tối/sáng theo hệ thống |
| `app.js` | Nạp `sodo.json`, vẽ sơ đồ, chế độ ôn |
| `manifest.webmanifest` | Khai báo PWA (tên, icon, màu) |
| `sw.js` | Service worker — cache vỏ app để chạy offline |
| `icon.svg`, `icon-maskable.svg` | Icon app |
| `sample-sodo.json` | Dữ liệu mẫu để xem thử |

## Hợp đồng dữ liệu (`sodo.json`)

App bám theo định dạng skill `doc-code` xuất ra:

- `nodes[]`: mỗi ô có `id`, `loai` (`khuVuc`/`file`/`ham`/`ngoai`…), `ten`, `moTa`,
  `daHoc` (`chưa`/`lơ mơ`/`vững`), và `con[]` (các ô con — đa tầng).
- `edges[]`: mỗi mũi tên có `tu`, `den`, `nhan` (lý do nối).
- `diemBatDau[]`, `project`, `ngayTao`.

App bao dung: `loai` lạ vẫn hiện, thiếu `edges`/`con` vẫn chạy.

## Lưu ý khi sửa app

Mỗi lần sửa file trong app, **tăng số phiên bản `CACHE`** trong `sw.js`
(`doc-code-app-v2` → `v3`…) để buộc điện thoại tải bản mới, tránh bị phục vụ lại
bản cũ đã cache.

> Bản dựng đầu (thử nghiệm). Sơ đồ đang bố trí kiểu vòng tròn, hợp dự án ít khu vực.
> Dự án rất nhiều khu vực có thể cần cách bố trí khác — tính sau nếu cần.
