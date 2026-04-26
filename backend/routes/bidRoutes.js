const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

router.post('/', bidController.submitBid);
router.get('/suppliers', bidController.getSuppliers);

module.exports = router;
