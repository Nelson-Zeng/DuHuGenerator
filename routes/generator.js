const express = require("express")
const fs = require("fs")
const router = express.Router()

const service = require("../services/generatorServices")

/* GET users listing. */
router.post("/", function (req, res, next) {
  // 不论下载是否成功都要清空临时文件
  function cleanTemp(path) {
    fs.unlinkSync(path)
  }

  service.dataGenerator(req.body).then((result) => {
    res.download(result, "duhu.zip", (err) => {
      if (err) {
        console.log("下载失败")
        cleanTemp(result)
      } else {
        console.log("下载成功")
        cleanTemp(result)
      }
    })
  })
})

module.exports = router
