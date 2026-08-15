# Lotto Demo V11

V11 sửa theo toàn bộ note ngày 15/08/2026.

## Bao Lô
Giá mỗi số:
- Lô 2 Số: 27.000 VND
- Lô 2 Số Đầu: 23.000 VND
- Lô 2 Số 1K: 1.000 VND
- Lô 3 Số: 23.000 VND
- Lô 4 Số: 20.000 VND

Số tiền = số mục đã chọn × giá mỗi số × số nhân.

Chọn số nhanh được dựng lại giống screenshot:
- range 00-99 / 000-099 / 0000-0099,
- Ngẫu Nhiên,
- Đặc biệt,
- Ít Xuất Hiện,
- badge số nhỏ ở góc,
- chọn số có viền xanh + dấu tick.

## Lô Xiên
- Xiên 2 / Xiên 3 / Xiên 4.
- Chỉ khi chọn ĐỦ 2/3/4 số mới tính 1.000 VND × số nhân.
- Khi đủ số, các số chưa chọn bị làm mờ/khóa.
- Click lại số đang chọn để bỏ chọn và mở khóa grid.

## Đánh Đề
Đã có đủ 5 tab:
- Đề đặc biệt
- Đề đầu đặc biệt
- Đề Giải 7
- Đề Giải Nhất
- Đề đầu giải nhất

Đề Giải 7: 4.000 VND / số.
Các tab Đề còn lại đang giữ 1.000 VND / số vì chưa có mức giá khác trong note.

Chọn số nhanh:
- 10 / 20 / 30 / 40 / 50 số,
- Cùng số / Chẵn / Lẻ / Tài / Xỉu,
- Top 1 / 2 / 5 / 10 / 20.

## Đầu Đuôi
- Không còn tab Chọn số nhanh.
- Chỉ có Chọn số và Con số.

## 3 Càng
Đủ 4 tab:
- 3 Càng Đặc Biệt
- 3 Càng Giải Nhất
- 3 Càng Đầu Đuôi
- 3 Càng Đầu

Giá:
- 3 Càng Đầu Đuôi: 4.000 VND / số
- 3 Càng Đầu: 3.000 VND / số
- Hai tab chưa được nêu giá giữ 1.000 VND / số.

## 4 Càng
- Không còn Chọn số nhanh.
- Chỉ Chọn số / Con số.

## Kết toán demo
V11 lưu unitStake và oddsRatio trên từng vé và dùng đúng tab con khi xét kết quả:
- Bao lô tính số lần xuất hiện,
- Lô Xiên yêu cầu đủ bộ,
- Đề Giải 7 đọc riêng Giải 7,
- Đề Giải Nhất đọc riêng Giải Nhất,
- 3 Càng dùng đúng nhóm giải theo tab.


## V12

- Sau 18:15 nếu Minh Ngọc chưa có KQXS của đúng ngày hôm nay:
  - hiển thị `Hết giờ --`
  - hiển thị `Đang chuẩn bị`
  - không tự nhảy countdown sang ngày mai.
- Chỉ khi nguồn Minh Ngọc tải được kết quả của hôm nay mới bắt đầu countdown kỳ tiếp theo.
- Lô Xiên > Con số chuyển về dạng textarea nhập số giống các trò khác.
- Grid Chọn số nhanh desktop được giảm chiều cao để thành ô chữ nhật dài hơn.
- Badge thống kê là số demo hợp lý:
  - 2 chữ số: tối đa 20
  - 3 chữ số: tối đa 8
  - 4 chữ số: tối đa 3
  Đây không phải thống kê thật của Minh Ngọc.


## V13 - Quy tắc hiển thị countdown

Countdown được tách hoàn toàn khỏi việc Minh Ngọc đã cập nhật KQXS hay chưa:

- Trước 18:15: đếm ngược tới 18:15 hôm nay.
- 18:15 <= giờ < 19:30:
  - `Hết giờ --`
  - `Đang chuẩn bị`
  - dù KQXS Minh Ngọc đã cập nhật vẫn KHÔNG hiện countdown ngày mai.
- Từ 19:30:
  - bắt đầu countdown tới 18:15 ngày hôm sau.
  - Ví dụ 19:30 thì còn khoảng 22 giờ 45 phút.

KQXS Minh Ngọc vẫn được đọc/xét vé ngay khi có dữ liệu. Chỉ phần hiển thị countdown bị giữ tới 19:30.


## V14
Đồng bộ typography khu lịch sử:
- Hồ sơ cá cược
- Thắng thua
- Chưa thanh toán
- Làm mới
- toàn bộ tiêu đề cột bảng

Tất cả dùng cùng font-size 11px và font-weight 400.


## V15
- Mobile chọn game chuyển thành modal giống ảnh gốc: nền mờ, tiêu đề, cột Cổ điển, nhóm game, nút đóng tròn.
- Giảm kích thước mode tabs, nút số và bottom bar mobile để không bị phóng quá to.
