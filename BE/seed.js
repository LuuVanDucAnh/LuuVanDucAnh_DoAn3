require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, closePool } = require('./config/db');

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

async function seed() {
  try {
    console.log('Bat dau seed data...\n');

    console.log('Dang xoa du lieu cu...');
    await query('DELETE FROM ChiTietDonHang');
    await query('DELETE FROM DonHang');
    await query('DELETE FROM MonAn');
    await query('DELETE FROM DanhMuc');
    await query('DELETE FROM NhanVien');
    await query('DELETE FROM Shipper');
    await query('DELETE FROM KhachHang');
    await query('DELETE FROM TaiKhoan');
    await query('DELETE FROM NhaHang');
    console.log('Da xoa du lieu cu.\n');

    console.log('Dang tao NhaHang (1 quán duy nhất)...');
    await query(
      `INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder)
       VALUES (N'Quán Ăn Gia Đình', N'123 Đường Nguyễn Trãi, Quận 1, TP.HCM', '0901234567',
               'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 20000)`
    );
    console.log('NhaHang: OK\n');

    console.log('Dang tao TaiKhoan...');
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const admin = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'admin' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'Admin' },
      ]
    );
    console.log(`  admin (Admin) - password: ${DEFAULT_PASSWORD}`);

    const staff = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'nhanvien1' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'NhanVien' },
      ]
    );
    console.log(`  nhanvien1 (NhanVien) - password: ${DEFAULT_PASSWORD}`);

    const sp1 = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'shipper1' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'Shipper' },
      ]
    );
    console.log(`  shipper1 (Shipper) - password: ${DEFAULT_PASSWORD}`);

    const sp2 = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'shipper2' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'Shipper' },
      ]
    );
    console.log(`  shipper2 (Shipper) - password: ${DEFAULT_PASSWORD}`);

    const kh1 = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'khachhang1' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'KhachHang' },
      ]
    );
    console.log(`  khachhang1 (KhachHang) - password: ${DEFAULT_PASSWORD}`);

    const kh2 = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@u, @p, @v)`,
      [
        { name: 'u', type: 'VarChar', value: 'khachhang2' },
        { name: 'p', type: 'VarChar', value: hash },
        { name: 'v', type: 'VarChar', value: 'KhachHang' },
      ]
    );
    console.log(`  khachhang2 (KhachHang) - password: ${DEFAULT_PASSWORD}\n`);

    console.log('Dang tao NhanVien...');
    await query(
      `INSERT INTO NhanVien (MaTK, MaNhaHang, HoTen) VALUES (@maTK, 1, N'Nguyễn Văn Nhân')`,
      [{ name: 'maTK', type: 'Int', value: admin.recordset[0].MaTK }]
    );
    console.log('NhanVien: OK\n');

    console.log('Dang tao Shipper...');
    await query(
      `INSERT INTO Shipper (MaTK, HoTen, BienSoXe, SoDienThoai) VALUES (@maTK, N'Trần Văn Shipper 1', '59A-123.45', '0901111111')`,
      [{ name: 'maTK', type: 'Int', value: sp1.recordset[0].MaTK }]
    );
    await query(
      `INSERT INTO Shipper (MaTK, HoTen, BienSoXe, SoDienThoai) VALUES (@maTK, N'Lê Văn Shipper 2', '60B-678.90', '0902222222')`,
      [{ name: 'maTK', type: 'Int', value: sp2.recordset[0].MaTK }]
    );
    console.log('Shipper: OK (2 shipper)\n');

    console.log('Dang tao KhachHang...');
    await query(
      `INSERT INTO KhachHang (MaTK, HoTen, SoDienThoai, DiaChi) VALUES (@maTK, N'Phạm Thị Khách', '0903333333', N'456 Đường Lê Lợi, Quận 1, TP.HCM')`,
      [{ name: 'maTK', type: 'Int', value: kh1.recordset[0].MaTK }]
    );
    await query(
      `INSERT INTO KhachHang (MaTK, HoTen, SoDienThoai, DiaChi) VALUES (@maTK, N'Hoàng Văn Hùng', '0904444444', N'789 Đường Cái Khế, Quận Ninh Kiều, Cần Thơ')`,
      [{ name: 'maTK', type: 'Int', value: kh2.recordset[0].MaTK }]
    );
    console.log('KhachHang: OK (2 khach hang)\n');

    console.log('Dang tao DanhMuc...');
    await query(`INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Món Mặn')`);
    await query(`INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Món Nước')`);
    await query(`INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Đồ Uống')`);
    await query(`INSERT INTO DanhMuc (TenDanhMuc) VALUES (N'Ăn Vặt')`);
    console.log('DanhMuc: OK (4 danh muc)\n');

    console.log('Dang tao MonAn...');
    const monAnData = [
      [N'Cơm Gà Chiên Giòn', 45000, N'Cơm với gà chiên giòn rưới nước mắm chua ngọt', '/images/Ga-chien-mam.jpg', 1],
      [N'Cơm Sườn Bì Chả', 50000, N'Cơm với sườn, bì, chả trứng', '/images/Suon-ram-man.jpg', 1],
      [N'Bún Thịt Nướng', 40000, N'Bún giò, thịt nướng, đậu phộng, rau', '/images/Bun-gao-xao.jpg', 1],
      [N'Thịt Kho Tàu', 55000, N'Thịt ba chỉ kho trứng, dùng với cơm nóng', '/images/Thit-kho-trung.jpg', 1],
      [N'Gà Ta Hấp Mã Tiều', 120000, N'Gà ta hấp gừng, hành thơm lừng', '/images/Ga-chien-mam.jpg', 1],
      [N'Súp Cua', 35000, N'Súp cua với trứng, nấm, rau', '/images/Bun-gao-xao.jpg', 2],
      [N'Canh Chua Cá Lóc', 45000, N'Canh chua me với cá lóc, dứa, đậu bắp', '/images/Lau-ca-chua-cay.jpg', 2],
      [N'Lẩu Cá Kèo', 180000, N'Lẩu cá kèo 2 người, nước lèo chua cay', '/images/Lau-bo-nam.jpg', 2],
      [N'Miến Gà', 40000, N'Miến nấu với gà xé, nấm, hành', '/images/Bun-gao-xao.jpg', 2],
      [N'Trà Đá', 5000, N'Trà đá lạnh giải khát', '/images/Tra-tac.jpg', 3],
      [N'Nước Cam Ép', 20000, N'Nước cam ép tươi, không đường', '/images/Tra-dao-cam-xa.jpg', 3],
      [N'Sữa Đậu Nành', 15000, N'Sữa đậu nành nóng, thơm ngon', '/images/Sinh-to-bo.jpg', 3],
      [N'Sinh Tố Bơ', 25000, N'Sinh tố bơ sữa đặc', '/images/Sinh-to-bo.jpg', 3],
      [N'Bánh Tráng Nướng', 20000, N'Bánh tráng nướng phô mai, trứng, hành', '/images/Banh-trang-tron.jpg', 4],
      [N'Bánh Mì Thịt', 15000, N'Bánh mì với pate, thịt, rau', '/images/Tau-hu-chien.png', 4],
      [N'Chả Giò', 25000, N'Chả giò giòn rụm, dùng với nước mắm chua', '/images/Cha-gio-chay.png', 4],
      [N'Khoai Tây Chiên', 20000, N'Khoai tây chiên vàng giòn', '/images/Khoai-tay-chien.jpg', 4],
    ];

    for (const [ten, gia, moTa, hinh, dm] of monAnData) {
      await query(
        `INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang) VALUES (@ten, @gia, @moTa, @hinh, @dm, 1)`,
        [
          { name: 'ten', type: 'NVarChar', value: ten },
          { name: 'gia', type: 'Decimal', value: gia },
          { name: 'moTa', type: 'NVarChar', value: moTa },
          { name: 'hinh', type: 'NVarChar', value: hinh },
          { name: 'dm', type: 'Int', value: dm },
        ]
      );
    }
    console.log(`MonAn: OK (${monAnData.length} mon an)\n`);

    console.log('========================================');
    console.log('Seed data hoan tat!');
    console.log(`Default password cho moi tai khoan: ${DEFAULT_PASSWORD}`);
    console.log('========================================');
    console.log('Tai khoan:');
    console.log('  admin / admin123 (Admin)');
    console.log('  nhanvien1 / admin123 (NhanVien)');
    console.log('  shipper1 / admin123 (Shipper)');
    console.log('  shipper2 / admin123 (Shipper)');
    console.log('  khachhang1 / admin123 (KhachHang)');
    console.log('  khachhang2 / admin123 (KhachHang)');
    console.log('========================================\n');

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Loi khi seed data:', error.message);
    await closePool();
    process.exit(1);
  }
}

seed();
