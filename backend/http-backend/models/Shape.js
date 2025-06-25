// models/Shape.js
const mongoose = require('mongoose');

const ShapeSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  type: { type: String, enum: ['rect', 'circle', 'square', 'triangle', 'arrow', 'text'], required: true },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  text: String,
  color: { type: String, default: 'white' }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shape', ShapeSchema);
