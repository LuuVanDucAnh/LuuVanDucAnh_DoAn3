-- =============================================
-- DATABASE: QL_GiaoDoAn
-- Create Database
-- =============================================
CREATE LOGIN sa1 WITH PASSWORD = '123456', DEFAULT_DATABASE = QL_GiaoDoAn;
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'QL_GiaoDoAn')
BEGIN
    CREATE DATABASE QL_GiaoDoAn;
END
GO

USE QL_GiaoDoAn;
GO

-- =============================================
-- 1. TaiKhoan
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaiKhoan')
BEGIN
    CREATE TABLE TaiKhoan (
        MaTK INT IDENTITY(1,1) PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        MatKhau VARCHAR(255) NOT NULL,
        VaiTro VARCHAR(20) CHECK (VaiTro IN ('KhachHang','NhanVien','Shipper','Admin')),
        NgayTao DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- 2. KhachHang
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KhachHang')
BEGIN
    CREATE TABLE KhachHang (
        MaKhachHang INT IDENTITY(1,1) PRIMARY KEY,
        MaTK INT,
        HoTen NVARCHAR(100),
        SoDienThoai VARCHAR(15),
        DiaChi NVARCHAR(255),
        FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
    );
END
GO

-- =============================================
-- 3. Shipper
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Shipper')
BEGIN
    CREATE TABLE Shipper (
        MaShipper INT IDENTITY(1,1) PRIMARY KEY,
        MaTK INT,
        HoTen NVARCHAR(100),
        BienSoXe VARCHAR(20),
        SoDienThoai VARCHAR(15),
        FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
    );
END
GO

-- =============================================
-- 4. NhaHang (1 quán duy nhất)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NhaHang')
BEGIN
    CREATE TABLE NhaHang (
        MaNhaHang INT IDENTITY(1,1) PRIMARY KEY,
        TenNhaHang NVARCHAR(255),
        DiaChi NVARCHAR(255),
        SoDienThoai VARCHAR(15),
        HinhAnh NVARCHAR(MAX),
        MinOrder DECIMAL(10,2) DEFAULT 0,
        MaCode VARCHAR(20) UNIQUE
    );
END
GO

-- =============================================
-- 5. NhanVien
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NhanVien')
BEGIN
    CREATE TABLE NhanVien (
        MaNhanVien INT IDENTITY(1,1) PRIMARY KEY,
        MaTK INT,
        MaNhaHang INT DEFAULT 1,
        HoTen NVARCHAR(100),
        FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK),
        FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang)
    );
END
GO

-- =============================================
-- 6. DanhMuc
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DanhMuc')
BEGIN
    CREATE TABLE DanhMuc (
        MaDanhMuc INT IDENTITY(1,1) PRIMARY KEY,
        TenDanhMuc NVARCHAR(100)
    );
END
GO

-- =============================================
-- 7. MonAn
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MonAn')
BEGIN
    CREATE TABLE MonAn (
        MaMonAn INT IDENTITY(1,1) PRIMARY KEY,
        TenMon NVARCHAR(255),
        Gia DECIMAL(10,2),
        MoTa NVARCHAR(MAX),
        HinhAnh NVARCHAR(MAX),
        MaDanhMuc INT,
        MaNhaHang INT DEFAULT 1,
        SoLuong INT DEFAULT 100,
        FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc),
        FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang)
    );
END
GO

-- Thêm cột SoLuong nếu bảng đã tồn tại mà chưa có cột này
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MonAn') AND name = 'SoLuong')
BEGIN
    ALTER TABLE MonAn ADD SoLuong INT DEFAULT 100;
END
GO

-- =============================================
-- 8. DonHang
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonHang')
BEGIN
    CREATE TABLE DonHang (
        MaDonHang INT IDENTITY(1,1) PRIMARY KEY,
        MaKhachHang INT,
        MaShipper INT,
        MaNhaHang INT DEFAULT 1,
        NgayDat DATETIME DEFAULT GETDATE(),
        NgayGiao DATETIME,
        DiaChiGiao NVARCHAR(255),
        GhiChu NVARCHAR(MAX),
        TongTien DECIMAL(10,2),
        PhiShip DECIMAL(10,2) DEFAULT 15000,
        PhuongThucThanhToan NVARCHAR(50),
        TrangThaiThanhToan NVARCHAR(50) DEFAULT 'ChuaThanhToan',
        TrangThai VARCHAR(50)
            CHECK (TrangThai IN ('ChoXacNhan','DaXacNhan','DangChuanBi','SanSangGiao','DangGiao','DaGiao','Huy'))
            DEFAULT 'ChoXacNhan',
        FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
        FOREIGN KEY (MaShipper) REFERENCES Shipper(MaShipper),
        FOREIGN KEY (MaNhaHang) REFERENCES NhaHang(MaNhaHang)
    );
END
GO

-- =============================================
-- 9. ChiTietDonHang
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChiTietDonHang')
BEGIN
    CREATE TABLE ChiTietDonHang (
        MaChiTiet INT IDENTITY(1,1) PRIMARY KEY,
        MaDonHang INT,
        MaMonAn INT,
        SoLuong INT,
        DonGia DECIMAL(10,2),
        FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
        FOREIGN KEY (MaMonAn) REFERENCES MonAn(MaMonAn)
    );
END
GO

PRINT 'Database schema created successfully!';
GO
