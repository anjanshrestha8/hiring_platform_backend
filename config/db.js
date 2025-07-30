const {Sequelize} = require('sequelize');
require('dotenv').config();
console.log('DB HOST:', process.env.DB_HOST); // should print 127.0.0.1


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
  }
);

(async() =>{
  try{
    await sequelize.authenticate();
    console.log("Data base is connected sucessfully..")
  }catch(error){
    console.log("Unable to connect to data base:",error.message)
  }
});

module.exports = sequelize;