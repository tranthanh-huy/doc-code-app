'use strict';
/* ============================================================
   Bộ tạo mã QR tí hon, tự chứa, CHẠY OFFLINE (không CDN, không mạng).
   Dùng để nút "Chia sẻ sang máy khác" vẽ QR chứa link đồng bộ.
   Chỉ hỗ trợ chế độ byte (UTF-8) — đủ cho link. Thuật toán chuẩn QR
   (dựa trên bản của Nayuki, public domain). Không phụ thuộc gì bên ngoài.

   Dùng:  const qr = QRCode.encode("chuỗi", "M");   // "L" | "M" | "Q" | "H"
          qr.size            -> số ô mỗi cạnh
          qr.get(x, y)       -> true nếu ô (cột x, hàng y) là màu đen
   ============================================================ */
(function (root) {
  // Số codeword sửa lỗi mỗi khối, theo [mức EC][phiên bản 1..40]
  var ECC_CW_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  // Số khối sửa lỗi, theo [mức EC][phiên bản 1..40]
  var NUM_EC_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  // Mức EC: chỉ số hàng bảng + bit định dạng
  var ECL = { L: { i: 0, bits: 1 }, M: { i: 1, bits: 0 }, Q: { i: 2, bits: 3 }, H: { i: 3, bits: 2 } };
  var MIN_VER = 1, MAX_VER = 40;

  function Qr(version, eclObj, dataCodewords, mask) {
    this.version = version;
    this.size = version * 4 + 17;
    this.ecl = eclObj;
    var size = this.size;
    this.modules = [];
    this.isFn = [];
    for (var i = 0; i < size; i++) {
      this.modules.push(new Array(size).fill(false));
      this.isFn.push(new Array(size).fill(false));
    }
    this.drawFunctionPatterns();
    var allCw = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCw);

    if (mask === -1) {
      var minPenalty = 1e9;
      for (var m = 0; m < 8; m++) {
        this.applyMask(m);
        this.drawFormat(m);
        var p = this.penalty();
        if (p < minPenalty) { mask = m; minPenalty = p; }
        this.applyMask(m); // đảo lại (XOR hai lần = gỡ mặt nạ)
      }
    }
    this.mask = mask;
    this.applyMask(mask);
    this.drawFormat(mask);
    this.isFn = null;
  }

  Qr.prototype.get = function (x, y) { return this.modules[y][x]; };

  Qr.prototype.setFn = function (x, y, val) {
    this.modules[y][x] = val;
    this.isFn[y][x] = true;
  };

  Qr.prototype.drawFunctionPatterns = function () {
    var size = this.size, i;
    for (i = 0; i < size; i++) {
      this.setFn(6, i, i % 2 === 0);
      this.setFn(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);

    var align = this.alignPositions();
    var n = align.length;
    for (var a = 0; a < n; a++) {
      for (var b = 0; b < n; b++) {
        if (!((a === 0 && b === 0) || (a === 0 && b === n - 1) || (a === n - 1 && b === 0))) {
          this.drawAlign(align[a], align[b]);
        }
      }
    }
    this.drawFormat(0);
    this.drawVersion();
  };

  Qr.prototype.drawFinder = function (cx, cy) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var x = cx + dx, y = cy + dy;
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
          this.setFn(x, y, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  Qr.prototype.drawAlign = function (cx, cy) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        this.setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  Qr.prototype.drawFormat = function (mask) {
    var data = (this.ecl.bits << 3) | mask; // 5 bit
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412; // 15 bit
    var i2;
    for (i2 = 0; i2 <= 5; i2++) this.setFn(8, i2, getBit(bits, i2));
    this.setFn(8, 7, getBit(bits, 6));
    this.setFn(8, 8, getBit(bits, 7));
    this.setFn(7, 8, getBit(bits, 8));
    for (i2 = 9; i2 < 15; i2++) this.setFn(14 - i2, 8, getBit(bits, i2));

    var size = this.size;
    for (i2 = 0; i2 < 8; i2++) this.setFn(size - 1 - i2, 8, getBit(bits, i2));
    for (i2 = 8; i2 < 15; i2++) this.setFn(8, size - 15 + i2, getBit(bits, i2));
    this.setFn(8, size - 8, true); // ô đen cố định
  };

  Qr.prototype.drawVersion = function () {
    if (this.version < 7) return;
    var rem = this.version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = (this.version << 12) | rem; // 18 bit
    for (var j = 0; j < 18; j++) {
      var bit = getBit(bits, j);
      var a = this.size - 11 + (j % 3);
      var b = Math.floor(j / 3);
      this.setFn(a, b, bit);
      this.setFn(b, a, bit);
    }
  };

  Qr.prototype.alignPositions = function () {
    if (this.version === 1) return [];
    var numAlign = Math.floor(this.version / 7) + 2;
    var step = (this.version === 32) ? 26 :
      Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    var result = [6];
    for (var pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  };

  // ---- số học & mã hoá ----
  Qr.prototype.numRawDataModules = function () {
    var ver = this.version;
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  };

  Qr.prototype.numDataCodewords = function () {
    var ver = this.version, eclI = this.ecl.i;
    return Math.floor(this.numRawDataModules() / 8) -
      ECC_CW_PER_BLOCK[eclI][ver] * NUM_EC_BLOCKS[eclI][ver];
  };

  Qr.prototype.addEccAndInterleave = function (data) {
    var ver = this.version, eclI = this.ecl.i;
    var numBlocks = NUM_EC_BLOCKS[eclI][ver];
    var blockEccLen = ECC_CW_PER_BLOCK[eclI][ver];
    var rawCodewords = Math.floor(this.numRawDataModules() / 8);
    var numShortBlocks = numBlocks - rawCodewords % numBlocks;
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);

    var blocks = [];
    var rsDiv = reedSolomonDivisor(blockEccLen);
    var k = 0;
    for (var i = 0; i < numBlocks; i++) {
      var datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      var dat = data.slice(k, k + datLen);
      k += datLen;
      var ecc = reedSolomonRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0); // ô trống để căn cột
      blocks.push(dat.concat(ecc));
    }

    var result = [];
    for (var col = 0; col < blocks[0].length; col++) {
      for (var b = 0; b < blocks.length; b++) {
        // bỏ ô đệm ở cột cuối của các khối ngắn
        if (col !== shortBlockLen - blockEccLen || b >= numShortBlocks) {
          result.push(blocks[b][col]);
        }
      }
    }
    return result;
  };

  Qr.prototype.drawCodewords = function (data) {
    var size = this.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!this.isFn[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  Qr.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        if (this.isFn[y][x]) continue;
        var invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  // Hoa văn 1:1:3:1:1 có 4 ô sáng kèm bên (luật phạt số 3)
  var FP1 = [true, false, true, true, true, false, true, false, false, false, false];
  var FP2 = [false, false, false, false, true, false, true, true, true, false, true];
  function matchAt(arr, i, pat) {
    for (var k = 0; k < pat.length; k++) if (arr[i + k] !== pat[k]) return false;
    return true;
  }
  Qr.prototype.penalty = function () {
    var size = this.size, mod = this.modules, result = 0;
    var x, y, run, color, i;
    // 1) & 3) trên từng hàng
    for (y = 0; y < size; y++) {
      run = 0; color = mod[y][0];
      for (x = 0; x < size; x++) {
        if (mod[y][x] === color) { run++; if (run === 5) result += 3; else if (run > 5) result++; }
        else { color = mod[y][x]; run = 1; }
      }
      for (i = 0; i + 11 <= size; i++) if (matchAt(mod[y], i, FP1) || matchAt(mod[y], i, FP2)) result += 40;
    }
    // 1) & 3) trên từng cột
    for (x = 0; x < size; x++) {
      run = 0; color = mod[0][x];
      var colArr = [];
      for (y = 0; y < size; y++) {
        colArr.push(mod[y][x]);
        if (mod[y][x] === color) { run++; if (run === 5) result += 3; else if (run > 5) result++; }
        else { color = mod[y][x]; run = 1; }
      }
      for (i = 0; i + 11 <= size; i++) if (matchAt(colArr, i, FP1) || matchAt(colArr, i, FP2)) result += 40;
    }
    // 2) khối 2x2 cùng màu
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) result += 3;
      }
    }
    // 4) tỉ lệ đen
    var dark = 0;
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
    var total = size * size;
    var k = 0;
    while (Math.abs(dark * 20 - total * 10) > (k + 1) * total) k++;
    result += k * 10;
    return result;
  };

  // ---- Reed–Solomon trên GF(256) ----
  function reedSolomonDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var root = 1;
    for (var j = 0; j < degree; j++) {
      for (var k = 0; k < result.length; k++) {
        result[k] = rsMul(result[k], root);
        if (k + 1 < result.length) result[k] ^= result[k + 1];
      }
      root = rsMul(root, 0x02);
    }
    return result;
  }
  function reedSolomonRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ result.shift();
      result.push(0);
      for (var j = 0; j < result.length; j++) result[j] ^= rsMul(divisor[j], factor);
    }
    return result;
  }
  function rsMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  // ---- API công khai ----
  function encode(text, eclName) {
    var eclObj = ECL[(eclName || 'M').toUpperCase()] || ECL.M;
    var bytes = utf8Bytes(text);

    // chọn phiên bản nhỏ nhất chứa vừa dữ liệu ở mức EC này
    var version = -1, dataUsedBits = 0, dataCapacityBits = 0;
    for (var v = MIN_VER; v <= MAX_VER; v++) {
      var tmp = Object.create(Qr.prototype);
      tmp.version = v; tmp.ecl = eclObj;
      var cap = tmp.numDataCodewords() * 8;
      var ccBits = (v <= 9) ? 8 : 16;
      var used = 4 + ccBits + bytes.length * 8;
      if (used <= cap) { version = v; dataUsedBits = used; dataCapacityBits = cap; break; }
    }
    if (version === -1) throw new Error('Chuỗi quá dài cho mã QR.');

    // dựng chuỗi bit
    var bb = [];
    appendBits(bb, 4, 4);                                   // chỉ báo chế độ byte = 0100
    appendBits(bb, bytes.length, version <= 9 ? 8 : 16);    // số ký tự
    for (var i = 0; i < bytes.length; i++) appendBits(bb, bytes[i], 8);
    // kết thúc + đệm cho tròn byte + byte đệm 0xEC,0x11
    appendBits(bb, 0, Math.min(4, dataCapacityBits - bb.length));
    appendBits(bb, 0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < dataCapacityBits; pad ^= 0xEC ^ 0x11) appendBits(bb, pad, 8);

    var dataCw = [];
    for (var b = 0; b < bb.length; b += 8) {
      var byteVal = 0;
      for (var t = 0; t < 8; t++) byteVal = (byteVal << 1) | bb[b + t];
      dataCw.push(byteVal);
    }
    return new Qr(version, eclObj, dataCw, -1);
  }

  function appendBits(bb, val, len) {
    for (var i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  }
  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
      else if (c >= 0xD800 && c < 0xDC00 && i + 1 < str.length) {
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      } else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    }
    return out;
  }

  var API = { encode: encode };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.QRCode = API;
})(typeof window !== 'undefined' ? window : globalThis);
