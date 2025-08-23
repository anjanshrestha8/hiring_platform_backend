const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candiateController");
const uploadCV = require('../middlewares/uploadCv');

router.post("/apply", uploadCV.single("cv"), candidateController.applyForJob);
router.get("/", candidateController.getAllCandidates);
router.get("/:id", candidateController.getCandidatesById);
router.patch("/:id", candidateController.updateCandidate);
router.post("/:id/screen-cv", candidateController.runAIScreening);


module.exports = router;
