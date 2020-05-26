const findKey = require("lodash/findKey")

const charMap = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
}

function CP1252ToUCS2(cp) {
  return findKey(charMap, (item) => item === cp) || cp
}

function UCS2ToCP1252(cp) {
  return charMap[cp] || cp
}

function encodeChinese(str) {
  let content = ""
  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (char.codePointAt(0) >= 256) {
      const hex = char.codePointAt(0).toString(16) // '洛' to '6d1b'
      let low = parseInt(hex.slice(-2), 16) // 0x1b
      let high = parseInt(hex.slice(0, 2), 16) // 0x6d

      const internalChars = [
        0x00,
        0x0a,
        0x0d,
        0x20,
        0x22,
        0x24,
        0x40,
        0x5b,
        0x5c,
        0x7b,
        0x7d,
        0x7e,
        0x80,
        0xa3,
        0xa4,
        0xa7,
        0xbd,
        0x3b, // ; different from EU4, as CK2 use semicolon as delimiter
        0x5d, // ]
        0x5f, // _
        0x3d, // =
        0x21, // !
        0x23, // #
      ]

      let escapeChr = 0x10

      // escape internal characters
      if (internalChars.includes(high)) {
        escapeChr += 2
      }
      if (internalChars.includes(low)) {
        escapeChr++
      }

      const offset = 14

      switch (escapeChr) {
        case 0x11:
          low += offset
          break
        case 0x12:
          high -= 9
          break
        case 0x13:
          low += offset
          high -= 9
          break
        case 0x10:
        default:
          break
      }

      low = CP1252ToUCS2(low)
      high = CP1252ToUCS2(high)

      content += [escapeChr, low, high]
        .map((c) => String.fromCodePoint(c))
        .join("")
    } else {
      content += str[i]
    }
  }

  return content
}

function decodeChinese(str) {
  let content = ""
  for (let i = 0; i < str.length; i++) {
    const char = str[i].codePointAt(0)
    if (char >= 0x10 && char <= 0x13) {
      let high = str[i + 2].codePointAt(0)
      let low = str[i + 1].codePointAt(0)

      const offset = 14

      high = UCS2ToCP1252(high)
      low = UCS2ToCP1252(low)

      i += 2
      switch (char) {
        case 0x11:
          low -= offset
          break
        case 0x12:
          high += 9
          break
        case 0x13:
          low -= offset
          high += 9
          break
        case 0x10:
        default:
          break
      }
      const codePoint = [high, low]
        .map((l) => parseInt(l).toString(16))
        .map((l) => ("0" + l).slice(-2))
        .join("")

      content += String.fromCodePoint(parseInt(codePoint, 16))
    } else {
      content += str[i]
    }
  }
  return content
}

function generateNonceCode() {
  const charList = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ]

  let nonceStr = ""
  let nonceStrSize = 32

  for (let i = 0; i < nonceStrSize; i++) {
    const charIndex = Math.ceil(Math.random() * charList.length) - 1

    nonceStr += charList[charIndex]
  }

  return nonceStr
}

function exchangeHexToRgb(str) {
  let sColor = str.toLowerCase()
  //十六进制颜色值的正则表达式
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
  // 如果是16进制颜色
  if (sColor && reg.test(sColor)) {
    //处理六位的颜色值
    const sColorChange = []
    for (let i = 1; i < 7; i += 2) {
      sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)))
    }
    return sColorChange.join(" ")
  }
  return sColor
}

function recursivelyRemove(fs, path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = path + "/" + file
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        recursivelyRemove(fs, curPath)
      } else {
        // delete file
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

module.exports = {
  generateNonceCode,
  encodeChinese,
  decodeChinese,
  exchangeHexToRgb,
  recursivelyRemove,
}
