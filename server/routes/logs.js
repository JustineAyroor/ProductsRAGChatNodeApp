const express = require("express");
const { getLogs } = require("../services/logger");

const router = express.Router();

router.get("/", (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "50", 10);
  res.json(getLogs({ page, limit }));
});

module.exports = router;
