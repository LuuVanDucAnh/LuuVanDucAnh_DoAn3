const { query, getPool, sql } = require('../config/db');

async function createOrder(req, res, next) {
  let poolConnection;
  try {
    const { maKhachHang, maNhaHang, diaChiGiao, ghiChu, phuongThucThanhToan, items } = req.body;

    if (!diaChiGiao) {
      return res.status(400).json({ message: 'Địa chỉ giao hàng là bắt buộc.' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống.' });
    }
    if (!maNhaHang) {
      return res.status(400).json({ message: 'Vui lòng chọn nhà hàng.' });
    }

    poolConnection = await getPool();
    const transaction = poolConnection.transaction();
    await transaction.begin();

    try {
      const khachHang = await transaction.request().query(
        `SELECT MaKhachHang FROM KhachHang WHERE MaKhachHang = ${parseInt(maKhachHang)}`
      );
      if (khachHang.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Khách hàng không tồn tại.' });
      }

      const restaurant = await transaction.request().query(
        `SELECT MaNhaHang, MinOrder, TenNhaHang FROM NhaHang WHERE MaNhaHang = ${parseInt(maNhaHang)}`
      );
      if (restaurant.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Nhà hàng không tồn tại.' });
      }
      const nh = restaurant.recordset[0];
      const minOrder = parseFloat(nh.MinOrder) || 0;

      let subtotal = 0;
      for (const item of items) {
        const monAn = await transaction.request().query(
          `SELECT Gia, SoLuong FROM MonAn WHERE MaMonAn = ${parseInt(item.maMonAn)} AND MaNhaHang = ${parseInt(maNhaHang)}`
        );
        if (monAn.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ message: `Món ăn ID ${item.maMonAn} không tồn tại hoặc không thuộc nhà hàng này.` });
        }
        const foodData = monAn.recordset[0];
        if (foodData.SoLuong !== null && foodData.SoLuong < parseInt(item.soLuong)) {
          await transaction.rollback();
          return res.status(400).json({ message: `Món ăn ID ${item.maMonAn} chỉ còn ${foodData.SoLuong} phần, không đủ số lượng bạn đặt.` });
        }
        subtotal += parseFloat(foodData.Gia) * parseInt(item.soLuong);
      }

      if (subtotal < minOrder) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Giá trị đơn hàng tối thiểu là ${minOrder.toLocaleString('vi-VN')} VNĐ.`,
          minOrder,
          currentSubtotal: subtotal,
        });
      }

      const phiShip = 15000;
      const tongTien = subtotal + phiShip;

      const insertOrder = await transaction.request().query(
        `INSERT INTO DonHang (MaKhachHang, MaNhaHang, DiaChiGiao, GhiChu, TongTien, PhiShip, PhuongThucThanhToan, TrangThai)
         OUTPUT INSERTED.MaDonHang
         VALUES (${parseInt(maKhachHang)}, ${parseInt(maNhaHang)}, N'${diaChiGiao.replace(/'/g, "''")}', N'${(ghiChu || '').replace(/'/g, "''")}', ${tongTien}, ${phiShip}, N'${phuongThucThanhToan || 'TienMat'}', 'ChoXacNhan')`
      );
      const maDonHang = insertOrder.recordset[0].MaDonHang;

      for (const item of items) {
        const monAn = await transaction.request().query(
          `SELECT Gia FROM MonAn WHERE MaMonAn = ${parseInt(item.maMonAn)}`
        );
        const donGia = parseFloat(monAn.recordset[0].Gia);

        await transaction.request().query(
          `INSERT INTO ChiTietDonHang (MaDonHang, MaMonAn, SoLuong, DonGia)
           VALUES (${maDonHang}, ${parseInt(item.maMonAn)}, ${parseInt(item.soLuong)}, ${donGia})`
        );

        // Giảm số lượng trong SQL
        await transaction.request().query(
          `UPDATE MonAn 
           SET SoLuong = SoLuong - ${parseInt(item.soLuong)} 
           WHERE MaMonAn = ${parseInt(item.maMonAn)} AND SoLuong IS NOT NULL`
        );
      }

      await transaction.commit();

      const donHang = await getOrderDetails(maDonHang);

      return res.status(201).json({
        message: 'Đặt hàng thành công.',
        order: donHang,
      });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    if (poolConnection) {
      try { await poolConnection.close(); } catch (_) {}
    }
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const { maKhachHang } = req.user;

    if (!maKhachHang) {
      return res.status(403).json({ message: 'Chỉ khách hàng mới xem được đơn hàng.' });
    }

    const orders = await query(
      `SELECT dh.MaDonHang, dh.NgayDat, dh.NgayGiao, dh.DiaChiGiao, dh.GhiChu,
              dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan, dh.TrangThaiThanhToan, dh.TrangThai,
              sh.HoTen as TenShipper, sh.SoDienThoai as ShipperSDT,
              nh.TenNhaHang
       FROM DonHang dh
       LEFT JOIN Shipper sh ON dh.MaShipper = sh.MaShipper
       LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
       WHERE dh.MaKhachHang = @maKhachHang
       ORDER BY dh.NgayDat DESC`,
      [{ name: 'maKhachHang', type: 'Int', value: maKhachHang }]
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

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { maKhachHang } = req.user;

    const order = await query(
      `SELECT MaDonHang, MaKhachHang, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].MaKhachHang !== parseInt(maKhachHang)) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    const allowedStatuses = ['ChoXacNhan'];
    if (!allowedStatuses.includes(order.recordset[0].TrangThai)) {
      return res.status(400).json({ message: `Không thể hủy đơn ở trạng thái "${order.recordset[0].TrangThai}". Chỉ hủy được khi đơn đang ở "Chờ xác nhận".` });
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

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const { vaiTro, maKhachHang, maShipper } = req.user;

    const order = await query(
      `SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaShipper, dh.MaNhaHang, dh.NgayDat, dh.NgayGiao,
              dh.DiaChiGiao, dh.GhiChu, dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan,
              dh.TrangThaiThanhToan, dh.TrangThai,
              kh.HoTen as TenKhachHang, kh.SoDienThoai as KhachHangSDT,
              sh.HoTen as TenShipper, sh.SoDienThoai as ShipperSDT,
              nh.TenNhaHang
       FROM DonHang dh
       JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
       LEFT JOIN Shipper sh ON dh.MaShipper = sh.MaShipper
       LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
       WHERE dh.MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    const o = order.recordset[0];

    if (vaiTro === 'KhachHang' && o.MaKhachHang !== parseInt(maKhachHang)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
    }
    if (vaiTro === 'Shipper' && o.MaShipper !== parseInt(maShipper)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
    }

    const items = await getOrderItems(parseInt(id));

    res.json({ order: { ...o, items } });
  } catch (error) {
    next(error);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { vaiTro } = req.user;

    if (!['Admin', 'NhanVien'].includes(vaiTro)) {
      return res.status(403).json({ message: 'Chỉ Admin hoặc Nhân viên mới xác nhận thanh toán.' });
    }

    const order = await query(
      `SELECT MaDonHang, TrangThaiThanhToan, TrangThai FROM DonHang WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
    }

    if (order.recordset[0].TrangThaiThanhToan === 'DaThanhToan') {
      return res.status(400).json({ message: 'Đơn đã được thanh toán trước đó.' });
    }

    if (!['DaGiao', 'SanSangGiao', 'DangGiao'].includes(order.recordset[0].TrangThai)) {
      return res.status(400).json({ message: 'Chỉ thanh toán khi đơn đã giao hoặc sẵn sàng giao.' });
    }

    await query(
      `UPDATE DonHang SET TrangThaiThanhToan = 'DaThanhToan' WHERE MaDonHang = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    res.json({ message: 'Xác nhận thanh toán thành công.' });
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

async function getOrderDetails(maDonHang) {
  const order = await query(
    `SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaShipper, dh.MaNhaHang, dh.NgayDat, dh.NgayGiao,
            dh.DiaChiGiao, dh.GhiChu, dh.TongTien, dh.PhiShip, dh.PhuongThucThanhToan,
            dh.TrangThaiThanhToan, dh.TrangThai,
            kh.HoTen as TenKhachHang, kh.SoDienThoai,
            sh.HoTen as TenShipper,
            nh.TenNhaHang
     FROM DonHang dh
     JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
     LEFT JOIN Shipper sh ON dh.MaShipper = sh.MaShipper
     LEFT JOIN NhaHang nh ON dh.MaNhaHang = nh.MaNhaHang
     WHERE dh.MaDonHang = @maDonHang`,
    [{ name: 'maDonHang', type: 'Int', value: maDonHang }]
  );

  const items = await getOrderItems(maDonHang);

  return { ...order.recordset[0], items };
}

module.exports = {
  createOrder, getMyOrders, cancelOrder, getOrderById, confirmPayment,
};
