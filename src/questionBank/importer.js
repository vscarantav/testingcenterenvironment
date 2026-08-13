const fs = require('fs');
const questionStore = require('./questionStore');

function importJSON(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) {
      data.forEach(q => questionStore.addQuestion(q));
      return { success: true, count: data.length };
    }
    return { success: false, error: 'Invalid format. Expected JSON array.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  importJSON
};
