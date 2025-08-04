const Candidate = require('../models/Candidate');
const Job = require("../models/Job");

Job.hasMany(Candidate,{ foreignKey: 'jobId' })
Candidate.belongsTo(Job, { foreignKey: "jobId" });

module.exports = {
  Candidate,
  Job,
};