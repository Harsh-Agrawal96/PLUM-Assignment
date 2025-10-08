const express = require('express');
const cors = require('cors');


const corsConfiguration = (app) => {

    app.use(cors());

}


module.exports = { corsConfiguration };