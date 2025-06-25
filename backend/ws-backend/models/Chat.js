const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: String, required: true }, // just store roomId string
}, {
  timestamps: true 
});

module.exports = mongoose.model('Chat', chatSchema);
