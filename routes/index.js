const express = require("express");
const router = express.Router();
const candidateRoutes = require("./candidateRoutes");
const jobRoutes = require("./jobRoutes")

router.use("/candidates", candidateRoutes);
router.use("/jobs", jobRoutes);


module.exports = router;