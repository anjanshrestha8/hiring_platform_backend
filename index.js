const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
dotenv.config();

const sequelize = require('./config/db');
const candidateRoutes = require("./routes/candidateRoutes");

sequelize.authenticate()
  .then(()=>console.log("Database is connected sucessfully!!!!!"))
  .catch(error => console.error('Database failed to connect.....:(', error));

sequelize.sync({alter:true})
  .then(()=>console.log("Database is synced"))
  .catch(error => console.error("Database failed to sync:",error))

const PORT = process.env.SERVER_PORT || 5000
app.use(cors());
app.use(express.json());

app.use("/api/candidates", candidateRoutes);

app.listen(PORT,()=>{
  console.log(`Server is running at ${PORT}..........`)
})