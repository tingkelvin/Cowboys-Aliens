const router = require("express").Router();
const path = require("path");

router.use(function (req, res) {
  //   console.log(path.join(__dirname, "../index.html"));
  res.sendFile(path.join(__dirname, "../index.html"));
});

module.exports = router;
