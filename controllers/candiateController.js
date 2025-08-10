const { Candidate, Job } = require('../models/index');
const sendMail = require('../utils/mailer');

exports.applyForJob = async (request, response) => {
   const { name, email,jobId } = request.body;
   console.log("thik xa nee",jobId);

   const job = await Job.findByPk(jobId);
   if (!job) {
    return response.status(404).json({ error: 'Job not found' });
   }
   console.log({job})

  try {
    const candidate = await Candidate.create(request.body);
      await sendMail({
        to: 'shresthaanjann17@gmail.com',
        subject: `New Candidate Applied for ${job.title}`,
        text: `${name} has applied for the position of ${job.title}.`,
        html: `<p><strong>${name}</strong> has applied for the job <strong>${job.title}</strong>.</p>`,
        // candidateId: candidate.id,
        // jobId: job.id,
      });

      await sendMail({
        to: email,
        subject: `Your application for ${job.title} is received`,
        text: `Hi ${name}, your application for ${job.title} has been successfully received.`,
        html: `<p>Hi <strong>${name}</strong>,<br/>We’ve received your application for the role of <strong>${job.title}</strong>. Thank you!</p>`,
        // candidateId: candidate.id,
        // jobId: job.id,
      });
          
    response.status(201).json(
      {
        message: "Application submitted and emails sent",
        data: candidate,
      });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      return response.status(400).json({ errors });
    }
     console.error(error);
    response.status(500).json({ error: "Internal server error." });
  }
};

exports.getAllCandidates = async (request, response) => {
  try {
    const candidates = await Candidate.findAll({
      include: {
        model: Job,
        attributes: ['title'],
      },
    });
    if (candidates.length < 1) {
      response.status(200).json({
        data: [],
        message: 'No candidates to display.',
      });
    }
    response.status(200).json({
      data: candidates,
      message: 'All candidates are displayed.',
    });
  } catch (error) {
    response.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getCandidatesById = async (request, response) => {
  const id = request.params.id;

  if (!id) {
    response.status(400).json({
      data: [],
      message: 'Bad Request. Param is missing!!!!',
    });
  }
  try {
    const candidate = await Candidate.findByPk(id, {
      include: {
        model: Job,
        attributes: [
          'title',
          'location',
          'requirements',
          'type',
          'company',
          'salary',
          'posted',
        ],
      },
    });
    if (!candidate) {
      response.status(404).json({
        data: [],
        message: 'Candidates not found!!!!',
      });
    }

    response.status(200).json({
      data: candidate,
      message: 'Candidate is found!!!!',
    });
  } catch (error) {
    response.status(500).json({ error: 'Internal server error.' });
  }
};

exports.updateCandidate = async (request, response) => {
  const { id } = request.params;
  const updatePayload = request.body;

  if (!id) {
    return response.status(400).json({
      data: [],
      message: 'Bad Request. Candidate ID is missing!!!!',
    });
  }

  try {
    const candidate = await Candidate.findByPk(id);
    if (!candidate) {
      return response.status(404).json({
        data: [],
        message: 'Candidate not found!!!!',
      });
    }

    Object.keys(updatePayload).forEach((key) => {
      candidate[key] = updatePayload[key];
    });
    await candidate.save();

    response.status(200).json({
      data: candidate,
      message: 'Candidate is updated successfully.',
    });
  } catch (error) {
    response.status(500).json({
      error: 'Internal server error.',
    });
  }
};
