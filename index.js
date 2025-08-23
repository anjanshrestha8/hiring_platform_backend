const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
dotenv.config();
require("./models");

const sequelize = require('./config/db');
const candidateRoutes = require("./routes/candidateRoutes");
const jobRoutes = require("./routes/jobRoutes")
const EmailLog = require("./models/Email");
const PORT = process.env.SERVER_PORT || 5000

const path = require("path");
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);


sequelize.authenticate()
  .then(()=>console.log("Database is connected sucessfully!!!!!"))
  .catch(error => console.error('Database failed to connect.....:(', error));

sequelize.sync()
  .then(()=>console.log("Database is synced"))
  .catch(error => console.error("Database failed to sync:",error))

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.use("/api/candidates", candidateRoutes);
app.use("/api/jobs", jobRoutes);

app.listen(PORT,()=>{
  console.log(`Server is running at ${PORT}..........`)
})