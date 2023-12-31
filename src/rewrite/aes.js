var Nr = 14,
  Nk = 8,
  Decrypt = false,
  enc_utf8 = function (s) {
    try {
      return unescape(encodeURIComponent(s));
    } catch (e) {
      throw "Error on UTF-8 encode";
    }
  },
  dec_utf8 = function (s) {
    try {
      return decodeURIComponent(escape(s));
    } catch (e) {
      throw "Bad Key";
    }
  },
  padBlock = function (byteArr) {
    var array = [],
      cpad,
      i;
    if (byteArr.length < 16) {
      cpad = 16 - byteArr.length;
      array = [
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
        cpad,
      ];
    }
    for (i = 0; i < byteArr.length; i++) {
      array[i] = byteArr[i];
    }
    return array;
  },
  block2s = function (block, lastBlock) {
    var string = "",
      padding,
      i;
    if (lastBlock) {
      padding = block[15];
      if (padding > 16) {
        throw "Decryption error: Maybe bad key";
      }
      if (padding === 16) {
        return "";
      }
      for (i = 0; i < 16 - padding; i++) {
        string += String.fromCharCode(block[i]);
      }
    } else {
      for (i = 0; i < 16; i++) {
        string += String.fromCharCode(block[i]);
      }
    }
    return string;
  },
  a2h = function (numArr) {
    var string = "",
      i;
    for (i = 0; i < numArr.length; i++) {
      string += (numArr[i] < 16 ? "0" : "") + numArr[i].toString(16);
    }
    return string;
  },
  h2a = function (s) {
    var ret = [];
    s.replace(/(..)/g, function (s) {
      ret.push(parseInt(s, 16));
    });
    return ret;
  },
  s2a = function (string, binary) {
    var array = [],
      i;

    if (!binary) {
      string = enc_utf8(string);
    }

    for (i = 0; i < string.length; i++) {
      array[i] = string.charCodeAt(i);
    }

    return array;
  },
  size = function (newsize) {
    switch (newsize) {
      case 128:
        Nr = 10;
        Nk = 4;
        break;
      case 192:
        Nr = 12;
        Nk = 6;
        break;
      case 256:
        Nr = 14;
        Nk = 8;
        break;
      default:
        throw "Invalid Key Size Specified:" + newsize;
    }
  },
  randArr = function (num) {
    var result = [],
      i;
    for (i = 0; i < num; i++) {
      result = result.concat(Math.floor(Math.random() * 256));
    }
    return result;
  },
  openSSLKey = function (passwordArr, saltArr) {
    var rounds = Nr >= 12 ? 3 : 2,
      key = [],
      iv = [],
      md5_hash = [],
      result = [],
      data00 = passwordArr.concat(saltArr),
      i;
    md5_hash[0] = MD5(data00);
    result = md5_hash[0];
    for (i = 1; i < rounds; i++) {
      md5_hash[i] = MD5(md5_hash[i - 1].concat(data00));
      result = result.concat(md5_hash[i]);
    }
    key = result.slice(0, 4 * Nk);
    iv = result.slice(4 * Nk, 4 * Nk + 16);
    return {
      key: key,
      iv: iv,
    };
  },
  rawEncrypt = function (plaintext, key, iv) {
    key = expandKey(key);
    var numBlocks = Math.ceil(plaintext.length / 16),
      blocks = [],
      i,
      cipherBlocks = [];
    for (i = 0; i < numBlocks; i++) {
      blocks[i] = padBlock(plaintext.slice(i * 16, i * 16 + 16));
    }
    if (plaintext.length % 16 === 0) {
      blocks.push([
        16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
      ]);
      numBlocks++;
    }
    for (i = 0; i < blocks.length; i++) {
      blocks[i] =
        i === 0
          ? xorBlocks(blocks[i], iv)
          : xorBlocks(blocks[i], cipherBlocks[i - 1]);
      cipherBlocks[i] = encryptBlock(blocks[i], key);
    }
    return cipherBlocks;
  },
  rawDecrypt = function (cryptArr, key, iv, binary) {
    key = expandKey(key);
    var numBlocks = cryptArr.length / 16,
      cipherBlocks = [],
      i,
      plainBlocks = [],
      string = "";
    for (i = 0; i < numBlocks; i++) {
      cipherBlocks.push(cryptArr.slice(i * 16, (i + 1) * 16));
    }
    for (i = cipherBlocks.length - 1; i >= 0; i--) {
      plainBlocks[i] = decryptBlock(cipherBlocks[i], key);
      plainBlocks[i] =
        i === 0
          ? xorBlocks(plainBlocks[i], iv)
          : xorBlocks(plainBlocks[i], cipherBlocks[i - 1]);
    }
    for (i = 0; i < numBlocks - 1; i++) {
      string += block2s(plainBlocks[i], false);
    }
    string += block2s(plainBlocks[i], true);
    return binary ? string : dec_utf8(string);
  },
  encryptBlock = function (block, words) {
    Decrypt = false;
    var state = addRoundKey(block, words, 0),
      round;
    for (round = 1; round < Nr + 1; round++) {
      state = subBytes(state);
      state = shiftRows(state);
      if (round < Nr) {
        state = mixColumns(state);
      }
      state = addRoundKey(state, words, round);
    }

    return state;
  },
  decryptBlock = function (block, words) {
    Decrypt = true;
    var state = addRoundKey(block, words, Nr),
      round;
    for (round = Nr - 1; round > -1; round--) {
      state = shiftRows(state);
      state = subBytes(state);
      state = addRoundKey(state, words, round);
      if (round > 0) {
        state = mixColumns(state);
      }
    }

    return state;
  },
  subBytes = function (state) {
    var S = Decrypt ? SBoxInv : SBox,
      temp = [],
      i;
    for (i = 0; i < 16; i++) {
      temp[i] = S[state[i]];
    }
    return temp;
  },
  shiftRows = function (state) {
    var temp = [],
      shiftBy = Decrypt
        ? [0, 13, 10, 7, 4, 1, 14, 11, 8, 5, 2, 15, 12, 9, 6, 3]
        : [0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11],
      i;
    for (i = 0; i < 16; i++) {
      temp[i] = state[shiftBy[i]];
    }
    return temp;
  },
  mixColumns = function (state) {
    var t = [],
      c;
    if (!Decrypt) {
      for (c = 0; c < 4; c++) {
        t[c * 4] =
          G2X[state[c * 4]] ^
          G3X[state[1 + c * 4]] ^
          state[2 + c * 4] ^
          state[3 + c * 4];
        t[1 + c * 4] =
          state[c * 4] ^
          G2X[state[1 + c * 4]] ^
          G3X[state[2 + c * 4]] ^
          state[3 + c * 4];
        t[2 + c * 4] =
          state[c * 4] ^
          state[1 + c * 4] ^
          G2X[state[2 + c * 4]] ^
          G3X[state[3 + c * 4]];
        t[3 + c * 4] =
          G3X[state[c * 4]] ^
          state[1 + c * 4] ^
          state[2 + c * 4] ^
          G2X[state[3 + c * 4]];
      }
    } else {
      for (c = 0; c < 4; c++) {
        t[c * 4] =
          GEX[state[c * 4]] ^
          GBX[state[1 + c * 4]] ^
          GDX[state[2 + c * 4]] ^
          G9X[state[3 + c * 4]];
        t[1 + c * 4] =
          G9X[state[c * 4]] ^
          GEX[state[1 + c * 4]] ^
          GBX[state[2 + c * 4]] ^
          GDX[state[3 + c * 4]];
        t[2 + c * 4] =
          GDX[state[c * 4]] ^
          G9X[state[1 + c * 4]] ^
          GEX[state[2 + c * 4]] ^
          GBX[state[3 + c * 4]];
        t[3 + c * 4] =
          GBX[state[c * 4]] ^
          GDX[state[1 + c * 4]] ^
          G9X[state[2 + c * 4]] ^
          GEX[state[3 + c * 4]];
      }
    }

    return t;
  },
  addRoundKey = function (state, words, round) {
    var temp = [],
      i;
    for (i = 0; i < 16; i++) {
      temp[i] = state[i] ^ words[round][i];
    }
    return temp;
  },
  xorBlocks = function (block1, block2) {
    var temp = [],
      i;
    for (i = 0; i < 16; i++) {
      temp[i] = block1[i] ^ block2[i];
    }
    return temp;
  },
  expandKey = function (key) {
    var w = [],
      temp = [],
      i,
      r,
      t,
      flat = [],
      j;

    for (i = 0; i < Nk; i++) {
      r = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
      w[i] = r;
    }

    for (i = Nk; i < 4 * (Nr + 1); i++) {
      w[i] = [];
      for (t = 0; t < 4; t++) {
        temp[t] = w[i - 1][t];
      }
      if (i % Nk === 0) {
        temp = subWord(rotWord(temp));
        temp[0] ^= Rcon[i / Nk - 1];
      } else if (Nk > 6 && i % Nk === 4) {
        temp = subWord(temp);
      }
      for (t = 0; t < 4; t++) {
        w[i][t] = w[i - Nk][t] ^ temp[t];
      }
    }
    for (i = 0; i < Nr + 1; i++) {
      flat[i] = [];
      for (j = 0; j < 4; j++) {
        flat[i].push(
          w[i * 4 + j][0],
          w[i * 4 + j][1],
          w[i * 4 + j][2],
          w[i * 4 + j][3]
        );
      }
    }
    return flat;
  },
  subWord = function (w) {
    for (var i = 0; i < 4; i++) {
      w[i] = SBox[w[i]];
    }
    return w;
  },
  rotWord = function (w) {
    var tmp = w[0],
      i;
    for (i = 0; i < 3; i++) {
      w[i] = w[i + 1];
    }
    w[3] = tmp;
    return w;
  },
  strhex = function (str, size) {
    var i,
      ret = [];
    for (i = 0; i < str.length; i += size) {
      ret[i / size] = parseInt(str.substr(i, size), 16);
    }
    return ret;
  },
  invertArr = function (arr) {
    var i,
      ret = [];
    for (i = 0; i < arr.length; i++) {
      ret[arr[i]] = i;
    }
    return ret;
  },
  Gxx = function (a, b) {
    var i, ret;

    ret = 0;
    for (i = 0; i < 8; i++) {
      ret = (b & 1) === 1 ? ret ^ a : ret;
      a = a > 0x7f ? 0x11b ^ (a << 1) : a << 1;
      b >>>= 1;
    }

    return ret;
  },
  Gx = function (x) {
    var i,
      r = [];
    for (i = 0; i < 256; i++) {
      r[i] = Gxx(x, i);
    }
    return r;
  },
  SBox = strhex(
    "637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b27509832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cfd0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdbe0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9ee1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16",
    2
  ),
  SBoxInv = invertArr(SBox),
  Rcon = strhex(
    "01020408102040801b366cd8ab4d9a2f5ebc63c697356ad4b37dfaefc591",
    2
  ),
  G2X = Gx(2),
  G3X = Gx(3),
  G9X = Gx(9),
  GBX = Gx(0xb),
  GDX = Gx(0xd),
  GEX = Gx(0xe),
  enc = function (string, pass, binary) {
    var salt = randArr(8),
      pbe = openSSLKey(s2a(pass, binary), salt),
      key = pbe.key,
      iv = pbe.iv,
      cipherBlocks,
      saltBlock = [[83, 97, 108, 116, 101, 100, 95, 95].concat(salt)];
    string = s2a(string, binary);
    cipherBlocks = rawEncrypt(string, key, iv);

    cipherBlocks = saltBlock.concat(cipherBlocks);
    return Base64.encode(cipherBlocks);
  },
  dec = function (string, pass, binary) {
    var cryptArr = Base64.decode(string),
      salt = cryptArr.slice(8, 16),
      pbe = openSSLKey(s2a(pass, binary), salt),
      key = pbe.key,
      iv = pbe.iv;
    cryptArr = cryptArr.slice(16, cryptArr.length);

    string = rawDecrypt(cryptArr, key, iv, binary);
    return string;
  },
  MD5 = function (numArr) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = lX & 0x80000000;
      lY8 = lY & 0x80000000;
      lX4 = lX & 0x40000000;
      lY4 = lY & 0x40000000;
      lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
      if (lX4 & lY4) {
        return lResult ^ 0x80000000 ^ lX8 ^ lY8;
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
        } else {
          return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        }
      } else {
        return lResult ^ lX8 ^ lY8;
      }
    }

    function f(x, y, z) {
      return (x & y) | (~x & z);
    }
    function g(x, y, z) {
      return (x & z) | (y & ~z);
    }
    function h(x, y, z) {
      return x ^ y ^ z;
    }
    function funcI(x, y, z) {
      return y ^ (x | ~z);
    }

    function ff(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function gg(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function hh(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function ii(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(funcI(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(numArr) {
      var lWordCount,
        lMessageLength = numArr.length,
        lNumberOfWords_temp1 = lMessageLength + 8,
        lNumberOfWords_temp2 =
          (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64,
        lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16,
        lWordArray = [],
        lBytePosition = 0,
        lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] =
          lWordArray[lWordCount] | (numArr[lByteCount] << lBytePosition);
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }

    function wordToHex(lValue) {
      var lByte,
        lCount,
        wordToHexArr = [];
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexArr = wordToHexArr.concat(lByte);
      }
      return wordToHexArr;
    }

    var x = [],
      k,
      AA,
      BB,
      CC,
      DD,
      a,
      b,
      c,
      d,
      rnd = strhex(
        "67452301efcdab8998badcfe10325476d76aa478e8c7b756242070dbc1bdceeef57c0faf4787c62aa8304613fd469501698098d88b44f7afffff5bb1895cd7be6b901122fd987193a679438e49b40821f61e2562c040b340265e5a51e9b6c7aad62f105d02441453d8a1e681e7d3fbc821e1cde6c33707d6f4d50d87455a14eda9e3e905fcefa3f8676f02d98d2a4c8afffa39428771f6816d9d6122fde5380ca4beea444bdecfa9f6bb4b60bebfbc70289b7ec6eaa127fad4ef308504881d05d9d4d039e6db99e51fa27cf8c4ac5665f4292244432aff97ab9423a7fc93a039655b59c38f0ccc92ffeff47d85845dd16fa87e4ffe2ce6e0a30143144e0811a1f7537e82bd3af2352ad7d2bbeb86d391",
        8
      );

    x = convertToWordArray(numArr);

    a = rnd[0];
    b = rnd[1];
    c = rnd[2];
    d = rnd[3];

    for (k = 0; k < x.length; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = ff(a, b, c, d, x[k + 0], 7, rnd[4]);
      d = ff(d, a, b, c, x[k + 1], 12, rnd[5]);
      c = ff(c, d, a, b, x[k + 2], 17, rnd[6]);
      b = ff(b, c, d, a, x[k + 3], 22, rnd[7]);
      a = ff(a, b, c, d, x[k + 4], 7, rnd[8]);
      d = ff(d, a, b, c, x[k + 5], 12, rnd[9]);
      c = ff(c, d, a, b, x[k + 6], 17, rnd[10]);
      b = ff(b, c, d, a, x[k + 7], 22, rnd[11]);
      a = ff(a, b, c, d, x[k + 8], 7, rnd[12]);
      d = ff(d, a, b, c, x[k + 9], 12, rnd[13]);
      c = ff(c, d, a, b, x[k + 10], 17, rnd[14]);
      b = ff(b, c, d, a, x[k + 11], 22, rnd[15]);
      a = ff(a, b, c, d, x[k + 12], 7, rnd[16]);
      d = ff(d, a, b, c, x[k + 13], 12, rnd[17]);
      c = ff(c, d, a, b, x[k + 14], 17, rnd[18]);
      b = ff(b, c, d, a, x[k + 15], 22, rnd[19]);
      a = gg(a, b, c, d, x[k + 1], 5, rnd[20]);
      d = gg(d, a, b, c, x[k + 6], 9, rnd[21]);
      c = gg(c, d, a, b, x[k + 11], 14, rnd[22]);
      b = gg(b, c, d, a, x[k + 0], 20, rnd[23]);
      a = gg(a, b, c, d, x[k + 5], 5, rnd[24]);
      d = gg(d, a, b, c, x[k + 10], 9, rnd[25]);
      c = gg(c, d, a, b, x[k + 15], 14, rnd[26]);
      b = gg(b, c, d, a, x[k + 4], 20, rnd[27]);
      a = gg(a, b, c, d, x[k + 9], 5, rnd[28]);
      d = gg(d, a, b, c, x[k + 14], 9, rnd[29]);
      c = gg(c, d, a, b, x[k + 3], 14, rnd[30]);
      b = gg(b, c, d, a, x[k + 8], 20, rnd[31]);
      a = gg(a, b, c, d, x[k + 13], 5, rnd[32]);
      d = gg(d, a, b, c, x[k + 2], 9, rnd[33]);
      c = gg(c, d, a, b, x[k + 7], 14, rnd[34]);
      b = gg(b, c, d, a, x[k + 12], 20, rnd[35]);
      a = hh(a, b, c, d, x[k + 5], 4, rnd[36]);
      d = hh(d, a, b, c, x[k + 8], 11, rnd[37]);
      c = hh(c, d, a, b, x[k + 11], 16, rnd[38]);
      b = hh(b, c, d, a, x[k + 14], 23, rnd[39]);
      a = hh(a, b, c, d, x[k + 1], 4, rnd[40]);
      d = hh(d, a, b, c, x[k + 4], 11, rnd[41]);
      c = hh(c, d, a, b, x[k + 7], 16, rnd[42]);
      b = hh(b, c, d, a, x[k + 10], 23, rnd[43]);
      a = hh(a, b, c, d, x[k + 13], 4, rnd[44]);
      d = hh(d, a, b, c, x[k + 0], 11, rnd[45]);
      c = hh(c, d, a, b, x[k + 3], 16, rnd[46]);
      b = hh(b, c, d, a, x[k + 6], 23, rnd[47]);
      a = hh(a, b, c, d, x[k + 9], 4, rnd[48]);
      d = hh(d, a, b, c, x[k + 12], 11, rnd[49]);
      c = hh(c, d, a, b, x[k + 15], 16, rnd[50]);
      b = hh(b, c, d, a, x[k + 2], 23, rnd[51]);
      a = ii(a, b, c, d, x[k + 0], 6, rnd[52]);
      d = ii(d, a, b, c, x[k + 7], 10, rnd[53]);
      c = ii(c, d, a, b, x[k + 14], 15, rnd[54]);
      b = ii(b, c, d, a, x[k + 5], 21, rnd[55]);
      a = ii(a, b, c, d, x[k + 12], 6, rnd[56]);
      d = ii(d, a, b, c, x[k + 3], 10, rnd[57]);
      c = ii(c, d, a, b, x[k + 10], 15, rnd[58]);
      b = ii(b, c, d, a, x[k + 1], 21, rnd[59]);
      a = ii(a, b, c, d, x[k + 8], 6, rnd[60]);
      d = ii(d, a, b, c, x[k + 15], 10, rnd[61]);
      c = ii(c, d, a, b, x[k + 6], 15, rnd[62]);
      b = ii(b, c, d, a, x[k + 13], 21, rnd[63]);
      a = ii(a, b, c, d, x[k + 4], 6, rnd[64]);
      d = ii(d, a, b, c, x[k + 11], 10, rnd[65]);
      c = ii(c, d, a, b, x[k + 2], 15, rnd[66]);
      b = ii(b, c, d, a, x[k + 9], 21, rnd[67]);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    return wordToHex(a).concat(wordToHex(b), wordToHex(c), wordToHex(d));
  },
  encString = function (plaintext, key, iv) {
    var i;
    plaintext = s2a(plaintext, false);

    key = s2a(key, false);
    for (i = key.length; i < 32; i++) {
      key[i] = 0;
    }

    if (iv === undefined) {
    } else {
      iv = s2a(iv, false);
      for (i = iv.length; i < 16; i++) {
        iv[i] = 0;
      }
    }

    var ct = rawEncrypt(plaintext, key, iv);
    var ret = [iv];
    for (i = 0; i < ct.length; i++) {
      ret[ret.length] = ct[i];
    }
    return Base64.encode(ret);
  },
  decString = function (ciphertext, key) {
    var tmp = Base64.decode(ciphertext);
    var iv = tmp.slice(0, 16);
    var ct = tmp.slice(16, tmp.length);
    var i;

    key = s2a(key, false);
    for (i = key.length; i < 32; i++) {
      key[i] = 0;
    }

    var pt = rawDecrypt(ct, key, iv, false);
    return pt;
  },
  Base64 = (function () {
    var _chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
      chars = _chars.split(""),
      encode = function (b, withBreaks) {
        var flatArr = [],
          b64 = "",
          i,
          broken_b64,
          totalChunks = Math.floor((b.length * 16) / 3);
        for (i = 0; i < b.length * 16; i++) {
          flatArr.push(b[Math.floor(i / 16)][i % 16]);
        }
        for (i = 0; i < flatArr.length; i = i + 3) {
          b64 += chars[flatArr[i] >> 2];
          b64 += chars[((flatArr[i] & 3) << 4) | (flatArr[i + 1] >> 4)];
          if (flatArr[i + 1] !== undefined) {
            b64 += chars[((flatArr[i + 1] & 15) << 2) | (flatArr[i + 2] >> 6)];
          } else {
            b64 += "=";
          }
          if (flatArr[i + 2] !== undefined) {
            b64 += chars[flatArr[i + 2] & 63];
          } else {
            b64 += "=";
          }
        }
        broken_b64 = b64.slice(0, 64) + "\n";
        for (i = 1; i < Math.ceil(b64.length / 64); i++) {
          broken_b64 +=
            b64.slice(i * 64, i * 64 + 64) +
            (Math.ceil(b64.length / 64) === i + 1 ? "" : "\n");
        }
        return broken_b64;
      },
      decode = function (string) {
        string = string.replace(/\n/g, "");
        var flatArr = [],
          c = [],
          b = [],
          i;
        for (i = 0; i < string.length; i = i + 4) {
          c[0] = _chars.indexOf(string.charAt(i));
          c[1] = _chars.indexOf(string.charAt(i + 1));
          c[2] = _chars.indexOf(string.charAt(i + 2));
          c[3] = _chars.indexOf(string.charAt(i + 3));

          b[0] = (c[0] << 2) | (c[1] >> 4);
          b[1] = ((c[1] & 15) << 4) | (c[2] >> 2);
          b[2] = ((c[2] & 3) << 6) | c[3];
          flatArr.push(b[0], b[1], b[2]);
        }
        flatArr = flatArr.slice(0, flatArr.length - (flatArr.length % 16));
        return flatArr;
      };

    if (typeof Array.indexOf === "function") {
      _chars = chars;
    }

    return {
      encode: encode,
      decode: decode,
    };
  })();

export { enc, dec };