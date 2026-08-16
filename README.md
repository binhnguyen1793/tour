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


## V16
Fix mobile game picker:
- modal scroll toàn bộ nội dung từ Bao Lô đến 4 Càng;
- không còn scroll lồng ở cột bên phải;
- cột Cổ điển sticky;
- hỗ trợ touch pan-y và momentum scrolling trên iPhone;
- nhóm 4 Càng luôn nằm trong danh sách cuối cùng.


## V17
Chỉnh CSS mobile game picker sát ảnh gốc hơn:
- modal hẹp hơn, bo góc ~14px;
- tiêu đề nhỏ và gọn;
- cột `Cổ điển` rộng ~82px, nền xanh nhạt;
- nhóm game cách nhau ít hơn;
- nút game thấp ~40-42px, chữ 13-14px;
- active chỉ viền xanh + nền nhạt, không fill xanh đậm;
- nút đóng tròn ~42-44px;
- giữ scroll toàn body từ Bao Lô tới 4 Càng.


## V18
Popup `Danh sách trò chơi` trên mobile:
- bo tròn đủ 4 góc;
- hai góc dưới giống hai góc trên;
- nội dung cuộn vẫn bị clip theo khung trắng;
- nút X nằm ngoài khung nên không bị cắt;
- vẫn cuộn tới hết 4 Càng.


## V19
Fix lỗi V18:
- block CSS V18 trước bị ghi thành literal `\n`, browser không parse đúng;
- V19 ghi CSS bằng newline thật;
- dialog dùng `border-radius` + `overflow:hidden`;
- body cũng có radius hai góc dưới;
- nút X nằm ngoài dialog trong `.mobile-game-shell`.


## V20 - Desktop fixed canvas

Desktop >= 761px:
- canvas tối thiểu 1500px;
- game area cố định 1404px;
- cột trái 1090px;
- KQXS 300px;
- khi thu nhỏ cửa sổ desktop, nội dung KHÔNG co lại;
- phần bên phải bị cắt khỏi viewport giống trang tham chiếu.

Mobile <= 760px:
- vẫn dùng responsive mobile riêng như trước.


## V21
Thu nhỏ thêm các ô `Chọn số nhanh` trên desktop:
- smart grid: cao 30px;
- Lô Xiên: cao 29px;
- font và badge nhỏ hơn;
- giữ nguyên 9 cột và layout desktop cố định;
- mobile không thay đổi.


## V22
Quick select desktop:
- nới cột điều khiển trái lên 375px;
- các nhóm Random / Đặc biệt / Top luôn nằm 1 hàng;
- giảm padding và gap nút;
- grid số bên phải vẫn giữ 9 cột.


## V23
- Tỷ lệ cược:
  - Lô 2 Số 99.9
  - Lô 2 Số Đầu 99.9
  - Lô 2 Số 1K 3.7
  - Lô 3 Số 980
  - Lô 4 Số 8880
  - Xiên 2/3/4 = 16/65/180
  - Đánh Đề tất cả = 99.5
  - Đầu/Đuôi = 9.95
  - 3 Càng tất cả = 980
  - 4 Càng = 8880
- Badge quick-select được đặt absolute nên số chính luôn căn giữa ô.
- Đổi tab lớn hoặc tab con:
  - reset toàn bộ lựa chọn,
  - reset range,
  - game có Chọn số => về Chọn số,
  - Lô Xiên => về Chọn số nhanh.


## V24 - Popup hướng dẫn

Có 3 loại popup dùng chung một giao diện:
1. `Cách chơi`
2. `Hướng dẫn` ở Chọn số nhanh
3. `Nóng/Lạnh` ở Chọn số của Đánh Đề / 3 Càng / 4 Càng

### Chỗ tự sửa nội dung
Mở `index.html`, tìm:

`NỘI DUNG POPUP - BẠN CÓ THỂ TỰ SỬA NGAY TRONG HTML`

- `helpQuickTemplate`: Hướng dẫn Chọn số nhanh.
- `helpHotColdTemplate`: Nóng/Lạnh.
- Mỗi `<template data-help-type="play" ...>`: Cách chơi của từng tab con.

JS tự nhận game/tab hiện tại và mở đúng nội dung.


## V25 - Thống kê dưới số ở Chọn số
Chỉ hiển thị ở:
- Đánh Đề
- 3 Càng
- 4 Càng

Mỗi chữ số 0-9 ở từng hàng có một thống kê nhỏ phía dưới.

Quy ước:
- 0-1: đỏ
- >=10: xanh
- 2-9: xám

Giá trị hiện là dữ liệu demo 0-49, mô phỏng "số lần không xuất hiện liên tiếp trong 50 kỳ".


## V26 - Logo PNG GitHub

Trong `index.html`, tìm `id="siteLogoImage"`.

Thay URL:

`https://raw.githubusercontent.com/USERNAME/REPOSITORY/main/logo-234.png`

bằng URL RAW của ảnh logo trên GitHub.

Ví dụ:

`https://raw.githubusercontent.com/bongkem123/lotto-demo/main/logo-234.png`

Kích thước đã căn sẵn cho header desktop:
- vùng logo: 320 x 78px
- ảnh: 285 x 62px
- `object-fit: contain`
- PNG trong suốt nên nền xanh header sẽ tự hiện phía sau.
