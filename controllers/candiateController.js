const Candidate = require('../models/Candidate');

exports.createCandidate = async (request, response) => {
  try {
    const candidate = Candidate.create(request.body);
    response.status(200).json({
      data: candidate,
      message: "Candiate is created sucessfully.",
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.getAllCandidates = async (request, response) => {
  try {
    const candidates = await Candidate.findAll();
    response.status(200).json({
      data: candidates,
      message: "All candiates are displayed.",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};
