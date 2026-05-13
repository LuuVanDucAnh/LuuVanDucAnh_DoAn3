const { query } = require('../config/db');

async function getRestaurant(req, res, next) {
  try {
    const result = await query(
      `SELECT MaNhaHang, TenNhaHang, DiaChi, SoDienThoai, HinhAnh, MinOrder, MaCode FROM NhaHang ORDER BY MaNhaHang`
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Chưa có thông tin nhà hàng.' });
    }

    res.json({ restaurants: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function getMenu(req, res, next) {
  try {
    const { maNhaHang } = req.query;

    let categories;
    if (maNhaHang) {
      categories = await query(
        `SELECT DISTINCT d.MaDanhMuc, d.TenDanhMuc
         FROM DanhMuc d
         JOIN MonAn m ON d.MaDanhMuc = m.MaDanhMuc
         WHERE m.MaNhaHang = @maNhaHang
         ORDER BY d.MaDanhMuc`,
        [{ name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) }]
      );
    } else {
      categories = await query(`SELECT MaDanhMuc, TenDanhMuc FROM DanhMuc ORDER BY MaDanhMuc`);
    }

    const menuByCategory = [];

    for (const cat of categories.recordset) {
      let foods;
      if (maNhaHang) {
        foods = await query(
          `SELECT MaMonAn, TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, SoLuong
           FROM MonAn WHERE MaDanhMuc = @maDanhMuc AND MaNhaHang = @maNhaHang ORDER BY MaMonAn`,
          [
            { name: 'maDanhMuc', type: 'Int', value: cat.MaDanhMuc },
            { name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) },
          ]
        );
      } else {
        foods = await query(
          `SELECT MaMonAn, TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, SoLuong
           FROM MonAn WHERE MaDanhMuc = @maDanhMuc ORDER BY MaMonAn`,
          [{ name: 'maDanhMuc', type: 'Int', value: cat.MaDanhMuc }]
        );
      }
      menuByCategory.push({
        ...cat,
        monAn: foods.recordset,
      });
    }

    res.json({ menu: menuByCategory });
  } catch (error) {
    next(error);
  }
}

async function getFoodsByCategory(req, res, next) {
  try {
    const { maDanhMuc, maNhaHang } = req.params;
    const nhParam = req.query.maNhaHang;

    let sql = `SELECT MaMonAn, TenMon, Gia, MoTa, HinhAnh, MaDanhMuc, SoLuong
               FROM MonAn WHERE MaDanhMuc = @maDanhMuc`;
    const params = [{ name: 'maDanhMuc', type: 'Int', value: parseInt(maDanhMuc) }];

    const filterNhaHang = nhParam || maNhaHang;
    if (filterNhaHang) {
      sql += ` AND MaNhaHang = @maNhaHang`;
      params.push({ name: 'maNhaHang', type: 'Int', value: parseInt(filterNhaHang) });
    }

    sql += ` ORDER BY MaMonAn`;

    const foods = await query(sql, params);
    res.json({ foods: foods.recordset });
  } catch (error) {
    next(error);
  }
}

async function getFoods(req, res, next) {
  try {
    const { maNhaHang } = req.query;

    let sql = `SELECT m.MaMonAn, m.TenMon, m.Gia, m.MoTa, m.HinhAnh, m.MaDanhMuc, m.SoLuong, d.TenDanhMuc
               FROM MonAn m
               JOIN DanhMuc d ON m.MaDanhMuc = d.MaDanhMuc`;
    const params = [];

    if (maNhaHang) {
      sql += ` WHERE m.MaNhaHang = @maNhaHang`;
      params.push({ name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) });
    }

    sql += ` ORDER BY d.MaDanhMuc, m.MaMonAn`;

    const result = await query(sql, params);
    res.json({ foods: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function getFoodDetail(req, res, next) {
  try {
    const { id } = req.params;

    const food = await query(
      `SELECT m.MaMonAn, m.TenMon, m.Gia, m.MoTa, m.HinhAnh, m.MaDanhMuc, m.SoLuong,
              d.TenDanhMuc, nh.TenNhaHang
       FROM MonAn m
       JOIN DanhMuc d ON m.MaDanhMuc = d.MaDanhMuc
       JOIN NhaHang nh ON m.MaNhaHang = nh.MaNhaHang
       WHERE m.MaMonAn = @id`,
      [{ name: 'id', type: 'Int', value: parseInt(id) }]
    );

    if (food.recordset.length === 0) {
      return res.status(404).json({ message: 'Món ăn không tồn tại.' });
    }

    res.json({ food: food.recordset[0] });
  } catch (error) {
    next(error);
  }
}

async function searchFoods(req, res, next) {
  try {
    const { q, maDanhMuc } = req.query;

    if (!q && !maDanhMuc) {
      return res.status(400).json({ message: 'Cần truyền từ khóa tìm kiếm (q) hoặc mã danh mục (maDanhMuc).' });
    }

    let sql = `SELECT m.MaMonAn, m.TenMon, m.Gia, m.MoTa, m.HinhAnh, m.MaDanhMuc, m.SoLuong, d.TenDanhMuc
               FROM MonAn m
               JOIN DanhMuc d ON m.MaDanhMuc = d.MaDanhMuc
               WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ` AND (m.TenMon LIKE @q OR m.MoTa LIKE @q)`;
      params.push({ name: 'q', type: 'NVarChar', value: `%${q}%` });
    }

    if (maDanhMuc) {
      sql += ` AND m.MaDanhMuc = @maDanhMuc`;
      params.push({ name: 'maDanhMuc', type: 'Int', value: parseInt(maDanhMuc) });
    }

    sql += ` ORDER BY m.TenMon`;

    const result = await query(sql, params);
    res.json({ foods: result.recordset });
  } catch (error) {
    next(error);
  }
}

async function validateOrder(req, res, next) {
  try {
    const { items, diaChiGiao, maNhaHang } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống.' });
    }

    if (!maNhaHang) {
      return res.status(400).json({ message: 'Vui lòng chọn nhà hàng.' });
    }

    const restaurant = await query(
      `SELECT MaNhaHang, MinOrder, TenNhaHang, DiaChi FROM NhaHang WHERE MaNhaHang = @maNhaHang`,
      [{ name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) }]
    );
    if (restaurant.recordset.length === 0) {
      return res.status(404).json({ message: 'Nhà hàng không tồn tại.' });
    }

    const nh = restaurant.recordset[0];
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const monAn = await query(
        `SELECT MaMonAn, TenMon, Gia FROM MonAn WHERE MaMonAn = @id AND MaNhaHang = @maNhaHang`,
        [
          { name: 'id', type: 'Int', value: parseInt(item.maMonAn) },
          { name: 'maNhaHang', type: 'Int', value: parseInt(maNhaHang) },
        ]
      );

      if (monAn.recordset.length === 0) {
        return res.status(404).json({ message: `Món ăn ID ${item.maMonAn} không tồn tại hoặc không thuộc nhà hàng này.` });
      }

      const food = monAn.recordset[0];
      const soLuong = parseInt(item.soLuong) || 1;
      const thanhTien = parseFloat(food.Gia) * soLuong;
      subtotal += thanhTien;
      validatedItems.push({
        maMonAn: food.MaMonAn,
        tenMon: food.TenMon,
        donGia: parseFloat(food.Gia),
        soLuong,
        thanhTien,
      });
    }

    const phiShip = 15000;
    const tongTien = subtotal + phiShip;
    const minOrder = parseFloat(nh.MinOrder) || 0;

    res.json({
      valid: subtotal >= minOrder,
      minOrder,
      subtotal,
      phiShip,
      tongTien,
      items: validatedItems,
      restaurant: { maNhaHang: nh.MaNhaHang, tenNhaHang: nh.TenNhaHang, diaChi: nh.DiaChi },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRestaurant, getMenu, getFoodsByCategory, getFoods,
  getFoodDetail, searchFoods, validateOrder,
};
