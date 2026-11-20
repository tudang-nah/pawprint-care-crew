# Nâng cấp Trạm Chăm Boss: khách hàng và quản trị tách biệt

Làm theo đúng 4 giai đoạn bạn yêu cầu; sau mỗi giai đoạn web vẫn chạy được và giữ nguyên dữ liệu hiện có.

## Giai đoạn 1: Phân quyền và điều hướng
- 3 vai trò: khách hàng, cộng sự, admin, lưu riêng và kiểm tra trên máy chủ.
- Một trang đăng nhập/đăng ký chung. Tài khoản mới mặc định là khách hàng.
- Đăng nhập xong: khách vào /dat-lich, admin và cộng sự vào /quan-tri. Khách gõ thẳng /quan-tri sẽ bị chặn.
- Thành viên nhóm hiện tại được giữ: hau.hathkhoadien@hcmut.edu.vn là admin, trambong77@gmail.com là cộng sự.
- Chỉ admin cấp quyền cộng sự/admin.

## Giai đoạn 2: Đặt lịch cho khách (điện thoại trước)
- 4 bước có thanh tiến trình: Chọn bé, Chọn dịch vụ (chọn nhiều, tổng tiền tự cập nhật), Chọn ngày giờ (khung đầy bị làm mờ), Xác nhận.
- Màn hình cảm ơn với hiệu ứng dấu chân.
- Trang "Lịch của tôi": lịch sắp tới, lịch sử, huỷ/đổi lịch nếu còn trước 12 giờ.
- Khách chỉ thấy bé và lịch của chính mình.

## Giai đoạn 3: Khu quản trị (thanh bên trái)
- Hôm nay, Lịch (ngày/tuần, phân công cộng sự), Khách hàng, Dịch vụ & Đơn giá (theo loài x cân nặng, phụ phí).
- Chỉ admin: Doanh thu (biểu đồ, so sánh kỳ trước, xuất CSV) và Cộng sự (vai trò, ca làm).
- Cộng sự chỉ thấy lịch được giao và thông tin khách cần thiết, không thấy doanh thu, không sửa giá.

## Giai đoạn 4: Đánh bóng giao diện
- Nền kem ấm, cam đào, nhấn vàng bơ; tiêu đề Baloo 2, chữ thường Be Vietnam Pro.
- Trang chủ cho khách chưa đăng nhập: ảnh thú cưng, "Đặt lịch ngay", dịch vụ nổi bật, quy trình 3 bước, đánh giá, bảng giá tham khảo.
- Thẻ bo tròn, bóng mềm, hiệu ứng nhấc khi rê chuột, khung chờ tải thay chữ, trạng thái trống có minh hoạ, chế độ tối cho khu quản trị.

## Lưu ý
- Giao diện hiện tại (xanh teal, nền bạc hà) sẽ được thay bằng bảng màu mới.
- Các thông tin khách, bé, dịch vụ và lịch đã có sẽ được chuyển sang cách lưu mới, không mất dữ liệu.

## Chi tiết kỹ thuật
- Thay một dòng dữ liệu nhóm dạng JSON bằng các bảng riêng: user_roles (app_role enum + has_role security definer), customers (gắn user_id), pets, services, price_rules (species, min/max kg, price), surcharges, bookings + booking_items (lưu ảnh chụp giá), slots/capacity, staff_shifts. RLS: khách chỉ đọc/ghi dữ liệu của mình; cộng sự đọc lịch được phân công; admin toàn quyền.
- Migration chuyển dữ liệu từ care_state sang bảng mới; giữ care_state và đánh dấu DEPRECATED.
- Đặt lịch qua hàm security definer kiểm tra công suất khung giờ trong transaction (khoá hàng) để chống đặt trùng; huỷ/đổi kiểm tra mốc 12 giờ phía server.
- Route: /auth, /dat-lich, /lich-cua-toi dưới _authenticated; /quan-tri/* dưới layout kiểm tra vai trò qua has_role.
- Test cho quy tắc giá theo cân nặng, công suất và mốc huỷ 12 giờ.
