// Cargamos los modelos para usarlos posteriormente
const Patient = require('../models/patient');
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27006/bio_bbdd',{ useNewUrlParser: true, useUnifiedTopology: true })
    console.log('Connected to Mongo 1!')
  } catch (err) {
    console.log('Error connecting to Database: ' + err)
  }
})()

exports.list = async function() {
    let result= await Patient.find();
    return result;
}

exports.create = async function(body) {
    let patient = new Patient(body);
    let result= await patient.save();
    return result;
}