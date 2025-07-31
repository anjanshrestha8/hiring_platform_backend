const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candiateController');

router.post("/", candidateController.createCandidate);
router.get("/", candidateController.getAllCandidates);

module.exports = router;