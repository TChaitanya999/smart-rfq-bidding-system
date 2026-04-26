const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');

router.post('/', rfqController.createRFQ);
router.get('/', rfqController.getRFQs);
router.get('/:id', rfqController.getRFQById);

module.exports = router;
