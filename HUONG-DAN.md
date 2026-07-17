# Hướng dẫn dùng skill `doc-code` + app bản đồ

> Viết cho người **không rành kỹ thuật**. Cứ đọc từ trên xuống, làm theo từng phần.

Có **2 công cụ đi cùng nhau**:

- **Skill `doc-code`** (chạy trong Claude Code, trên máy tính) → **dạy bạn đọc code** và vẽ ra
  bản đồ dự án (file `sodo.json`).
- **App bản đồ** (mở trong trình duyệt / điện thoại) → **xem lại** bản đồ đó, phóng to thu nhỏ,
  đọc chi tiết từng phần.

Nói gọn: **skill làm ra bản đồ, app để ngắm bản đồ.** Gist là "ống dẫn" đưa bản đồ từ máy tính
sang điện thoại.

App chạy trực tuyến: **https://tranthanh-huy.github.io/doc-code-app/**

---

## Phần 1 — Học một buổi (trên máy tính, dùng skill)

1. Mở **Claude Code** ngay trong thư mục dự án bạn muốn học.
2. Gõ `/doc-code`, hoặc chỉ cần nói: *"dạy tôi đọc code dự án này"*.
3. Claude sẽ:
   - Đọc dự án, tìm **các file có gì, cái nào gọi cái nào** (phần máy móc — nó tự làm).
   - **Bắt bạn đoán trước** từng phần: *"file này chắc lo việc gì?"* → bạn đoán → nó khen/sửa.
     (Đây là cách để **bạn tự hiểu**, không phải nghe giảng rồi quên.)
   - Vừa dạy vừa ghi vào bản đồ `sodo.json` (nằm trong thư mục `.doc-code/` của dự án).
4. Cứ **từng phần nhỏ một** rồi dừng hỏi *"tới đây ổn chưa?"*. Không vội.

> 💡 Bạn **không cần biết** file `sodo.json` trông ra sao. Cứ để Claude lo. Việc của bạn là
> **đoán và hiểu**.

---

## Phần 2 — Cài đồng bộ Gist (chỉ làm **một lần** cho mỗi dự án)

Đây là bước để bản đồ **tự chạy sang điện thoại**. Làm một lần thôi, sau đó quên luôn.

1. Cuối buổi, bảo Claude: *"cài đồng bộ Gist cho dự án này"*.
2. Claude tạo một **Gist bí mật** (kho lưu riêng trên GitHub của bạn) và đưa bạn **một đường link**.
3. Bạn mở **app**, bấm nút **"Từ link…"** (góc trên bên phải), **dán link** vào, Enter.
4. Xong. App **nhớ link này mãi mãi** — lần sau khỏi dán lại.

> 🔒 Gist **bí mật**: chỉ ai có link mới xem được. **Đừng đăng link ở nơi công khai.** Riêng dự
> án nhạy cảm (như `license-tool`) thì càng phải giữ kín.

---

## Phần 3 — Xem bản đồ trên app (điện thoại / máy tính bảng / E-Ink)

Mở app: **https://tranthanh-huy.github.io/doc-code-app/**
(Lần đầu, bấm "Thêm vào màn hình chính" để dùng như một ứng dụng thật, mở offline được.)

Các nút chính:

| Nút | Làm gì |
|---|---|
| **Ô "Dự án:"** | Chọn dự án muốn xem (nếu có nhiều) |
| **"Làm mới"** | Kéo bản mới nhất từ Gist về |
| **"Vừa"** | Canh cả sơ đồ vừa khít màn hình |
| **" + / − "** | Phóng to / thu nhỏ |
| **Kéo (chuột / ngón tay)** | Di chuyển sơ đồ mọi hướng |
| **"Xoá"** | Bỏ dự án khỏi tủ (không đụng tới Gist) |

Bên dưới sơ đồ là **"Chi tiết từng phần"** — đọc mô tả từng ô bằng tiếng Việt đời thường.

---

## Phần 4 — Vòng lặp hằng ngày (sau khi đã cài đặt xong)

Đây là lúc mọi thứ chạy tự động:

```
Học trên máy tính (skill)  →  cuối buổi Claude tự đẩy lên Gist
        ↓  (chờ ~30 giây)
Mở app trên điện thoại  →  bấm "Làm mới"  →  thấy bản đồ mới
```

1. Học xong một buổi trên máy tính.
2. Claude **tự đẩy** bản đồ mới lên Gist (nó nhớ, tự làm cuối buổi).
3. Cầm điện thoại lên, mở app, **chờ khoảng nửa phút** rồi bấm **"Làm mới"**.
4. Bản đồ mới hiện ra. Ngắm lại cả bức tranh, thử **kể lại một phần bằng lời của mình** — đó là
   cách chắc chắn nhất để biết mình đã thật sự hiểu.

> ⏳ **Vì sao phải chờ ~30 giây?** GitHub giữ tạm bản cũ khoảng nửa phút. Không phải lỗi — cứ
> chờ chút rồi "Làm mới" lại là ra bản mới.

---

## Ba điều dễ quên

1. **Không cần đụng vào code hay file `sodo.json`** — skill lo hết. Việc của bạn là đoán, hiểu,
   kể lại.
2. **Link Gist dán vào app đúng một lần** cho mỗi dự án. Sau đó chỉ cần "Làm mới".
3. **Bản đồ mới không hiện ngay?** → chờ ~30 giây, bấm "Làm mới". Vẫn không được thì kiểm tra mạng.

---

## Cài đặt lần đầu trên một máy tính mới (làm một lần)

Để skill tự đẩy lên Gist được, máy tính cần **GitHub CLI** đã đăng nhập:

1. Cài `gh` nếu chưa có: `winget install --id GitHub.cli -e`.
2. **Bạn tự đăng nhập** (Claude không đăng nhập thay): mở PowerShell, chạy `gh auth login`
   → GitHub.com → HTTPS → *Login with a web browser* → làm theo hướng dẫn trên trình duyệt.
3. Kiểm tra: `gh auth status` thấy tên tài khoản là được.

Cài skill vào Claude Code: chép thư mục `doc-code` (chứa `SKILL.md`) vào
`C:\Users\<TÊN_BẠN>\.claude\skills\`. Kết quả cuối cùng phải là
`...\.claude\skills\doc-code\SKILL.md`.
