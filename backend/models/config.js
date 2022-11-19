const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const configSchema = new Schema({
  Alien_Num: {
    type: String,
    required: false
  },
  Alien_Speed: {
    type: String,
    required: false
  },
  Alien_Attack_Range: {
    type: String,
    required: false
  },
  Mes_Speed: {
    type: String,
    required: false
  },
  Cowboy_Num: {
    type: String,
    required: false
  },
  cowBoy_Attack_Range: {
    type: String,
    required: false
  },
  Save_Title: {
    type: String,
    required: true
  }
}, { timestamps: true });

const ConfigSchme = mongoose.model('configs', configSchema);
module.exports = ConfigSchme;