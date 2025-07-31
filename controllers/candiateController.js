const Candidate = require('../models/Candidate');

exports.createCandidate = async (request, response) => {
  try {
    const candidate = await Candidate.create(request.body);
    response.status(200).json({
      data: candidate,
      message: "Candiate is created sucessfully.",
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      return res.status(400).json({ errors });
    }
    response.status(500).json({ error: "Internal server error." });
  }
};

exports.getAllCandidates = async (request, response) => {
  try {
    const candidates = await Candidate.findAll();
    if(candidates.length < 1){
      response.status(200).json({
        data: [],
        message: "No candidates to display."
      })
    }
    response.status(200).json({
      data: candidates,
      message: "All candiates are displayed.",
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error." });
  }
};

exports.getCandidatesById = async (request,response) => {
  const id = request.params.id;

  if(!id){
    response.status(400).json({
      data:[],
      message: "Bad Request. Param is missing!!!!"
    });
  }
  try {
    const candidate = await Candidate.findByPk(id);
    if(!candidate){
       response.status(404).json({
         data: [],
         message: "Candidates not found!!!!",
       });
    }
    response.status(200).json({
      data: candidate,
      message: "Candidate is found!!!!"
    })
    
  } catch (error) {
    response.status(500).json({ error: "Internal server error." });
  }
}
