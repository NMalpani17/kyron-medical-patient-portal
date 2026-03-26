const express = require('express');
const router = express.Router();
const doctorRepository = require('../repositories/DoctorRepository');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/doctors', (req, res) => {
  const { keyword } = req.query;
  const doctors = keyword
    ? doctorRepository.findByKeyword(keyword)
    : doctorRepository.getAll();
  res.json(doctors);
});

router.get('/doctors/:id', (req, res, next) => {
  const doctor = doctorRepository.getById(req.params.id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    return next(err);
  }
  res.json(doctor);
});

module.exports = router;
