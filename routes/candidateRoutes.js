const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candiateController');

router.post('/apply', candidateController.applyForJob);
router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidatesById);
router.patch('/:id', candidateController.updateCandidate);

module.exports = router;
