const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function getDashboardStats(req, res, next) {
  try {
    const totalUsers = await query(`SELECT COUNT(*) as count FROM TaiKhoan`);
    const totalOrders = await query(`SELECT COUNT(*) as count FROM DonHang`);
    const totalRevenue = await query(`SELECT ISNULL(SUM(TongTien), 0) as total FROM DonHang WHERE TrangThai = 'DaGiao'`);
    const pendingOrders = await query(`SELECT COUNT(*) as count FROM DonHang WHERE TrangThai IN ('ChoXacNhan', 'DaXacNhan', 'DangChuanBi', 'SanSangGiao', 'DangGiao')`);
    const completedOrders = await query(`SELECT COUNT(*) as count FROM DonHang WHERE TrangThai = 'DaGiao'`);
    const cancelledOrders = await query(`SELECT COUNT(*) as count FROM DonHang WHERE TrangThai = 'Huy'`);

    const customers = await query(`SELECT COUNT(*) as count FROM TaiKhoan WHERE VaiTro = 'KhachHang'`);
    const shippers = await query(`SELECT COUNT(*) as count FROM TaiKhoan WHERE VaiTro = 'Shipper'`);
    const staff = await query(`SELECT COUNT(*) as count FROM TaiKhoan WHERE VaiTro = 'NhanVien'`);

    const monthlyStats = await query(`
      SELECT MONTH(NgayDat) as Thang, YEAR(NgayDat) as Nam,
             COUNT(*) as SoDon, ISNULL(SUM(TongTien), 0) as DoanhThu
      FROM DonHang
      WHERE TrangThai = 'DaGiao' AND YEAR(NgayDat) = YEAR(GETDATE())
      GROUP BY MONTH(NgayDat), YEAR(NgayDat)
      ORDER BY Thang
    `);

    const todayOrders = await query(`
      SELECT COUNT(*) as count, ISNULL(SUM(TongTien), 0) as revenue
      FROM DonHang
      WHERE CAST(NgayDat AS DATE) = CAST(GETDATE() AS DATE)
    `);

    res.json({
      stats: {
        totalUsers: totalUsers.recordset[0].count,
        totalOrders: totalOrders.recordset[0].count,
        totalRevenue: parseFloat(totalRevenue.recordset[0].total),
        pendingOrders: pendingOrders.recordset[0].count,
        completedOrders: completedOrders.recordset[0].count,
        cancelledOrders: cancelledOrders.recordset[0].count,
        customers: customers.recordset[0].count,
        shippers: shippers.recordset[0].count,
        staff: staff.recordset[0].count,
      },
      todayOrders: todayOrders.recordset[0].count,
      todayRevenue: parseFloat(todayOrders.recordset[0].revenue),
      monthlyStats: monthlyStats.recordset,
    });
  } catch (error) {
    next(error);
  }
}

async function getTopFoods(req, res, next) {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let sql = `
      SELECT TOP ${parseInt(limit)} m.MaMonAn, m.TenMon, m.Gia, m.HinhAnh, d.TenDanhMuc,
             COUNT(ct.MaChiTiet) as SoLanDat,
             SUM(ct.SoLuong) as TongSoLuong,
             SUM(ct.SoLuong * ct.DonGia) as TongDoanhThu
      FROM ChiTietDonHang ct
      JOIN MonAn m ON ct.MaMonAn = m.MaMonAn
      JOIN DanhMuc d ON m.MaDanhMuc = d.MaDanhMuc
      JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
      WHERE dh.TrangThai != 'Huy'`;

    const params = [];

    if (startDate) {
      sql += ` AND dh.NgayDat >= @startDate`;
      params.push({ name: 'startDate', type: 'DateTime', value: startDate });
    }
    if (endDate) {
      sql += ` AND dh.NgayDat <= @endDate`;
      params.push({ name: 'endDate', type: 'DateTime', value: endDate });
    }

    sql += ` GROUP BY m.MaMonAn, m.TenMon, m.Gia, m.HinhAnh, d.TenDanhMuc
             ORDER BY TongSoLuong DESC`;

    const result = await query(sql, params);
    res.json({ topFoods: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function getTopShippers(req, res, next) {
  try {
    const { limit = 10 } = req.query;

    const result = await query(`
      SELECT TOP ${parseInt(limit)} s.MaShipper, s.HoTen, s.BienSoXe, s.SoDienThoai,
             COUNT(dh.MaDonHang) as TongDon,
             SUM(CASE WHEN dh.TrangThai = 'DaGiao' THEN 1 ELSE 0 END) as DonDaGiao,
             SUM(CASE WHEN dh.TrangThai = 'DangGiao' THEN 1 ELSE 0 END) as DonDangGiao,
             ISNULL(SUM(dh.PhiShip), 0) as TongPhiShip
      FROM Shipper s
      LEFT JOIN DonHang dh ON s.MaShipper = dh.MaShipper
      GROUP BY s.MaShipper, s.HoTen, s.BienSoXe, s.SoDienThoai
      ORDER BY DonDaGiao DESC
    `);

    res.json({ topShippers: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function getRevenueStats(req, res, next) {
  try {
    const { period = 'month', year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let sql = '';
    let groupBy = '';

    if (period === 'day') {
      sql = `SELECT CAST(NgayDat AS DATE) as Label, COUNT(*) as SoDon, ISNULL(SUM(TongTien), 0) as DoanhThu
             FROM DonHang WHERE TrangThai = 'DaGiao' AND YEAR(NgayDat) = @year
             GROUP BY CAST(NgayDat AS DATE) ORDER BY Label`;
    } else if (period === 'week') {
      sql = `SELECT DATEPART(WEEK, NgayDat) as Label, COUNT(*) as SoDon, ISNULL(SUM(TongTien), 0) as DoanhThu
             FROM DonHang WHERE TrangThai = 'DaGiao' AND YEAR(NgayDat) = @year
             GROUP BY DATEPART(WEEK, NgayDat) ORDER BY Label`;
    } else {
      sql = `SELECT MONTH(NgayDat) as Label, COUNT(*) as SoDon, ISNULL(SUM(TongTien), 0) as DoanhThu
             FROM DonHang WHERE TrangThai = 'DaGiao' AND YEAR(NgayDat) = @year
             GROUP BY MONTH(NgayDat) ORDER BY Label`;
    }

    const result = await query(sql, [{ name: 'year', type: 'Int', value: parseInt(targetYear) }]);
    res.json({ revenueStats: result.recordset, period, year: parseInt(targetYear) });
  } catch (error) {
    next(error);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countSql = `SELECT COUNT(*) as total FROM DonHang dh
                     JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang`;
    let sql = `SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaShipper, dh.NgayDat, dh.NgayGiao,
                      dh.DiaChiGiao, dh.GhiChu, dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan,
                      dh.TrangThaiThanhToan, dh.TrangThai,
                      kh.HoTen as TenKhachHang, kh.SoDienThoai as KhachHangSDT,
                      sh.HoTen as TenShipper,
                      nh.TenNhaHang
               FROM DonHang dh
               JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
               LEFT JOIN Shipper sh ON dh.MaShipper = sh.MaShipper
               LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang`;

    const params = [];
    const countParams = [];

    if (status) {
      sql += ` WHERE dh.TrangThai = @status`;
      countSql += ` WHERE dh.TrangThai = @status`;
      params.push({ name: 'status', type: 'NVarChar', value: status });
      countParams.push({ name: 'status', type: 'NVarChar', value: status });
    }

    sql += ` ORDER BY dh.NgayDat DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.push({ name: 'offset', type: 'Int', value: offset });
    params.push({ name: 'limit', type: 'Int', value: parseInt(limit) });

    const [countResult, ordersResult] = await Promise.all([
      query(countSql, countParams),
      query(sql, params),
    ]);

    const ordersWithItems = [];
    for (const order of ordersResult.recordset) {
      const items = await getOrderItems(order.MaDonHang);
      ordersWithItems.push({ ...order, items });
    }

    res.json({
      orders: ordersWithItems,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
}

async function assignShipper(req, res, next) {
  try {
    const { id } = req.params;
    const { maShipper } = req.body;

    if (!maShipper) {
      return res.status(400).json({ message: 'Mã shipper là bắt buộc.' });
    }

    const order = await query(
      `SELECT MaDonHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );
    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (!['SanSangGiao'].includes(order.recordset[0].TrangThai)) {
      return res.status(400).json({ message: `Chỉ giao đơn ở trạng thái "Sẵn sàng giao" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    const shipper = await query(
      `SELECT MaShipper FROM Shipper WHERE MaShipper = @maShipper`,
      [{ name: 'maShipper', type: 'Int', value: parseInt(maShipper) }]
    );
    if (shipper.recordset.length === 0) {
      return res.status(404).json({ message: 'Shipper không tồn tại.' });
    }

    await query(
      `UPDATE DonHang SET MaShipper = @maShipper, TrangThai = 'DangGiao' WHERE MaDonHang = @id`,
      [
        { name: 'id', type: 'Int', value: parseInt(id) },
        { name: 'maShipper', type: 'Int', value: parseInt(maShipper) },
      ]
    );

    res.json({ message: 'Giao đơn cho shipper thành công.' });
  } catch (error) {
    next(error);
  }
}

async function cancelOrderByAdmin(req, res, next) {
  try {
    const { id } = req.params;

    const order = await query(
      `SELECT MaDonHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].TrangThai === 'DaGiao') {
      return res.status(400).json({ message: 'Không thể hủy đơn đã giao.' });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'Huy' WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({ message: 'Hủy đơn hàng thành công.' });
  } catch (error) {
    next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const { vaiTro, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countSql = `SELECT COUNT(*) as total FROM TaiKhoan tk`;
    let sql = `SELECT tk.MaTK, tk.Username, tk.VaiTro, tk.NgayTao,
                      kh.MaKhachHang, kh.HoTen, kh.SoDienThoai, kh.DiaChi,
                      nv.MaNhanVien,
                      sh.MaShipper, sh.BienSoXe, sh.SoDienThoai as ShipperSDT
               FROM TaiKhoan tk
               LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
               LEFT JOIN NhanVien nv ON tk.MaTK = nv.MaTK
               LEFT JOIN Shipper sh ON tk.MaTK = sh.MaTK`;

    const params = [];
    const countParams = [];

    if (vaiTro) {
      sql += ` WHERE tk.VaiTro = @vaiTro`;
      countSql += ` WHERE tk.VaiTro = @vaiTro`;
      params.push({ name: 'vaiTro', type: 'NVarChar', value: vaiTro });
      countParams.push({ name: 'vaiTro', type: 'NVarChar', value: vaiTro });
    }

    sql += ` ORDER BY tk.NgayTao DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.push({ name: 'offset', type: 'Int', value: offset });
    params.push({ name: 'limit', type: 'Int', value: parseInt(limit) });

    const [countResult, result] = await Promise.all([
      query(countSql, countParams),
      query(sql, params),
    ]);

    res.json({
      users: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, password, vaiTro, hoTen, soDienThoai, diaChi, bienSoXe } = req.body;

    if (!username || !password || !vaiTro || !hoTen) {
      return res.status(400).json({ message: 'Username, password, vaiTro, hoTen là bắt buộc.' });
    }
    if (!['NhanVien', 'Shipper'].includes(vaiTro)) {
      return res.status(400).json({ message: 'Chỉ được tạo tài khoản NhanVien hoặc Shipper.' });
    }
    if (password.length < 5) {
      return res.status(400).json({ message: 'Password phải có ít nhất 5 ký tự.' });
    }

    const existing = await query('SELECT MaTK FROM TaiKhoan WHERE Username = @username', [
      { name: 'username', type: 'VarChar', value: username },
    ]);
    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Username đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertAccount = await query(
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@username, @matKhau, @vaiTro)`,
      [
        { name: 'username', type: 'VarChar', value: username },
        { name: 'matKhau', type: 'VarChar', value: hashedPassword },
        { name: 'vaiTro', type: 'NVarChar', value: vaiTro },
      ]
    );
    const maTK = insertAccount.recordset[0].MaTK;

    if (vaiTro === 'NhanVien') {
      await query(
        `INSERT INTO NhanVien (MaTK, HoTen) VALUES (@maTK, @hoTen)`,
        [
          { name: 'maTK', type: 'Int', value: maTK },
          { name: 'hoTen', type: 'NVarChar', value: hoTen },
        ]
      );
    } else if (vaiTro === 'Shipper') {
      await query(
        `INSERT INTO Shipper (MaTK, HoTen, SoDienThoai, BienSoXe) VALUES (@maTK, @hoTen, @soDienThoai, @bienSoXe)`,
        [
          { name: 'maTK', type: 'Int', value: maTK },
          { name: 'hoTen', type: 'NVarChar', value: hoTen },
          { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
          { name: 'bienSoXe', type: 'VarChar', value: bienSoXe || '' },
        ]
      );
    }

    res.status(201).json({ message: 'Tạo tài khoản thành công.', maTK });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { hoTen, soDienThoai, diaChi, bienSoXe } = req.body;

    const account = await query('SELECT MaTK, VaiTro FROM TaiKhoan WHERE MaTK = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (account.recordset.length === 0) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    const currentVaiTro = account.recordset[0].VaiTro;

    if (currentVaiTro === 'KhachHang') {
      await query(
        `UPDATE KhachHang SET HoTen = @hoTen, SoDienThoai = @soDienThoai, DiaChi = @diaChi WHERE MaTK = @id`,
        [
          { name: 'id', type: 'Int', value: parseInt(id) },
          { name: 'hoTen', type: 'NVarChar', value: hoTen || '' },
          { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
          { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
        ]
      );
    } else if (currentVaiTro === 'NhanVien') {
      await query(
        `UPDATE NhanVien SET HoTen = @hoTen WHERE MaTK = @id`,
        [
          { name: 'id', type: 'Int', value: parseInt(id) },
          { name: 'hoTen', type: 'NVarChar', value: hoTen || '' },
        ]
      );
    } else if (currentVaiTro === 'Shipper') {
      await query(
        `UPDATE Shipper SET HoTen = @hoTen, SoDienThoai = @soDienThoai, BienSoXe = @bienSoXe WHERE MaTK = @id`,
        [
          { name: 'id', type: 'Int', value: parseInt(id) },
          { name: 'hoTen', type: 'NVarChar', value: hoTen || '' },
          { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
          { name: 'bienSoXe', type: 'VarChar', value: bienSoXe || '' },
        ]
      );
    }

    res.json({ message: 'Cập nhật tài khoản thành công.' });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 5 ký tự.' });
    }

    const account = await query('SELECT MaTK, VaiTro FROM TaiKhoan WHERE MaTK = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (account.recordset.length === 0) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE TaiKhoan SET MatKhau = @matKhau WHERE MaTK = @id', [
      { name: 'matKhau', type: 'VarChar', value: hashedPassword },
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);

    res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const account = await query('SELECT MaTK, VaiTro FROM TaiKhoan WHERE MaTK = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (account.recordset.length === 0) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    if (account.recordset[0].VaiTro === 'Admin') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản Admin.' });
    }

    const vaiTro = account.recordset[0].VaiTro;

    if (vaiTro === 'KhachHang') {
      await query('DELETE FROM KhachHang WHERE MaTK = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);
    } else if (vaiTro === 'NhanVien') {
      await query('DELETE FROM NhanVien WHERE MaTK = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);
    } else if (vaiTro === 'Shipper') {
      await query('DELETE FROM Shipper WHERE MaTK = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);
    }

    await query('DELETE FROM TaiKhoan WHERE MaTK = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);

    res.json({ message: 'Xóa tài khoản thành công.' });
  } catch (error) {
    next(error);
  }
}

async function getRestaurant(req, res, next) {
  try {
    const result = await query('SELECT MaNhaHang, TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode FROM NhaHang ORDER BY MaNhaHang');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Chưa có thông tin nhà hàng.' });
    }
    res.json({ restaurants: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    const { maNhaHang, tenNhaHang, diaChi, soDienThoai, hinhAnh, minOrder, maCode } = req.body;

    if (maNhaHang) {
      const existing = await query('SELECT MaNhaHang FROM NhaHang WHERE MaNhaHang = @id', [
        { name: 'id', type: 'Int', value: parseInt(maNhaHang) },
      ]);
      if (existing.recordset.length === 0) {
        return res.status(404).json({ message: 'Nhà hàng không tồn tại.' });
      }
      await query(
        `UPDATE NhaHang SET TenNhaHang = @ten, DiaChi = @diaChi, SoDienThoai = @sdt, HinhAnh = @hinhAnh, MinOrder = @minOrder, MaCode = @maCode WHERE MaNhaHang = @id`,
        [
          { name: 'id', type: 'Int', value: parseInt(maNhaHang) },
          { name: 'ten', type: 'NVarChar', value: tenNhaHang || '' },
          { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
          { name: 'sdt', type: 'VarChar', value: soDienThoai || '' },
          { name: 'hinhAnh', type: 'NVarChar', value: hinhAnh || '' },
          { name: 'minOrder', type: 'Decimal', value: minOrder || 0 },
          { name: 'maCode', type: 'VarChar', value: maCode || '' },
        ]
      );
      return res.json({ message: 'Cập nhật nhà hàng thành công.' });
    }

    const existing = await query('SELECT MaNhaHang FROM NhaHang');
    if (existing.recordset.length === 0) {
      await query(
        `INSERT INTO NhaHang (TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode) VALUES (@ten, @diaChi, @sdt, @hinhAnh, @minOrder, @maCode)`,
        [
          { name: 'ten', type: 'NVarChar', value: tenNhaHang || '' },
          { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
          { name: 'sdt', type: 'VarChar', value: soDienThoai || '' },
          { name: 'hinhAnh', type: 'NVarChar', value: hinhAnh || '' },
          { name: 'minOrder', type: 'Decimal', value: minOrder || 0 },
          { name: 'maCode', type: 'VarChar', value: maCode || '' },
        ]
      );
      return res.json({ message: 'Tạo thông tin nhà hàng thành công.' });
    }

    await query(
      `UPDATE NhaHang SET TenNhaHang = @ten, DiaChi = @diaChi, SoDienThoai = @sdt, HinhAnh = @hinhAnh, MinOrder = @minOrder, MaCode = @maCode WHERE MaNhaHang = @id`,
      [
        { name: 'id', type: 'Int', value: existing.recordset[0].MaNhaHang },
        { name: 'ten', type: 'NVarChar', value: tenNhaHang || '' },
        { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
        { name: 'sdt', type: 'VarChar', value: soDienThoai || '' },
        { name: 'hinhAnh', type: 'NVarChar', value: hinhAnh || '' },
        { name: 'minOrder', type: 'Decimal', value: minOrder || 0 },
        { name: 'maCode', type: 'VarChar', value: maCode || '' },
      ]
    );

    res.json({ message: 'Cập nhật thông tin nhà hàng thành công.' });
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT d.MaDanhMuc, d.TenDanhMuc,
              (SELECT COUNT(*) FROM MonAn WHERE MaDanhMuc = d.MaDanhMuc) as SoMonAn
       FROM DanhMuc d ORDER BY d.MaDanhMuc`
    );
    res.json({ categories: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { tenDanhMuc } = req.body;
    if (!tenDanhMuc) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc.' });
    }

    const result = await query(
      `INSERT INTO DanhMuc (TenDanhMuc) OUTPUT INSERTED.MaDanhMuc VALUES (@ten)`,
      [{ name: 'ten', type: 'NVarChar', value: tenDanhMuc }]
    );

    res.status(201).json({ message: 'Thêm danh mục thành công.', maDanhMuc: result.recordset[0].MaDanhMuc });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { tenDanhMuc } = req.body;
    if (!tenDanhMuc) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc.' });
    }

    await query(
      `UPDATE DanhMuc SET TenDanhMuc = @ten WHERE MaDanhMuc = @id`,
      [
        { name: 'id', type: 'Int', value: parseInt(id) },
        { name: 'ten', type: 'NVarChar', value: tenDanhMuc },
      ]
    );

    res.json({ message: 'Cập nhật danh mục thành công.' });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const foods = await query('SELECT MaMonAn FROM MonAn WHERE MaDanhMuc = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (foods.recordset.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang có món ăn. Hãy xóa hoặc chuyển món trước.' });
    }

    await query('DELETE FROM DanhMuc WHERE MaDanhMuc = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);
    res.json({ message: 'Xóa danh mục thành công.' });
  } catch (error) {
    next(error);
  }
}

async function getFoodsAdmin(req, res, next) {
  try {
    const result = await query(
      `SELECT m.MaMonAn, m.TenMon, m.Gia, m.MoTa, m.HinhAnh, m.MaDanhMuc, m.MaNhaHang, m.SoLuong, d.TenDanhMuc, nh.TenNhaHang
       FROM MonAn m
       JOIN DanhMuc d ON m.MaDanhMuc = d.MaDanhMuc
       JOIN NhaHang nh ON m.MaNhaHang = nh.MaNhaHang
       ORDER BY nh.MaNhaHang, d.MaDanhMuc, m.MaMonAn`
    );
    res.json({ foods: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function createFood(req, res, next) {
  try {
    const { tenMon, gia, moTa, hinhAnh, maDanhMuc, maNhaHang, soLuong } = req.body;

    if (!tenMon || !gia || !maDanhMuc || !maNhaHang) {
      return res.status(400).json({ message: 'Tên món, giá, danh mục và nhà hàng là bắt buộc.' });
    }
    if (parseFloat(gia) <= 0) {
      return res.status(400).json({ message: 'Giá phải lớn hơn 0.' });
    }

    const nhaHang = await query('SELECT MaNhaHang FROM NhaHang WHERE MaNhaHang = @id', [
      { name: 'id', type: 'Int', value: parseInt(maNhaHang) },
    ]);
    if (nhaHang.recordset.length === 0) {
      return res.status(404).json({ message: 'Nhà hàng không tồn tại.' });
    }

    const result = await query(
      `INSERT INTO MonAn (TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, MaNhaHang, SoLuong) OUTPUT INSERTED.MaMonAn
       VALUES (@ten, @gia, @moTa, @hinhAnh, @maDanhMuc, @maNhaHang, @soLuong)`,
      [
        { name: 'ten', type: 'NVarChar', value: tenMon },
        { name: 'gia', type: 'Decimal', value: parseFloat(gia) },
        { name: 'moTa', type: 'NVarChar', value: moTa || '' },
        { name: 'hinhAnh', type: 'NVarChar', value: hinhAnh || '' },
        { name: 'maDanhMuc', type: 'Int', value: parseInt(maDanhMuc) },
        { name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) },
        { name: 'soLuong', type: 'Int', value: parseInt(soLuong) || 100 },
      ]
    );

    res.status(201).json({ message: 'Thêm món ăn thành công.', maMonAn: result.recordset[0].MaMonAn });
  } catch (error) {
    next(error);
  }
}

async function updateFood(req, res, next) {
  try {
    const { id } = req.params;
    const { tenMon, gia, moTa, hinhAnh, maDanhMuc, soLuong } = req.body;

    const food = await query('SELECT MaMonAn FROM MonAn WHERE MaMonAn = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (food.recordset.length === 0) {
      return res.status(404).json({ message: 'Món ăn không tồn tại.' });
    }

    await query(
      `UPDATE MonAn SET TenMon = @ten, Gia = @gia, MoTa = @moTa, HinhAnh = @hinhAnh, MaDanhMuc = @maDanhMuc, SoLuong = @soLuong WHERE MaMonAn = @id`,
      [
        { name: 'id', type: 'Int', value: parseInt(id) },
        { name: 'ten', type: 'NVarChar', value: tenMon || '' },
        { name: 'gia', type: 'Decimal', value: parseFloat(gia) || 0 },
        { name: 'moTa', type: 'NVarChar', value: moTa || '' },
        { name: 'hinhAnh', type: 'NVarChar', value: hinhAnh || '' },
        { name: 'maDanhMuc', type: 'Int', value: parseInt(maDanhMuc) || 1 },
        { name: 'soLuong', type: 'Int', value: parseInt(soLuong) || 0 },
      ]
    );

    res.json({ message: 'Cập nhật món ăn thành công.' });
  } catch (error) {
    next(error);
  }
}

async function deleteFood(req, res, next) {
  try {
    const { id } = req.params;

    const food = await query('SELECT MaMonAn FROM MonAn WHERE MaMonAn = @id', [
      { name: 'id', type: 'Int', value: parseInt(id) },
    ]);
    if (food.recordset.length === 0) {
      return res.status(404).json({ message: 'Món ăn không tồn tại.' });
    }

    await query('DELETE FROM ChiTietDonHang WHERE MaMonAn = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);
    await query('DELETE FROM MonAn WHERE MaMonAn = @id', [{ name: 'id', type: 'Int', value: parseInt(id) }]);

    res.json({ message: 'Xóa món ăn thành công.' });
  } catch (error) {
    next(error);
  }
}

async function getOrderItems(maDonHang) {
  const items = await query(
    `SELECT ct.MaChiTiet, ct.MaMonAn, m.TenMon, ct.SoLuong, ct.DonGia,
            (ct.SoLuong * ct.DonGia) as ThanhTien
     FROM ChiTietDonHang ct
     JOIN MonAn m ON ct.MaMonAn = m.MaMonAn
     WHERE ct.MaDonHang = @maDonHang`,
    [{ name: 'maDonHang', type: 'Int', value: maDonHang }]
  );
  return items.recordset;
}

module.exports = {
  getDashboardStats, getTopFoods, getTopShippers, getRevenueStats,
  getAllOrders, assignShipper, cancelOrderByAdmin,
  getAllUsers, createUser, updateUser, resetPassword, deleteUser,
  getRestaurant, updateRestaurant,
  getCategories, createCategory, updateCategory, deleteCategory,
  getFoodsAdmin, createFood, updateFood, deleteFood,
};
