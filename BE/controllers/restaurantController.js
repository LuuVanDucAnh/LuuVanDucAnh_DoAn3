const { query } = require('../config/db');

async function getRestaurantOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 50, maNhaHang } = req.query;
    const { vaiTro, maNhanVien } = req.user;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filterNhaHang = '';
    if (vaiTro === 'NhanVien' && maNhanVien) {
      const nv = await query(
        `SELECT MaNhaHang FROM NhanVien WHERE MaNhanVien = @maNhanVien`,
        [{ name: 'maNhanVien', type: 'Int', value: parseInt(maNhanVien) }]
      );
      if (nv.recordset.length > 0) {
        filterNhaHang = ` AND dh.MaNhaHang = ${nv.recordset[0].MaNhaHang}`;
      }
    } else if (maNhaHang) {
      filterNhaHang = ` AND dh.MaNhaHang = @nhParam`;
    }

    let countSql = `SELECT COUNT(*) as total FROM DonHang dh
                     JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
                     WHERE dh.TrangThai IN ('ChoXacNhan', 'DaXacNhan', 'DangChuanBi', 'SanSangGiao')${filterNhaHang}`;
    let sql = `SELECT dh.MaDonHang, dh.MaKhachHang, dh.NgayDat, dh.DiaChiGiao, dh.GhiChu,
                      dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan, dh.TrangThaiThanhToan, dh.TrangThai,
                      kh.HoTen as TenKhachHang, kh.SoDienThoai, nh.TenNhaHang
               FROM DonHang dh
               JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
               LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
               WHERE dh.TrangThai IN ('ChoXacNhan', 'DaXacNhan', 'DangChuanBi', 'SanSangGiao')${filterNhaHang}`;

    const params = [];
    const countParams = [];

    if (status) {
      sql += ` AND dh.TrangThai = @status`;
      countSql += ` AND dh.TrangThai = @status`;
      params.push({ name: 'status', type: 'NVarChar', value: status });
      countParams.push({ name: 'status', type: 'NVarChar', value: status });
    }

    if (maNhaHang && vaiTro === 'Admin') {
      params.push({ name: 'nhParam', type: 'Int', value: parseInt(maNhaHang) });
      countParams.push({ name: 'nhParam', type: 'Int', value: parseInt(maNhaHang) });
    }

    sql += ` ORDER BY dh.NgayDat ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
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

async function confirmOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await query(
      `SELECT MaDonHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].TrangThai !== 'ChoXacNhan') {
      return res.status(400).json({ message: `Đơn không ở trạng thái "Chờ xác nhận" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'DangChuanBi' WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({ message: 'Xác nhận đơn hàng thành công. Đơn đang được chuẩn bị.' });
  } catch (error) {
    next(error);
  }
}

async function readyOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await query(
      `SELECT MaDonHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].TrangThai !== 'DangChuanBi') {
      return res.status(400).json({ message: `Đơn không ở trạng thái "Đang chuẩn bị" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'SanSangGiao' WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({ message: 'Đơn hàng đã sẵn sàng giao. Chờ shipper nhận đơn.' });
  } catch (error) {
    next(error);
  }
}

async function rejectOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { lyDo } = req.body;

    const order = await query(
      `SELECT MaDonHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    const allowedStatuses = ['ChoXacNhan'];
    if (!allowedStatuses.includes(order.recordset[0].TrangThai)) {
      return res.status(400).json({ message: `Chỉ từ chối đơn ở trạng thái "Chờ xác nhận" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'Huy' WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({ message: 'Từ chối đơn hàng thành công.', lyDo: lyDo || '' });
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
  getRestaurantOrders, confirmOrder, readyOrder, rejectOrder,
};
