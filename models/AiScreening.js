const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Candidate = require("./Candidate");

const AiScreening = sequelize.define(
  "AiScreenings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Candidates", key: "id" },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    decision: {
      type: DataTypes.ENUM("Pass", "Fail"),
      allowNull: false,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  { timestamps: true }
);



module.exports = AiScreening;
