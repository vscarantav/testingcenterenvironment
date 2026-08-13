const fs = require('fs');
const questionStore = require('./questionStore');

function exportJSON(destinationPath) {
  try {
    const questions = questionStore.getQuestions();
    fs.writeFileSync(destinationPath, JSON.stringify(questions, null, 2));
    return { success: true, count: questions.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  exportJSON
};
