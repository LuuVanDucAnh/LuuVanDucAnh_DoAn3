USE QL_GiaoDoAn;
GO

PRINT '=============================================';
PRINT 'QL_GiaoDoAn - Multi-Restaurant Seed Data';
PRINT 'Password cho ALL accounts: 12345';
PRINT '=============================================';

-- =============================================
-- XOA DU LIEU CU
-- =============================================
DELETE FROM ChiTietDonHang;
DELETE FROM DonHang;
DELETE FROM MonAn;
DELETE FROM DanhMuc;
DELETE FROM NhanVien;
DELETE FROM Shipper;
DELETE FROM KhachHang;
DELETE FROM TaiKhoan;
DELETE FROM NhaHang;

-- Reset identity ve 0
DBCC CHECKIDENT ('ChiTietDonHang', RESEED, 0);
DBCC CHECKIDENT ('DonHang', RESEED, 0);
DBCC CHECKIDENT ('MonAn', RESEED, 0);
DBCC CHECKIDENT ('DanhMuc', RESEED, 0);
DBCC CHECKIDENT ('NhanVien', RESEED, 0);
DBCC CHECKIDENT ('Shipper', RESEED, 0);
DBCC CHECKIDENT ('KhachHang', RESEED, 0);
DBCC CHECKIDENT ('TaiKhoan', RESEED, 0);
DBCC CHECKIDENT ('NhaHang', RESEED, 0);
GO

-- =============================================
-- 1. TAO 5 NHA HANG
-- =============================================
INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode)
VALUES (N'Cơm Tấm Cali', N'123 Nguyễn Trãi, Quận 1, TP.HCM', '0901111111',
        '/images/Slide1.png', 20000, 'CT001');

INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode)
VALUES (N'Phở Thìn', N'45 Lê Thánh Tôn, Quận 1, TP.HCM', '0902222222',
        '/images/Slide2.png', 15000, 'PT002');

INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode)
VALUES (N'The Coffee House', N'78 Pasteur, Quận 1, TP.HCM', '0903333333',
        '/images/Slide3.png', 10000, 'CH003');

INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode)
VALUES (N'Pizza Company', N'56 Đồng Khởi, Quận 1, TP.HCM', '0904444444',
        '/images/Slide1.png', 50000, 'PC004');

INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode)
VALUES (N'Bún Đậu Cô Đội', N'12 Trần Hưng Đạo, Quận 5, TP.HCM', '0905555555',
        '/images/Slide2.png', 20000, 'BD005');
GO

-- =============================================
-- 2. TAO TAI KHOAN
-- bcrypt hash cua '12345':
-- $2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe
-- =============================================

-- Khach hang (MaTK 1-5)
INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) VALUES
(N'khachhang1', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'KhachHang'),
(N'khachhang2', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'KhachHang'),
(N'khachhang3', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'KhachHang'),
(N'khachhang4', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'KhachHang'),
(N'khachhang5', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'KhachHang');

-- Shipper (MaTK 6-10)
INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) VALUES
(N'shipper1', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Shipper'),
(N'shipper2', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Shipper'),
(N'shipper3', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Shipper'),
(N'shipper4', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Shipper'),
(N'shipper5', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Shipper');

-- Nhan vien (MaTK 11-15) - moi nhan vien quan ly 1 nha hang
INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) VALUES
(N'nhanvien1', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'NhanVien'),
(N'nhanvien2', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'NhanVien'),
(N'nhanvien3', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'NhanVien'),
(N'nhanvien4', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'NhanVien'),
(N'nhanvien5', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'NhanVien');

-- Admin (MaTK 16)
INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) VALUES
(N'admin', '$2a$10$.9gcOz1l7LlkYmZUZTEvp.fbusRh3/8.r6fYexIxpG1qLrzQYtgGe', N'Admin');
GO

-- =============================================
-- 3. TAO KHACH HANG
-- =============================================
INSERT INTO KhachHang (MaTK, HoTen, SoDienThoai, DiaChi) VALUES
(1, N'Nguyễn Văn An', '0911111111', N'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội'),
(2, N'Trần Thị Bình', '0922222222', N'Ngõ 10 Tôn Thất Tùng, Đống Đa, Hà Nội'),
(3, N'Lê Văn Cường', '0933333333', N'KTX Bách Khoa, Hai Bà Trưng, Hà Nội'),
(4, N'Phạm Thu Dung', '0944444444', N'15 Giải Phóng, Hoàng Mai, Hà Nội'),
(5, N'Hoàng Văn Em', '0955555555', N'20 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội');
GO

-- =============================================
-- 4. TAO SHIPPER
-- =============================================
INSERT INTO Shipper (MaTK, HoTen, BienSoXe, SoDienThoai) VALUES
(6, N'Nguyễn Văn Hậu', '29-A1 12345', '0981111111'),
(7, N'Trần Văn Hiệp', '29-B2 23456', '0982222222'),
(8, N'Bùi Kim Trại', '29-C3 34567', '0983333333'),
(9, N'Phạm Văn Nam', '29-D4 45678', '0984444444'),
(10, N'Dương Tiến Anh', '29-E5 56789', '0985555555');
GO

-- =============================================
-- 5. TAO NHAN VIEN (moi nhan vien quan ly 1 nha hang)
-- =============================================
INSERT INTO NhanVien (MaTK, MaNhaHang, HoTen) VALUES
(11, 1, N'Vũ Thị Lành'),
(12, 2, N'Đặng Văn Minh'),
(13, 3, N'Bùi Thị Hương'),
(14, 4, N'Đỗ Văn Tuấn'),
(15, 5, N'Trịnh Thị Lan');
GO

-- =============================================
-- 6. TAO DANH MUC
-- =============================================
INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Cơm');
INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Món Nước');
INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Đồ Uống');
INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Đồ Ăn Nhanh');
INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Ăn Vặt');
GO

-- =============================================
-- 7. TAO MON AN
-- NhaHang 1: Cơm Tấm Cali (Danh muc 1: Cơm)
-- =============================================
INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) VALUES
(N'Cơm Tấm Sườn Trứng', 55000, N'Cơm tấm với sườn bì chả, trứng ốp la đặc trưng',
 '/images/Suon-ram-man.jpg', 1, 1, 100),
(N'Cơm Tấm Sườn Non', 60000, N'Sườn non nướng mật ong thơm lừng',
 '/images/Ba-chi-nuong.jpg', 1, 1, 100),
(N'Cơm Tấm Gà Chiên', 50000, N'Gà chiên giòn rụm, ăn kèm dưa leo và đồ chua',
 '/images/Ga-chien-mam.jpg', 1, 1, 100),
(N'Cơm Tấm Cá Kho Tộ', 65000, N'Cá kho tộ đậm đà, thơm mùi nước mắm',
 '/images/Ca-kho-to.jpg', 1, 1, 100),
(N'Trứng Chiên Phồng', 15000, N'Trứng chiên phồng giòn rụm',
 '/images/Trung-thit-bam.jpg', 1, 1, 100),
(N'Nước Sâm Bông Cất Gió', 15000, N'Nước sâm mát lạnh, giải nhiệt',
 '/images/Tra-dao-cam-xa.jpg', 2, 1, 100),
(N'Chanh Đá', 20000, N'Chanh tươi vắt đá lạnh',
 '/images/Chanh-day.jpg', 2, 1, 100);

-- NhaHang 2: Phở Thìn (Danh muc 2: Món Nước)
INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) VALUES
(N'Phở Bò Tái', 50000, N'Phở bò tái nạm mềm, nước dùng đậm đà',
 '/images/Muc-xao.jpg', 2, 2, 100),
(N'Phở Gân', 55000, N'Phở bò gân giòn sần sật, hấp dẫn',
 '/images/Lau-bo-nam.jpg', 2, 2, 100),
(N'Phở Bò Chín', 45000, N'Phở bò chín mềm thơm ngon',
 '/images/Thit-kho-trung.jpg', 2, 2, 100),
(N'Phở Gà', 45000, N'Phở gà thanh đạm, nước dùng trong veo',
 '/images/Bun-gao-xao.jpg', 2, 2, 100),
(N'Quẩy Chiên Giòn', 15000, N'Quẩy phở chiên vàng giòn',
 '/images/Khoai-tay-chien.jpg', 2, 2, 100),
(N'Chanh Tươi', 15000, N'Chanh vắt đá lạnh',
 '/images/Chanh-day.jpg', 2, 2, 100);

-- NhaHang 3: The Coffee House (Danh muc 3: Đồ Uống)
INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) VALUES
(N'Trà Sữa Trân Châu Đường Đen', 35000, N'Trà sữa kem sữa, trân châu dai mềm thơm ngọt',
 '/images/Tra-sua-tran-chau-duong-den.jpg', 3, 3, 100),
(N'Trà Sữa Matcha', 40000, N'Trà xanh Nhật Bản hòa với sữa, vị đắng nhẹ',
 '/images/Tra-sua-matcha.jpg', 3, 3, 100),
(N'Cà Phê Sữa Đá', 25000, N'Cà phê Việt Nam pha sẵn, sữa đặc ngọt',
 '/images/Slide1.png', 3, 3, 100),
(N'Cà Phê Đen Đá', 20000, N'Cà phê đen thuần khiết, đá lạnh',
 '/images/Slide1.png', 3, 3, 100),
(N'Freeze Việt Quất', 45000, N'Đá xay việt quất mát lạnh, topping kem',
 '/images/Sinh-to-bo.jpg', 3, 3, 100),
(N'Trà Chanh', 20000, N'Trà chanh tươi mát, giải khát cực đã',
 '/images/Tra-tac.jpg', 3, 3, 100),
(N'Cappuccino', 45000, N'Cà phê Ý với bọt sữa mịn',
 '/images/Slide2.png', 3, 3, 100);

-- NhaHang 4: Pizza Company (Danh muc 4: Đồ Ăn Nhanh)
INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) VALUES
(N'Pizza Hải Sản', 159000, N'Pizza với tôm, mực, cua và phô mai Mozzarella',
 '/images/Lau-ca-chua-cay.jpg', 4, 4, 100),
(N'Pizza Gà BBQ', 139000, N'Pizza gà nướng sốt BBQ đậm đà',
 '/images/Ga-chien-mam.jpg', 4, 4, 100),
(N'Pizza Thịt Heo', 149000, N'Pizza thịt heo muối Ý, thơm ngon',
 '/images/Ba-chi-nuong.jpg', 4, 4, 100),
(N'Pizza Rau Củ', 129000, N'Pizza chay với rau củ tươi ngon',
 '/images/Banh-trang-tron.jpg', 4, 4, 100),
(N'Mì Ý Spaghetti', 99000, N'Mì Ý sốt cà chua bò bằm Ý',
 '/images/Muc-xao.jpg', 4, 4, 100),
(N'Khoai Tây Chiên', 35000, N'Khoai tây chiên giòn vàng, kèm sốt ketchup',
 '/images/Khoai-tay-chien.jpg', 4, 4, 100);

-- NhaHang 5: Bún Đậu Cô Đội (Danh muc 5: Ăn Vặt)
INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) VALUES
(N'Bún Đậu Thập Cẩm', 50000, N'Bún đậu với đậu phụ rán, thịt chân giò, nem chua',
 '/images/Bun-gao-xao.jpg', 5, 5, 100),
(N'Bún Đậu Mắm Tôm', 45000, N'Bún đậu chan mắm tôm pha nước mắm chua ngọt',
 '/images/Bun-gao-xao.jpg', 5, 5, 100),
(N'Bún Đậu Nem Chua', 48000, N'Bún đậu kèm nem chua thơm lừng',
 '/images/Cha-gio-chay.png', 5, 5, 100),
(N'Đậu Phụ Rán Giòn', 25000, N'Đậu phụ rán vàng giòn ăn kèm',
 '/images/Tau-hu-chien.png', 5, 5, 100),
(N'Chả Cốm', 30000, N'Chả cốm Hà Nội thơm ngon đặc trưng',
 '/images/Cha-ca-thi-la.jpg', 5, 5, 100),
(N'Nước Mơ', 15000, N'Nước mơ rang mát lạnh, giải khát',
 '/images/Tra-tac.jpg', 2, 5, 100);
GO

-- =============================================
-- 8. TAO DON HANG - đủ cac trang thai
-- =============================================

-- DON 1: ChoXacNhan (khach dat, nha hang chua xac nhan)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (1, NULL, 1, GETDATE(), N'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', N'Giao nhanh giúp em', 115000, 15000, N'TienMat', N'ChuaThanhToan', N'ChoXacNhan');

-- DON 2: Huy (khach huy)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (2, NULL, 2, DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, -1, GETDATE()), N'Ngõ 10 Tôn Thất Tùng, Đống Đa, Hà Nội', N'Không cần giao nữa', 65000, 15000, N'ChuyenKhoan', N'DaThanhToan', N'Huy');

-- DON 3: DaXacNhan (nha hang da xac nhan, chua chuan bi)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (3, NULL, 3, DATEADD(HOUR, -3, GETDATE()), N'KTX Bách Khoa, Hai Bà Trưng, Hà Nội', N'Chờ đến 12h giải lao', 80000, 15000, N'TienMat', N'ChuaThanhToan', N'DaXacNhan');

-- DON 4: DangChuanBi (nha hang dang chuan bi)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (4, NULL, 4, DATEADD(HOUR, -2, GETDATE()), N'15 Giải Phóng, Hoàng Mai, Hà Nội', N'Liên hệ trước khi giao', 198000, 15000, N'ChuyenKhoan', N'DaThanhToan', N'DangChuanBi');

-- DON 5: Huy (nha hang huy - het nguyen lieu)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (5, NULL, 5, DATEADD(DAY, -2, GETDATE()), DATEADD(HOUR, -48, GETDATE()), N'20 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', N'Quán hủy - hết nguyên liệu', 60000, 15000, N'TienMat', N'ChuaThanhToan', N'Huy');

-- DON 6: SanSangGiao (shipper chua nhan, do an da san sang)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (1, NULL, 2, DATEADD(HOUR, -1, GETDATE()), N'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', N'Giao giờ trưa', 110000, 15000, N'TienMat', N'ChuaThanhToan', N'SanSangGiao');

-- DON 7: DangGiao (shipper da nhan va dang giao)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (2, 1, 1, DATEADD(HOUR, -2, GETDATE()), N'Ngõ 10 Tôn Thất Tùng, Đống Đa, Hà Nội', N'Gọi điện trước khi giao', 170000, 15000, N'TienMat', N'ChuaThanhToan', N'DangGiao');

-- DON 8: DangGiao (shipper khac dang giao)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (3, 2, 4, DATEADD(HOUR, -1, GETDATE()), N'KTX Bách Khoa, Hai Bà Trưng, Hà Nội', N'', 213000, 15000, N'ChuyenKhoan', N'DaThanhToan', N'DangGiao');

-- DON 9: DaGiao (giao thanh cong)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (4, 3, 3, DATEADD(DAY, -1, GETDATE()), GETDATE(), N'15 Giải Phóng, Hoàng Mai, Hà Nội', N'Cảm ơn', 95000, 15000, N'TienMat', N'DaThanhToan', N'DaGiao');

-- DON 10: DaGiao (giao thanh cong)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (5, 1, 1, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -3, GETDATE()) + 1, N'20 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', N'', 125000, 15000, N'ChuyenKhoan', N'DaThanhToan', N'DaGiao');

-- DON 11: DaGiao (giao thanh cong)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (1, 2, 5, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()) + 2, N'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', N'Rất ngon', 75000, 15000, N'TienMat', N'DaThanhToan', N'DaGiao');

-- DON 12: Huy (shipper huy sau khi nhan)
INSERT INTO DonHang (MaKhachHang, MaShipper, MaNhaHang, NgayDat, NgayGiao, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThaiThanhToan, TrangThai)
VALUES (2, 4, 3, DATEADD(DAY, -1, GETDATE()), GETDATE(), N'Ngõ 10 Tôn Thất Tùng, Đống Đa, Hà Nội', N'Shipper hủy - đường xa quá', 85000, 15000, N'TienMat', N'ChuaThanhToan', N'Huy');
GO

-- =============================================
-- 9. TAO CHI TIET DON HANG
-- =============================================

-- Don 1: Cơm Tấm (3 món)
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(1, 1, 1, 55000),
(1, 5, 1, 15000),
(1, 6, 2, 15000);

-- Don 2: Phở (đã hủy)
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(2, 8, 1, 50000);

-- Don 3: Coffee House
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(3, 13, 2, 25000),
(3, 12, 1, 35000);

-- Don 4: Pizza
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(4, 16, 1, 159000),
(4, 20, 1, 99000);

-- Don 5: Bún Đậu (đã hủy)
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(5, 22, 1, 50000);

-- Don 6: Phở
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(6, 8, 1, 50000),
(6, 9, 1, 55000);

-- Don 7: Cơm Tấm
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(7, 2, 2, 60000),
(7, 3, 1, 50000),
(7, 7, 2, 20000);

-- Don 8: Pizza
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(8, 17, 1, 139000),
(8, 20, 1, 99000),
(8, 21, 2, 35000);

-- Don 9: Coffee House
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(9, 12, 2, 35000),
(9, 15, 1, 45000);

-- Don 10: Cơm Tấm
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(10, 1, 2, 55000);

-- Don 11: Bún Đậu
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(11, 23, 1, 45000),
(11, 25, 1, 25000);

-- Don 12: Coffee House (shipper hủy)
INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia) VALUES
(12, 14, 2, 25000),
(12, 12, 1, 35000);
GO

-- =============================================
-- 10. KIEM TRA DU LIEU
-- =============================================
PRINT '';
PRINT '=== Tai Khoan ===';
SELECT * FROM TaiKhoan;

PRINT '';
PRINT '=== Khach Hang ===';
SELECT * FROM KhachHang;

PRINT '';
PRINT '=== Shipper ===';
SELECT * FROM Shipper;

PRINT '';
PRINT '=== Nha Hang ===';
SELECT * FROM NhaHang;

PRINT '';
PRINT '=== Nhan Vien ===';
SELECT * FROM NhanVien;

PRINT '';
PRINT '=== Danh Muc ===';
SELECT * FROM DanhMuc;

PRINT '';
PRINT '=== Mon An ===';
SELECT * FROM MonAn;

PRINT '';
PRINT '=== Don Hang ===';
SELECT * FROM DonHang;

PRINT '';
PRINT '=== Chi Tiet Don Hang ===';
SELECT * FROM ChiTietDonHang;

PRINT '';
PRINT '=== Thong ke don hang theo trang thai ===';
SELECT TrangThai, COUNT(*) AS SoLuong FROM DonHang GROUP BY TrangThai;

PRINT '';
PRINT '=== Thong ke don hang theo nha hang ===';
SELECT nh.TenNhaHang, dh.TrangThai, COUNT(*) AS SoLuong
FROM DonHang dh
JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
GROUP BY nh.TenNhaHang, dh.TrangThai;

PRINT '';
PRINT '=============================================';
PRINT 'Seed data hoan tat!';
PRINT 'Tat ca tai khoan co mat khau: 12345';
PRINT '=============================================';
GO
