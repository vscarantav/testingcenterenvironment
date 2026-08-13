// On macOS, the Electron clipboard API is the same, so we just export the win32 one for now to avoid duplication.
// If deeper native integration (e.g. NSPasteboard monitoring) is needed, it goes here.
module.exports = require('../win32/clipboard');
