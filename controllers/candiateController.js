require('dotenv').config();
const { Candidate, Job, AiScreening } = require('../models/index');
const { Op } = require('sequelize'); // Added Sequelize Op import
const sendMail = require('../utils/mailer');
const screenCV = require('../services/aiScreeningService');
const crypto = require('crypto'); // Added crypto for secure token generation

exports.applyForJob = async (request, response) => {
  const { name, email, jobId, phone } = request.body;

  try {
    const job = await Job.findByPk(jobId);
    if (!job) {
      return response.status(404).json({ error: 'Job not found' });
    }

    if (!request.file) {
      return response.status(400).json({ error: 'CV file is required' });
    }

    const candidate = await Candidate.create({
      name,
      email,
      jobId,
      phone,
      cvLink: request.file.path,
    });

    // Email to HR
    await sendMail({
      to: process.env.EMAIL_USER,
      subject: `New Candidate Applied for ${job.title}`,
      text: `${name} has applied for the position of ${job.title}.`,
      html: `<p><strong>${name}</strong> has applied for the job <strong>${job.title}</strong>.</p>`,
    });

    // Email to Candidate
    await sendMail({
      to: email,
      subject: `Your application for ${job.title} is received`,
      text: `Hi ${name}, your application for ${job.title} has been successfully received.`,
      html: `<p>Hi <strong>${name}</strong>,<br/>We’ve received your application for the role of <strong>${job.title}</strong>. Thank you!</p>`,
    });

    response.status(201).json({
      message: 'Application submitted and emails sent',
      data: candidate,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map((e) => e.message);
      return response.status(400).json({ errors });
    }
    console.error(error);
    response.status(500).json({ error: 'Internal server error.' });
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
      include: [
        {
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
        {
          model: AiScreening,
          as: 'aiScreenings',
          attributes: ['decision', 'feedback', 'score', 'createdAt'],
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!candidate) {
      response.status(404).json({
        data: [],
        message: 'Candidates not found!!!!',
      });
    }

    const cvLink = candidate.cvLink
      ? `${request.protocol}://${request.get('host')}/${candidate.cvLink}`
      : null;

    response.status(200).json({
      message: 'Candidate fetched successfully',
      data: {
        ...candidate.toJSON(),
        cvLink,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Internal server error' });
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
    const candidate = await Candidate.findByPk(id, {
      include: {
        model: Job,
        attributes: ['title', 'company'],
      },
    });

    if (!candidate) {
      return response.status(404).json({
        data: [],
        message: 'Candidate not found!!!!',
      });
    }

    console.log(updatePayload);

    Object.keys(updatePayload).forEach((key) => {
      candidate[key] = updatePayload[key];
    });
    await candidate.save();

    response.status(200).json({
      data: candidate,
      message: 'Candidate is updated successfully.',
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    response.status(500).json({
      error: 'Internal server error.',
    });
  }
};

exports.approveCVAndSchedule = async (request, response) => {
  const { id } = request.params;

  try {
    const candidate = await Candidate.findByPk(id, {
      include: {
        model: Job,
        attributes: ['title', 'company'],
      },
    });

    if (!candidate) {
      return response.status(404).json({
        error: 'Candidate not found',
      });
    }

    // Update candidate status to approved
    await candidate.update({
      cvStatus: 'Passed',
      currentRound: 'Technical Interview',
    });

    // Send congratulations email
    await sendMail({
      to: candidate.email,
      subject: `Congratulations! CV Approved - ${
        candidate.Job?.title || 'Position'
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations!</h2>
          <p>Hi <strong>${candidate.name}</strong>,</p>
          <p>Great news! Your application for the position of <strong>${candidate.Job?.title}</strong> at <strong>${candidate.Job?.company}</strong> has passed our initial CV screening.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">Next Steps</h3>
            <p style="margin-bottom: 0;">Our HR team will contact you within <strong>2-3 business days</strong> to schedule your technical interview and provide you with the assessment details.</p>
          </div>
          
          <p><strong>What to expect:</strong></p>
          <ul>
            <li>Technical interview scheduling within 2-3 days</li>
            <li>Take-home technical assessment</li>
            <li>Clear instructions and timeline will be provided</li>
          </ul>
          
          <p>Thank you for your patience, and congratulations again on this important milestone!</p>
          <p>Best regards,<br/>HR Team<br/><strong>${candidate.Job?.company}</strong></p>
        </div>
      `,
    });

    response.status(200).json({
      message: 'CV approved and congratulations email sent successfully',
      data: {
        candidateId: candidate.id,
        cvStatus: 'Passed',
        currentRound: 'Technical Interview',
        emailSent: true,
      },
    });
  } catch (error) {
    console.error('Approve CV and schedule error:', error);
    response.status(500).json({ error: 'Failed to approve CV and send email' });
  }
};

exports.runAIScreening = async (request, response) => {
  try {
    const { id } = request.params;

    const candidate = await Candidate.findByPk(id);
    if (!candidate)
      return response.status(404).json({ error: 'Candidate not found' });

    const aiResult = await screenCV(candidate);

    const aiRecord = await AiScreening.create({
      candidateId: candidate.id,
      score: aiResult.score,
      decision: aiResult.decision,
      feedback: `Strengths: ${aiResult.strengths.join(
        ', '
      )} | Weaknesses: ${aiResult.weaknesses.join(', ')}`,
    });

    await candidate.update({
      cvStatus: aiResult.decision === "Pass" ? "Passed" : "Failed",
      currentRound:
        aiResult.decision === "Pass" ? "Technical Interview" : "Failed",
    });

    // await sendMail({
    //   to: candidate.email,
    //   subject: `AI Screening Result for ${candidate.name}`,
    //   text: `Your CV has been evaluated. Decision: ${aiResult.decision}, Score: ${aiResult.score}`,
    //   html: `<p><strong>${candidate.name}</strong>,<br/>Your CV has been evaluated. Decision: <strong>${aiResult.decision}</strong>, Score: <strong>${aiResult.score}</strong>.</p>`,
    // });

    // // Notify HR about completed assessment
    // await sendMail({
    //   to: process.env.EMAIL_USER,
    //   subject: `AI Screening Completed - ${candidate.name}`,
    //   text: `${candidate.name} has completed their AI screening. Decision: ${aiResult.decision}, Score: ${aiResult.score}.`,
    //   html: `<p><strong>${candidate.name}</strong> has completed their AI screening. Decision: <strong>${aiResult.decision}</strong>, Score: <strong>${aiResult.score}</strong>. Please review their submission in the HR dashboard.</p>`,
    // });

    response.status(200).json({
      message: 'AI screening completed',
      aiRecord,
    });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: err.message });
  }
};

exports.sendTechnicalAssessmentLink = async (request, response) => {
  const { id } = request.params;

  try {
    const candidate = await Candidate.findByPk(id, {
      include: {
        model: Job,
        attributes: ['title', 'company'],
      },
    });

    if (!candidate) {
      return response.status(404).json({ error: 'Candidate not found' });
    }

    // Check if candidate is eligible for technical assessment
    if (candidate.cvStatus !== 'Passed') {
      return response.status(403).json({
        error: 'Candidate is not eligible for technical assessment yet',
      });
    }

    const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-character room code
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await candidate.update({
      assessmentToken: roomCode, // Using existing field for room code
      assessmentTokenExpiry: tokenExpiry,
    });

    const assessmentLink = `${process.env.FRONTEND_URL}/technical-assessment/${candidate.id}`;

    await sendMail({
      to: candidate.email,
      subject: `Technical Assessment - ${candidate.Job?.title || 'Position'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Technical Assessment Invitation</h2>
          <p>Hi <strong>${candidate.name}</strong>,</p>
          <p>Congratulations! You have passed the CV screening for the position of <strong>${candidate.Job?.title}</strong> at <strong>${candidate.Job?.company}</strong>.</p>
          <p>You are now invited to take the technical assessment. Please use the following details:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Assessment Details</h3>
            <p><strong>Assessment Link:</strong> <a href="${assessmentLink}">${assessmentLink}</a></p>
            <p><strong>Room Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #dc3545; background-color: #fff; padding: 5px 10px; border: 2px solid #dc3545; border-radius: 4px;">${roomCode}</span></p>
          </div>
          
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Click the assessment link above</li>
            <li>Enter your personal details (Name, Email, Phone)</li>
            <li>Enter the Room Code: <strong>${roomCode}</strong></li>
            <li>Complete the technical assessment</li>
          </ol>
          
          <p><strong>Important Notes:</strong></p>
          <ul>
            <li>This room code is unique to you and expires in 24 hours</li>
            <li>You can only take the assessment once</li>
            <li>Make sure you have a stable internet connection</li>
            <li>The assessment is timed, so be prepared before starting</li>
          </ul>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br/>HR Team</p>
        </div>
      `,
    });

    response.status(200).json({
      message: 'Technical assessment link sent successfully',
      data: {
        candidateId: candidate.id,
        roomCode, // Include room code in response for HR reference
        tokenExpiry,
        linkSent: true,
      },
    });
  } catch (error) {
    console.error('Send technical assessment link error:', error);
    response.status(500).json({ error: 'Failed to send assessment link' });
  }
};

exports.saveAssessmentFormData = async (request, response) => {
  console.log(' Saving assessment form data:', request.body);

  try {
    const { name, email, phone, roomCode } = request.body;

    if (!name || !email || !roomCode) {
      console.log(' Missing required fields');
      return response.status(400).json({
        success: false,
        message: 'Name, email, and room code are required',
      });
    }

    // Create a temporary assessment session record
    const assessmentSession = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      roomCode: roomCode.trim(),
      sessionId: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      createdAt: new Date(),
    };

    console.log(' Assessment session created:', assessmentSession.sessionId);

    response.status(200).json({
      success: true,
      message: 'Assessment form data saved successfully',
      applicationId: assessmentSession.sessionId,
      sessionInfo: {
        name: assessmentSession.name,
        email: assessmentSession.email,
        phone: assessmentSession.phone,
        roomCode: assessmentSession.roomCode,
      },
    });
  } catch (error) {
    console.error(' Save form data error:', error);
    response.status(500).json({
      success: false,
      message: 'Internal server error while saving form data',
      error: error.message,
    });
  }
};

exports.verifyUserForAssessment = async (request, response) => {
  console.log(' Starting user verification with data:', request.body);

  try {
    const { name, email, phone, roomCode } = request.body;

    if (!name || !email || !roomCode) {
      console.log(' Missing required fields');
      return response.status(400).json({
        success: false,
        message: 'Name, email, and room code are required',
      });
    }

    console.log(' Searching for candidate with room code:', roomCode);

    let candidate = null;

    try {
      // First try exact name match with room code
      candidate = await Candidate.findOne({
        where: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          assessmentToken: roomCode,
          assessmentTokenExpiry: { [Op.gt]: new Date() },
        },
        include: {
          model: Job,
          attributes: ['title', 'company'],
          required: false,
        },
      });

      console.log(
        ' Exact name search result:',
        candidate ? 'Found' : 'Not found'
      );

      // If not found, try case-insensitive search
      if (!candidate) {
        candidate = await Candidate.findOne({
          where: {
            name: { [Op.like]: name.trim() },
            email: email.toLowerCase().trim(),
            assessmentToken: roomCode,
            assessmentTokenExpiry: { [Op.gt]: new Date() },
          },
          include: {
            model: Job,
            attributes: ['title', 'company'],
            required: false,
          },
        });
        console.log(
          ' Case-insensitive search result:',
          candidate ? 'Found' : 'Not found'
        );
      }
    } catch (dbError) {
      console.error(' Database query error:', dbError.message);
      return response.status(500).json({
        success: false,
        message: 'Database error during verification',
        error: dbError.message,
      });
    }

    if (!candidate) {
      console.log(' No candidate found with provided details');
      return response.status(404).json({
        success: false,
        message:
          "Invalid room code or candidate details don't match. Please check your information.",
      });
    }

    console.log(' Candidate found:', candidate.id);

    const currentStatus = candidate.technicalStatus || 'Pending';

    if (currentStatus === 'Completed') {
      console.log(' Assessment already completed');
      return response.status(409).json({
        success: false,
        message: 'You have already completed the technical assessment',
      });
    }

    if (phone && phone.trim() && candidate.phone !== phone.trim()) {
      try {
        await candidate.update({ phone: phone.trim() });
        console.log(' Phone updated successfully');
      } catch (phoneError) {
        console.log(' Phone update failed:', phoneError.message);
      }
    }

    try {
      await candidate.update({ technicalStatus: 'In Progress' });
      console.log(' Status updated to In Progress');
    } catch (statusError) {
      console.log(' Status update failed:', statusError.message);
    }

    console.log(' Verification successful for candidate:', candidate.id);

    response.status(200).json({
      success: true,
      message: 'User verified successfully',
      applicationId: candidate.id,
      candidateInfo: {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || phone || null,
        jobTitle: candidate.Job?.title || 'Unknown Position',
        company: candidate.Job?.company || 'Unknown Company',
      },
    });
  } catch (error) {
    console.error(' Verification error:', error);
    console.error(' Error stack:', error.stack);

    response.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error: error.message,
    });
  }
};

exports.submitTechnicalAssessment = async (req, res) => {
  const { candidateId } = req.params;
  const { userInfo, answers, testResults, timeSpent, completedAt } = req.body;

  try {
    // Try numeric ID first; fallback to session token
    let candidate;
    if (!isNaN(candidateId)) {
      candidate = await Candidate.findByPk(candidateId);
    } else {
      candidate = await Candidate.findOne({
        where: { sessionToken: candidateId },
      });
    }

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await candidate.update({
      technicalAssessment: {
        userInfo,
        answers,
        testResults,
        timeSpent,
        completedAt,
        submittedAt: new Date(),
        status: 'completed',
      },
      technicalStatus: 'Completed',
    });

    const job = await Job.findByPk(candidate.jobId);

    if (job) {
      await sendMail({
        to: candidate.email,
        subject: `Technical Assessment Submitted - ${job.title}`,
        text: `Hi ${candidate.name}, your technical assessment for ${job.title} has been successfully submitted.`,
        html: `<p>Hi <strong>${candidate.name}</strong>,<br/>Your technical assessment for <strong>${job.title}</strong> has been successfully submitted.</p>`,
      });

      await sendMail({
        to: process.env.EMAIL_USER,
        subject: `Technical Assessment Completed - ${candidate.name}`,
        text: `${candidate.name} has completed their technical assessment for ${job.title}.`,
        html: `<p><strong>${candidate.name}</strong> has completed their technical assessment for <strong>${job.title}</strong>.</p>`,
      });
    }

    return res.status(200).json({
      message: 'Technical assessment submitted successfully',
      data: {
        candidateId: candidate.id,
        submittedAt: new Date(),
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Technical assessment submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit technical assessment',
      details: error.message,
    });
  }
};

exports.getTechnicalAssessment = async (request, response) => {
  const { candidateId } = request.params;

  try {
    const candidate = await Candidate.findByPk(candidateId, {
      include: {
        model: Job,
        attributes: ['title', 'company'],
      },
    });

    if (!candidate) {
      return response.status(404).json({
        error: 'Candidate not found',
      });
    }

    if (!candidate.technicalAssessment) {
      return response.status(404).json({
        error: 'Technical assessment not found',
      });
    }

    response.status(200).json({
      message: 'Technical assessment retrieved successfully',
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
        },
        job: candidate.Job,
        assessment: candidate.technicalAssessment,
      },
    });
  } catch (error) {
    console.error('Get technical assessment error:', error);
    response.status(500).json({
      error: 'Failed to retrieve technical assessment',
    });
  }
};

exports.sendTechnicalAssessmentEmail = async (request, response) => {
  const { id } = request.params;
  const { interviewDate, interviewTime, instructions } = request.body;

  try {
    const candidate = await Candidate.findByPk(id, {
      include: {
        model: Job,
        attributes: ['title', 'company'],
      },
    });

    if (!candidate) {
      return response.status(404).json({ error: 'Candidate not found' });
    }

    // Check if candidate is eligible for technical assessment
    if (candidate.cvStatus !== 'Passed') {
      return response.status(403).json({
        error: 'Candidate is not eligible for technical assessment yet',
      });
    }

    const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await candidate.update({
      assessmentToken: roomCode,
      assessmentTokenExpiry: tokenExpiry,
      interviewDate: interviewDate,
      interviewTime: interviewTime,
    });

    const assessmentLink = `${process.env.FRONTEND_URL}/technical-assessment`;
    const interviewDateTime =
      interviewDate && interviewTime
        ? `${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}`
        : 'To be confirmed';

    await sendMail({
      to: candidate.email,
      subject: `Technical Interview Scheduled - ${
        candidate.Job?.title || 'Position'
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Technical Interview Scheduled</h2>
          <p>Hi <strong>${candidate.name}</strong>,</p>
          <p>Your technical interview has been scheduled for the position of <strong>${
            candidate.Job?.title
          }</strong> at <strong>${candidate.Job?.company}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Interview Details</h3>
            <p><strong>Date & Time:</strong> ${interviewDateTime}</p>
            <p><strong>Assessment Link:</strong> <a href="${assessmentLink}" style="color: #007bff;">${assessmentLink}</a></p>
            <p><strong>Room Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #dc3545; background-color: #fff; padding: 5px 10px; border: 2px solid #dc3545; border-radius: 4px;">${roomCode}</span></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Pre-Interview Instructions</h4>
            <p style="margin-bottom: 0;">${
              instructions ||
              'Please complete the take-home technical assessment before your scheduled interview. You will have up to 7 days to complete it.'
            }</p>
          </div>
          
          <p><strong>Assessment Instructions:</strong></p>
          <ol>
            <li>Click the assessment link above</li>
            <li>Enter your personal details (Name, Email, Phone)</li>
            <li>Enter the Room Code: <strong>${roomCode}</strong></li>
            <li>Complete the technical assessment</li>
            <li>Submit before your interview date</li>
          </ol>
          
          <p><strong>Important Notes:</strong></p>
          <ul>
            <li>This room code is unique to you and expires in 7 days</li>
            <li>You can only take the assessment once</li>
            <li>Make sure you have a stable internet connection</li>
            <li>The assessment is timed, so be prepared before starting</li>
            <li>Complete the assessment at least 24 hours before your interview</li>
          </ul>
          
          <p>If you have any questions or need to reschedule, please contact us immediately.</p>
          <p>Best regards,<br/>HR Team<br/><strong>${
            candidate.Job?.company
          }</strong></p>
        </div>
      `,
    });

    response.status(200).json({
      message:
        'Technical interview scheduled and assessment email sent successfully',
      data: {
        candidateId: candidate.id,
        roomCode,
        tokenExpiry,
        interviewDate,
        interviewTime,
        emailSent: true,
      },
    });
  } catch (error) {
    console.error('Send technical assessment email error:', error);
    response.status(500).json({
      error: 'Failed to schedule interview and send assessment email',
    });
  }
};
