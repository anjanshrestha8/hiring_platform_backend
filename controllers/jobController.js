const Job = require("../models/Job");

exports.createJob = async (request,response) => {
  try {
    const job = await Job.create(request.body);
    response.status(200).json({
      data: job,
      message: "Job is created sucessfully.",
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      return response.status(400).json({ errors });
    }
    response.status(500).json({ error: "Internal server error." });
  }
};

exports.getAllJobs = async (request,response) => {
  try {
    const jobs = await Job.findAll();
    if (jobs.length < 1) {
      response.status(200).json({
        data: [],
        message: "No jobs to display.",
      });
    }
    response.status(200).json({
      data: jobs,
      message: "All jobs are displayed.",
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error." });
  }
}

exports.getJobsById = async (request, response) => {
  const id = request.params.id;

  if (!id) {
    response.status(400).json({
      data: [],
      message: "Bad Request. Param is missing!!!!",
    });
  }
  try {
    const job = await Job.findByPk(id);
    if (!job) {
      response.status(404).json({
        data: [],
        message: "Job not found!!!!",
      });
    }
    response.status(200).json({
      data: job,
      message: "Jobs is found!!!!",
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error." });
  }
};