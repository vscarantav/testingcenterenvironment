const fs = require('fs');
const path = require('path');

// NOTE: Using a flat JSON file for Phase 1 to bypass the native compilation issues 
// encountered with better-sqlite3 (due to missing VS Build Tools on the host).
// This provides the exact same API surface and can be swapped to SQLite in Phase 2.
const STORE_PATH = path.join(__dirname, '../../../sessions/questions.json');

class QuestionStore {
  constructor() {
    this.questions = [];
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        this.questions = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      } else {
        const dir = path.dirname(STORE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        this.save();
      }
    } catch (e) {
      console.error('Failed to init QuestionStore', e);
    }
  }

  save() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.questions, null, 2));
  }

  addQuestion(q) {
    q.id = q.id || Date.now().toString();
    this.questions.push(q);
    this.save();
    return q;
  }

  getQuestions() {
    return this.questions;
  }

  clear() {
    this.questions = [];
    this.save();
  }
}

module.exports = new QuestionStore();
