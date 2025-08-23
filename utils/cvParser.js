const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const extractTextFromCV = async (filePath) => {
  const ext = filePath.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === "docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error("Unsupported CV format. Only PDF or DOCX allowed.");
  }
};

module.exports = extractTextFromCV;

