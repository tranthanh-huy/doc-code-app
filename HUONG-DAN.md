# Hướng dẫn dùng skill `doc-code` + app bản đồ

> Viết cho người **không rành kỹ thuật**. Cứ đọc từ trên xuống, làm theo từng phần.

Có **2 công cụ đi cùng nhau**:

- **Skill `doc-code`** (chạy trong Claude Code, trên máy tính) → **dạy bạn đọc code** và vẽ ra
  bản đồ dự án (file `sodo.json`).
- **App bản đồ** (mở trong trình duyệt / điện thoại) → **xem lại** bản đồ đó, phóng to thu nhỏ,
  đọc chi tiết từng phần.

Nói gọn: **skill làm ra bản đồ, app để ngắm bản đồ.** Gist là "ống dẫn" đưa bản đồ từ máy tính
sang điện thoại.

> ✨ **Tự động tối đa:** bạn **không bao giờ phải đi dán link cho từng dự án nữa.** Có **một
> "mục lục" chung** cho tất cả dự án. Học dự án mới → nó **tự hiện** trong app. Mỗi máy chỉ cần
> cài **một lần đời**.

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

## Phần 2 — Nối app với "mục lục" (chỉ làm **một lần cho mỗi máy**, không phải mỗi dự án)

Đây là bước để bản đồ **tự chạy sang điện thoại**. Làm một lần cho mỗi máy, sau đó quên luôn —
**mọi dự án về sau tự chui vào, khỏi đụng tay.**

**Trên máy tính (nơi bạn học):**

1. Cuối buổi đầu tiên, bảo Claude: *"cài đồng bộ cho dự án này"*.
2. Claude tự lo phần khó: tạo Gist cho dự án, tạo **mục lục chung**, rồi đưa bạn **một đường
   link bấm-được**. Bạn chỉ cần **bấm vào link đó một lần** — app trên máy tính tự nuốt mục lục.

**Đưa sang các máy khác (mỗi máy một lần đời):**

| Thiết bị | Cách nối |
|---|---|
| **Điện thoại** | Trên app máy tính bấm **"Chia sẻ…"** → hiện **mã QR** → điện thoại **quét** một phát |
| **Máy đọc E-Ink** (không có camera) | Bấm **"Từ link…"** trong app, **dán link mục lục** một lần |
| **Máy tính khác** | Bấm lại đường link Claude đưa (hoặc "Từ link…" dán link mục lục) |

Xong. Từ đó về sau, **học thêm dự án nào nó tự hiện trong app**, không phải làm gì thêm.

> 🔒 Mục lục là Gist **bí mật** gộp *tất cả* dự án: chỉ ai có link mới xem được. **Đừng đăng
> link ở nơi công khai.** Dự án nhạy cảm (như `license-tool`) thì càng phải giữ kín.

---

## Phần 3 — Xem bản đồ trên app (điện thoại / máy tính bảng / E-Ink)

Mở app: **https://tranthanh-huy.github.io/doc-code-app/**
(Lần đầu, bấm "Thêm vào màn hình chính" để dùng như một ứng dụng thật, mở offline được.)

Các nút chính:

| Nút | Làm gì |
|---|---|
| **Ô "Dự án:"** | Chọn dự án muốn xem (nếu có nhiều) |
| **"Chia sẻ…"** | Hiện **mã QR** để một máy khác quét là có ngay **tất cả** dự án |
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

1. Học xong một buổi trên máy tính (dự án cũ **hay dự án mới toanh** đều được).
2. Claude **tự đẩy** bản đồ mới lên Gist **và tự thêm dự án vào mục lục** (nó nhớ, tự làm cuối buổi).
3. Cầm điện thoại lên, mở app, **chờ khoảng nửa phút** rồi bấm **"Làm mới"** (hoặc mở lại app).
4. Bản đồ mới hiện ra — **dự án mới cũng tự xuất hiện trong ô "Dự án:", không cần dán gì.** Ngắm
   lại cả bức tranh, thử **kể lại một phần bằng lời của mình** — cách chắc nhất để biết mình đã
   thật sự hiểu.

> ⏳ **Vì sao phải chờ ~30 giây?** GitHub giữ tạm bản cũ khoảng nửa phút. Không phải lỗi — cứ
> chờ chút rồi "Làm mới" lại là ra bản mới.

---

## Ba điều dễ quên

1. **Không cần đụng vào code hay file `sodo.json`** — skill lo hết. Việc của bạn là đoán, hiểu,
   kể lại.
2. **Chỉ cài mục lục một lần cho mỗi máy** (không phải mỗi dự án). Sau đó dự án mới tự hiện, bạn
   chỉ cần "Làm mới".
3. **Bản đồ / dự án mới không hiện ngay?** → chờ ~30 giây, bấm "Làm mới". Vẫn không được thì kiểm tra mạng.

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
