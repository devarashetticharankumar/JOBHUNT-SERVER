const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { jobSchema } = require("../validation/schemas");
const validate = require("../validation/validate");
const { date } = require("joi");

const nodemailer = require("nodemailer");

// Nodemailer transporter setup
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Modified /postjob route with email notification
router.post("/postjob", validate(jobSchema), async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  const subscriptionsCollection = db.collection("EmailSubscriptions");

  try {
    const body = req.body;
    body.createdAt = new Date();
    const result = await jobCollections.insertOne(body);

    // Retrieve all subscribed emails
    const subscribers = await subscriptionsCollection.find({}).toArray();
    const subscriberEmails = subscribers.map((subscriber) => subscriber.email);

    // Define email options
    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: subscriberEmails,
      subject: "New Job Posted!",
      text: `Hi there! A new job has been posted that might interest you: ${body.jobTitle}`,
      html: `
    <h1>New Job Opportunity: ${body.jobTitle}</h1>
    <h2>Company: ${body.companyName}</h2>
    <p>${body.description}</p>
    <p>For more details, visit our website at <a href="https://jobhunt4u.netlify.app" target="_blank">Job Hunt</a>.</p>
  `,
    };

    // Send email with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).send(result);
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).send({ message: "Server error", error });
  }
});

// Post a job
// router.post("/postjob", validate(jobSchema), async (req, res) => {
//   const db = req.app.locals.db;
//   const jobCollections = db.collection("demoJobs");
//   try {
//     const body = req.body;
//     body.createdAt = new Date();
//     const result = await jobCollections.insertOne(body);
//     res.status(200).send(result);
//   } catch (error) {
//     console.error("Error posting job:", error);
//     res.status(500).send({ message: "Server error", error });
//   }
// });

// Get all jobs
router.get("/all-jobs", async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  try {
    createdAt = new Date();
    const jobs = await jobCollections.find().toArray();
    const sortedJobPosts = jobs.sort((a, b) => b.createdAt - a.createdAt);
    res.send(sortedJobPosts);
  } catch (error) {
    console.error("Error getting all jobs:", error);
    res.status(500).send({ message: "Server error", error });
  }
});

// Get single job by ID
router.get("/all-jobs/:id", async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  try {
    const id = req.params.id;
    const job = await jobCollections.findOne({ _id: new ObjectId(id) });
    if (job) {
      res.send(job);
    } else {
      res.status(404).send({ message: "Job not found" });
    }
  } catch (error) {
    console.error("Error getting job:", error);
    res.status(500).send({ message: "Server error", error });
  }
});

// const nodemailer = require("nodemailer");

// // Configure Nodemailer
// const transporter = nodemailer.createTransport({
//   service: "Gmail", // or any other email service
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER, // your email
//     pass: process.env.EMAIL_PASS, // your email password
//   },
// });

// // Function to send email
// const sendEmailNotification = (to, subject, text) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text,
//   };

//   return transporter.sendMail(mailOptions);
// };

// // Get a single job by ID and send email notification
// router.get("/all-jobs/:id", async (req, res) => {
//   const db = req.app.locals.db;
//   const jobCollections = db.collection("demoJobs");
//   const subscriptionsCollection = db.collection("EmailSubscriptions");

//   try {
//     const id = req.params.id;
//     const job = await jobCollections.findOne({ _id: new ObjectId(id) });

//     if (job) {
//       // Find all subscribed emails
//       const subscribers = await subscriptionsCollection.find({}).toArray();
//       const emailList = subscribers.map((subscriber) => subscriber.email);

//       // Prepare the email notification content
//       const subject = `New Job Alert: ${job.title}`;
//       const text = `Hi,\n\nA new job has been posted that might interest you.\n\nJob Title: ${job.title}\nDescription: ${job.description}\n\nBest regards,\nYour Job Portal`;

//       // Send email notification to all subscribers
//       await Promise.all(
//         emailList.map((email) => sendEmailNotification(email, subject, text))
//       );

//       res.send(job);
//     } else {
//       res.status(404).send({ message: "Job not found" });
//     }
//   } catch (error) {
//     console.error("Error getting job:", error);
//     res.status(500).send({ message: "Server error", error });
//   }
// });

// Get jobs by email
router.get("/myJobs/:email", async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  try {
    const jobs = await jobCollections
      .find({ postedBy: req.params.email })
      .toArray();
    res.send(jobs);
  } catch (error) {
    console.error("Error getting jobs by email:", error);
    res.status(500).send({ message: "Server error", error });
  }
});

// Delete a job
router.delete("/job/:id", async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  try {
    const id = req.params.id;
    const result = await jobCollections.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.send({ message: "Job deleted successfully" });
    } else {
      res.status(404).send({ message: "Job not found" });
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).send({ message: "Server error", error });
  }
});

// Update a job
// router.patch("/update-job/:id", async (req, res) => {
//   const db = req.app.locals.db;
//   const jobCollections = db.collection("demoJobs");
//   try {
//     const id = req.params.id;
//     const jobData = req.body;
//     const result = await jobCollections.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: jobData },
//       { upsert: true }
//     );
//     if (result.matchedCount === 1) {
//       res.send({ message: "Job updated successfully" });
//     } else {
//       res.status(404).send({ message: "Job not found" });
//     }
//   } catch (error) {
//     console.error("Error updating job:", error);
//     res.status(500).send({ message: "Server error", error });
//   }
// });
router.patch("/update-job/:id", async (req, res) => {
  const db = req.app.locals.db;
  const jobCollections = db.collection("demoJobs");
  try {
    const id = req.params.id;
    const jobData = req.body;
    const result = await jobCollections.updateOne(
      { _id: new ObjectId(id) },
      { $set: jobData },
      { upsert: true }
    );

    if (result.matchedCount === 1) {
      res.send({ acknowledged: true, message: "Job updated successfully" });
    } else {
      res.status(404).send({ acknowledged: false, message: "Job not found" });
    }
  } catch (error) {
    console.error("Error updating job:", error);
    res
      .status(500)
      .send({ acknowledged: false, message: "Server error", error });
  }
});
module.exports = router;
