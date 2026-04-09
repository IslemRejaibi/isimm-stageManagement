const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  matricule: { type: String, unique: true, required: true },
  utilise:   { type: Boolean, default: false }, // devient true après inscription
});
module.exports = mongoose.model('MatriculeAutorise', schema);