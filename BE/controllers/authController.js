const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function register(req, res, next) {
  try {
    const { username, password, hoTen, soDienThoai, diaChi } = req.body;

    if (!username || !password || !hoTen) {
      return res.status(400).json({ message: 'Username, password, hoTen là bắt buộc.' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'Username phải từ 3 đến 50 ký tự.' });
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
      `INSERT INTO TaiKhoan (Username, MatKhau, VaiTro) OUTPUT INSERTED.MaTK VALUES (@username, @matKhau, 'KhachHang')`,
      [
        { name: 'username', type: 'VarChar', value: username },
        { name: 'matKhau', type: 'VarChar', value: hashedPassword },
      ]
    );
    const maTK = insertAccount.recordset[0].MaTK;

    await query(
      `INSERT INTO KhachHang (MaTK, HoTen, SoDienThoai, DiaChi) VALUES (@maTK, @hoTen, @soDienThoai, @diaChi)`,
      [
        { name: 'maTK', type: 'Int', value: maTK },
        { name: 'hoTen', type: 'NVarChar', value: hoTen },
        { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
        { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
      ]
    );

    const khachHang = await query('SELECT MaKhachHang FROM KhachHang WHERE MaTK = @maTK', [
      { name: 'maTK', type: 'Int', value: maTK },
    ]);

    const payload = {
      maTK,
      username,
      vaiTro: 'KhachHang',
      hoTen,
      maKhachHang: khachHang.recordset[0].MaKhachHang,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: 'Đăng ký thành công.',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username và password là bắt buộc.' });
    }

    const accounts = await query(
      `SELECT tk.MaTK, tk.Username, tk.MatKhau, tk.VaiTro,
              kh.MaKhachHang, kh.HoTen,
              nv.MaNhanVien,
              sh.MaShipper
       FROM TaiKhoan tk
       LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
       LEFT JOIN NhanVien nv ON tk.MaTK = nv.MaTK
       LEFT JOIN Shipper sh ON tk.MaTK = sh.MaTK
       WHERE tk.Username = @username`,
      [{ name: 'username', type: 'VarChar', value: username }]
    );

    if (accounts.recordset.length === 0) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    const account = accounts.recordset[0];
    const isPasswordValid = await bcrypt.compare(password, account.MatKhau);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    let hoTen = account.HoTen || username;
    const payload = {
      maTK: account.MaTK,
      username: account.Username,
      vaiTro: account.VaiTro,
      hoTen,
    };

    if (account.VaiTro === 'KhachHang') {
      payload.maKhachHang = account.MaKhachHang;
    } else if (account.VaiTro === 'NhanVien') {
      payload.maNhanVien = account.MaNhanVien;
    } else if (account.VaiTro === 'Shipper') {
      payload.maShipper = account.MaShipper;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const { maTK, vaiTro } = req.user;

    let data = await query(
      `SELECT tk.MaTK, tk.Username, tk.VaiTro, tk.NgayTao,
              kh.HoTen, kh.SoDienThoai, kh.DiaChi,
              nv.HoTen as HoTenNV,
              sh.HoTen as HoTenShipper, sh.BienSoXe, sh.SoDienThoai as ShipperSDT
       FROM TaiKhoan tk
       LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
       LEFT JOIN NhanVien nv ON tk.MaTK = nv.MaTK
       LEFT JOIN Shipper sh ON tk.MaTK = sh.MaTK
       WHERE tk.MaTK = @maTK`,
      [{ name: 'maTK', type: 'Int', value: maTK }]
    );

    res.json({ user: data.recordset[0] });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { maTK, vaiTro } = req.user;
    const { hoTen, soDienThoai, diaChi } = req.body;

    if (!hoTen) {
      return res.status(400).json({ message: 'Họ tên là bắt buộc.' });
    }

    if (vaiTro === 'KhachHang') {
      await query(
        `UPDATE KhachHang SET HoTen = @hoTen, SoDienThoai = @soDienThoai, DiaChi = @diaChi WHERE MaTK = @maTK`,
        [
          { name: 'maTK', type: 'Int', value: maTK },
          { name: 'hoTen', type: 'NVarChar', value: hoTen },
          { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
          { name: 'diaChi', type: 'NVarChar', value: diaChi || '' },
        ]
      );
    } else if (vaiTro === 'NhanVien') {
      await query(
        `UPDATE NhanVien SET HoTen = @hoTen WHERE MaTK = @maTK`,
        [
          { name: 'maTK', type: 'Int', value: maTK },
          { name: 'hoTen', type: 'NVarChar', value: hoTen },
        ]
      );
    } else if (vaiTro === 'Shipper') {
      await query(
        `UPDATE Shipper SET HoTen = @hoTen, SoDienThoai = @soDienThoai WHERE MaTK = @maTK`,
        [
          { name: 'maTK', type: 'Int', value: maTK },
          { name: 'hoTen', type: 'NVarChar', value: hoTen },
          { name: 'soDienThoai', type: 'VarChar', value: soDienThoai || '' },
        ]
      );
    }

    res.json({ message: 'Cập nhật thông tin thành công.' });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { maTK } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
    }
    if (newPassword.length < 5) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 5 ký tự.' });
    }

    const account = await query('SELECT MatKhau FROM TaiKhoan WHERE MaTK = @maTK', [
      { name: 'maTK', type: 'Int', value: maTK },
    ]);

    const isValid = await bcrypt.compare(currentPassword, account.recordset[0].MatKhau);
    if (!isValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE TaiKhoan SET MatKhau = @matKhau WHERE MaTK = @maTK', [
      { name: 'matKhau', type: 'VarChar', value: hashedPassword },
      { name: 'maTK', type: 'Int', value: maTK },
    ]);

    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { maTK } = req.user;

    const accounts = await query(
      `SELECT tk.MaTK, tk.Username, tk.VaiTro,
              kh.MaKhachHang, kh.HoTen,
              nv.MaNhanVien,
              sh.MaShipper
       FROM TaiKhoan tk
       LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
       LEFT JOIN NhanVien nv ON tk.MaTK = nv.MaTK
       LEFT JOIN Shipper sh ON tk.MaTK = sh.MaTK
       WHERE tk.MaTK = @maTK`,
      [{ name: 'maTK', type: 'Int', value: maTK }]
    );

    if (accounts.recordset.length === 0) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    const account = accounts.recordset[0];
    let hoTen = account.HoTen || account.Username;
    const payload = {
      maTK: account.MaTK,
      username: account.Username,
      vaiTro: account.VaiTro,
      hoTen,
    };

    if (account.VaiTro === 'KhachHang') {
      payload.maKhachHang = account.MaKhachHang;
    } else if (account.VaiTro === 'NhanVien') {
      payload.maNhanVien = account.MaNhanVien;
    } else if (account.VaiTro === 'Shipper') {
      payload.maShipper = account.MaShipper;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({ token, user: payload });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getProfile, updateProfile, changePassword, refreshToken };
