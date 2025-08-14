const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Candidate = sequelize.define(
  "Candidates",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    cvFilePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentRound: {
      type: DataTypes.ENUM(
        "CV Screening",
        "Technical Interview",
        "HR Interview",
        "Completed"
      ),
      defaultValue: "CV Screening",
    },
    cvStatus: {
      type: DataTypes.ENUM("Pending", "Passed", "Failed"),
      defaultValue: "Pending",
    },
    techStatus: {
      type: DataTypes.ENUM("Pending", "Passed", "Failed"),
      defaultValue: "Pending",
    },
    hrStatus: {
      type: DataTypes.ENUM("Pending", "Passed", "Failed"),
      defaultValue: "Pending",
    },
    overallStatus: {
      type: DataTypes.ENUM("In Progress", "Rejected", "Selected"),
      defaultValue: "In Progress",
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "jobs", key: "id" },
    },
  },
  { timestamps: true }
);

module.exports = Candidate;
