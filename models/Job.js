const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Job = sequelize.define(
  "Job",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Full-time", "Part-time", "Contract", "Internship"),
      allowNull: false,
    },
    salary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.JSON, 
      allowNull: false,
    },
    responsibilities: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    benefits: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    posted: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "jobs",
    timestamps: true,
  }
);

module.exports = Job;
