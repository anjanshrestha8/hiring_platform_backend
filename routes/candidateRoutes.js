const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candiateController');
const uploadCV = require('../middlewares/uploadCv');

router.post(
  '/apply',
  uploadCV.single('cvLink'),
  candidateController.applyForJob
);
router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidatesById);
router.patch('/:id', candidateController.updateCandidate);
router.post('/:id/screen-cv', candidateController.runAIScreening);

router.post(
  '/:id/approve-and-schedule',
  candidateController.approveCVAndSchedule
);

// Technical assessment routes
router.post(
  '/save-assessment-form',
  candidateController.saveAssessmentFormData
);
router.post(
  '/verify-for-assessment',
  candidateController.verifyUserForAssessment
);

router.post(
  '/:candidateId/technical-assessment',
  candidateController.submitTechnicalAssessment
);
router.get(
  '/:candidateId/technical-assessment',
  candidateController.getTechnicalAssessment
);

router.post(
  '/:id/send-technical-assessment',
  candidateController.sendTechnicalAssessmentEmail
);

module.exports = router;
