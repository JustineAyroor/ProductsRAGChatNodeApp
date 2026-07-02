const express = require("express");
const { MODELS } = require("../config/models");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(
    MODELS.map((m) => ({
      id: m.id,
      label: m.label,
    }))
  );
});

module.exports = router;
