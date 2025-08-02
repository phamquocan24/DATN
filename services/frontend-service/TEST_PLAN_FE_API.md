# Kịch bản Test: Luồng API & Frontend

## Giới thiệu
Tài liệu này mô tả các kịch bản test (test cases) để xác minh các luồng nghiệp vụ chính của ứng dụng đã được kết nối đúng giữa Frontend và API.

**Mục tiêu:**
- Đảm bảo dữ liệu được hiển thị chính xác từ API.
- Đảm bảo các hành động của người dùng trên UI (tạo, sửa, xóa) được phản ánh đúng ở phía backend.
- Kiểm tra luồng hoạt động cho 3 vai trò chính: **Ứng viên (Candidate)**, **Nhà tuyển dụng (HR)**, và **Quản trị viên (Admin)**.

---

## I. Luồng Ứng viên (Candidate)

### 1.1. Tìm kiếm và Khám phá việc làm (Không cần đăng nhập)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| C-01 | Xem danh sách việc làm | 1. Mở trang chủ hoặc trang "Tìm việc". <br> 2. Scroll xuống xem danh sách. | - Hiển thị danh sách các tin tuyển dụng. <br> - Dữ liệu khớp với `GET /api/v1/jobs`. | |
| C-02 | Tìm kiếm việc làm | 1. Vào trang "Tìm việc". <br> 2. Nhập từ khóa (e.g., "React Developer") vào ô tìm kiếm. <br> 3. Nhấn nút "Tìm kiếm". | - Hiển thị các công việc khớp với từ khóa. <br> - API call `GET /api/v1/jobs/search?keyword=...` được gọi. | |
| C-03 | Xem chi tiết việc làm | 1. Từ danh sách, click vào một tin tuyển dụng. | - Chuyển sang trang chi tiết công việc. <br> - Hiển thị đầy đủ thông tin: mô tả, yêu cầu, phúc lợi. <br> - Dữ liệu khớp với `GET /api/v1/jobs/:id`. | |
| C-04 | Xem việc làm mới nhất | 1. Truy cập trang có module "Việc làm mới nhất". | - Hiển thị danh sách các công việc được đăng gần đây. <br> - Dữ liệu khớp với `GET /api/v1/jobs/latest`. | |

### 1.2. Quản lý việc làm đã lưu (Yêu cầu đăng nhập)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| C-05 | Lưu tin tuyển dụng | 1. Đăng nhập với tài khoản Candidate. <br> 2. Tìm một công việc và vào trang chi tiết. <br> 3. Click vào icon "Lưu" (bookmark). | - Icon thay đổi trạng thái đã lưu. <br> - Hiển thị thông báo thành công. <br> - API `POST /api/v1/jobs/:id/bookmark` được gọi. | |
| C-06 | Xem danh sách đã lưu | 1. Đăng nhập. <br> 2. Vào trang quản lý cá nhân, mục "Việc làm đã lưu". | - Hiển thị danh sách các công việc đã được lưu. <br> - Dữ liệu khớp với `GET /api/v1/jobs/bookmarked`. | |
| C-07 | Bỏ lưu tin tuyển dụng | 1. Từ trang "Việc làm đã lưu", click vào nút "Bỏ lưu". | - Công việc bị xóa khỏi danh sách. <br> - API `DELETE /api/v1/jobs/:id/bookmark` được gọi. | |

---

## II. Luồng Nhà tuyển dụng (HR)

### 2.1. Quản lý Tin tuyển dụng (Yêu cầu đăng nhập HR)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| HR-01 | Xem tin tuyển dụng của công ty | 1. Đăng nhập với tài khoản HR. <br> 2. Vào trang "Quản lý tin tuyển dụng". | - Hiển thị danh sách các tin do chính HR hoặc công ty của họ đăng. <br> - Dữ liệu khớp với `GET /api/v1/jobs/my-jobs`. | |
| HR-02 | Tạo tin tuyển dụng mới | 1. Từ trang quản lý, click "Đăng tin mới". <br> 2. Điền đầy đủ thông tin vào form. <br> 3. Nhấn "Đăng tin". | - Hiển thị thông báo thành công. <br> - Tin tuyển dụng mới xuất hiện trong danh sách. <br> - API `POST /api/v1/jobs` được gọi. | |
| HR-03 | Cập nhật tin tuyển dụng | 1. Từ danh sách, chọn một tin và click "Sửa". <br> 2. Thay đổi một vài thông tin (e.g., mô tả, mức lương). <br> 3. Nhấn "Lưu thay đổi". | - Hiển thị thông báo thành công. <br> - Thông tin của tin tuyển dụng được cập nhật. <br> - API `PUT /api/v1/jobs/:id` được gọi. | |
| HR-04 | Xóa tin tuyển dụng | 1. Từ danh sách, chọn một tin và click "Xóa". <br> 2. Xác nhận hành động. | - Hiển thị thông báo thành công. <br> - Tin tuyển dụng biến mất khỏi danh sách. <br> - API `DELETE /api/v1/jobs/:id` được gọi. | |
| HR-05 | Thay đổi trạng thái tin tuyển dụng | 1. Từ danh sách, thay đổi trạng thái (e.g., "Tạm dừng"). | - Trạng thái của tin được cập nhật trên UI. <br> - API `PATCH /api/v1/jobs/:id/status` được gọi. | |

### 2.2. Thống kê (Yêu cầu đăng nhập HR)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| HR-06 | Xem thống kê trên Dashboard | 1. Đăng nhập HR. <br> 2. Vào trang Dashboard. | - Hiển thị các card thống kê về tổng số tin, số lượt ứng tuyển... <br> - Dữ liệu khớp với `GET /api/v1/jobs/stats`. | |

---

## III. Luồng Quản trị viên (Admin)

### 3.1. Duyệt tin tuyển dụng (Yêu cầu đăng nhập Admin)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| AD-01 | Xem danh sách tin chờ duyệt | 1. Đăng nhập với tài khoản Admin. <br> 2. Vào trang "Quản lý tin tuyển dụng", tab "Chờ duyệt". | - Hiển thị danh sách các tin có trạng thái "pending". <br> - Dữ liệu khớp với `GET /api/v1/jobs/pending`. | |
| AD-02 | Phê duyệt tin tuyển dụng | 1. Từ danh sách chờ duyệt, click vào một tin. <br> 2. Click nút "Phê duyệt". | - Tin tuyển dụng biến mất khỏi danh sách chờ duyệt. <br> - Trạng thái của tin được cập nhật thành "approved". <br> - API `POST /api/v1/jobs/:id/approve` được gọi. | |
| AD-03 | Từ chối tin tuyển dụng | 1. Từ danh sách chờ duyệt, click vào một tin. <br> 2. Click nút "Từ chối". | - Tin tuyển dụng biến mất khỏi danh sách chờ duyệt. <br> - Trạng thái của tin được cập nhật thành "rejected". <br> - API `POST /api/v1/jobs/:id/reject` được gọi. | |

### 3.2. Thống kê (Yêu cầu đăng nhập Admin)

| ID | Luồng | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| AD-04 | Xem thống kê tổng quan | 1. Đăng nhập Admin. <br> 2. Vào trang Dashboard. | - Hiển thị các card thống kê về tổng số tin, tin mới, tin vi phạm... <br> - Dữ liệu khớp với `GET /api/v1/jobs/stats`. | | 