const express = require("express")
const router = express.Router()
const configController = require('../controllers/configController');

router.get('/', configController.config_get);
router.post('/', configController.config_post);
router.get('/:id', configController.config_details);

module.exports = router;

