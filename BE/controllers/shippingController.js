const { query } = require('../config/db');

async function getPendingOrders(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult, orders] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM DonHang WHERE TrangThai = 'SanSangGiao' AND MaShipper IS NULL`),
      query(
        `SELECT dh.MaDonHang, dh.MaKhachHang, dh.NgayDat, dh.DiaChiGiao, dh.GhiChu,
                dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan, dh.TrangThaiThanhToan, dh.TrangThai,
                kh.HoTen as TenKhachHang, kh.SoDienThoai
         FROM DonHang dh
         JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
         WHERE dh.TrangThai = 'SanSangGiao' AND dh.MaShipper IS NULL
         ORDER BY dh.NgayDat ASC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        [
          { name: 'offset', type: 'Int', value: offset },
          { name: 'limit', type: 'Int', value: parseInt(limit) },
        ]
      ),
    ]);

    const ordersWithItems = [];
    for (const order of orders.recordset) {
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

async function getMyTasks(req, res, next) {
  try {
    const { maShipper } = req.user;

    const orders = await query(
      `SELECT dh.MaDonHang, dh.MaKhachHang, dh.NgayDat, dh.NgayGiao, dh.DiaChiGiao, dh.GhiChu,
              dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan, dh.TrangThaiThanhToan, dh.TrangThai,
              kh.HoTen as TenKhachHang, kh.SoDienThoai as KhachHangSDT,
              nh.TenNhaHang, nh.DiaChi as DiaChiNhaHang, nh.SoDienThoai as NhaHangSDT
       FROM DonHang dh
       JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
       LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
       WHERE dh.MaShipper = @maShipper
       ORDER BY dh.NgayDat DESC`,
      [{ name: 'maShipper', type: 'Int', value: parseInt(maShipper) }]
    );

    const ordersWithItems = [];
    for (const order of orders.recordset) {
      const items = await getOrderItems(order.MaDonHang);
      ordersWithItems.push({ ...order, items });
    }

    res.json({ orders: ordersWithItems });
  } catch (error) {
    next(error);
  }
}

async function receiveOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { maShipper } = req.user;

    const order = await query(
      `SELECT MaDonHang, TrangThai, MaShipper FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].TrangThai !== 'SanSangGiao') {
      return res.status(400).json({ message: `Đơn không ở trạng thái "Sẵn sàng giao" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    if (order.recordset[0].MaShipper !== null) {
      return res.status(400).json({ message: 'Đơn đã có shipper nhận.' });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'DangGiao', MaShipper = @maShipper WHERE MaDonHang = @id`,
      [
        { name: 'id', type: 'Int', value: parseInt(id) },
        { name: 'maShipper', type: 'Int', value: parseInt(maShipper) },
      ]
    );

    res.json({ message: 'Nhận đơn thành công. Đơn đang trên đường giao.' });
  } catch (error) {
    next(error);
  }
}

async function completeOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { maShipper } = req.user;

    const order = await query(
      `SELECT MaDonHang, TrangThai, MaShipper, TongTien FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].MaShipper !== parseInt(maShipper)) {
      return res.status(403).json({ message: 'Bạn không phải shipper của đơn này.' });
    }

    if (order.recordset[0].TrangThai !== 'DangGiao') {
      return res.status(400).json({ message: `Đơn không ở trạng thái "Đang giao" (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'DaGiao', NgayGiao = GETDATE() WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({
      message: 'Giao hàng thành công! Cảm ơn bạn đã hoàn thành đơn.',
      ngayGiao: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function cancelDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { maShipper } = req.user;
    const { lyDo } = req.body;

    const order = await query(
      `SELECT MaDonHang, TrangThai, MaShipper FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].MaShipper !== parseInt(maShipper)) {
      return res.status(403).json({ message: 'Bạn không phải shipper của đơn này.' });
    }

    if (order.recordset[0].TrangThai !== 'DangGiao') {
      return res.status(400).json({ message: `Chỉ hủy được đơn đang giao (hiện tại: "${order.recordset[0].TrangThai}").` });
    }

    await query(
      `UPDATE DonHang SET TrangThai = 'SanSangGiao', MaShipper = NULL WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({
      message: 'Đã hủy nhận đơn. Đơn sẽ được giao cho shipper khác.',
      lyDo: lyDo || '',
    });
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const { maShipper } = req.user;

    const result = await query(
      `SELECT s.MaShipper, s.HoTen, s.BienSoXe, s.SoDienThoai,
              tk.Username, tk.NgayTao,
              (SELECT COUNT(*) FROM DonHang WHERE MaShipper = s.MaShipper AND TrangThai = 'DaGiao') as SoDonDaGiao
       FROM Shipper s
       JOIN TaiKhoan tk ON s.MaTK = tk.MaTK
       WHERE s.MaShipper = @maShipper`,
      [{ name: 'maShipper', type: 'Int', value: parseInt(maShipper) }]
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin shipper.' });
    }

    res.json({ shipper: result.recordset[0] });
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
  getPendingOrders, getMyTasks, receiveOrder, completeOrder, cancelDelivery, getMyProfile,
};
