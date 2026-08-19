const express = require('express');
const registrationController = require('../controllers/registrationController');

const router = express.Router();

router.post('/', registrationController.createRegistration);

module.exports = router;
