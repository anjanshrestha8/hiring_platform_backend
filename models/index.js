const Candidate = require('../models/Candidate');
const Job = require("../models/Job");
const AiScreening = require("../models/AiScreening")

Job.hasMany(Candidate,{ foreignKey: 'jobId' })
Candidate.belongsTo(Job, { foreignKey: "jobId" });

Candidate.hasMany(AiScreening, {
  foreignKey: "candidateId",
  as: "aiScreenings",
});
AiScreening.belongsTo(Candidate, { foreignKey: "candidateId" });

module.exports = {
  Candidate,
  Job,
  AiScreening,
};