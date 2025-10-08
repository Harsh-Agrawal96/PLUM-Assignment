const express = require('express');
const { billHandleController } = require('../controller/billExtraction.js');
const { upload } = require('../config/multerConfig.js');


const router = express.Router();

router.post('/api/extract', upload.single('billImage'), billHandleController);


module.exports = {
    router
};