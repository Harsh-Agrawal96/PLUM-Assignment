const express = require('express');
const { corsConfiguration : initializeCors } = require('./src/config/corsConfig.js');
const { router } = require('./src/routes/upload.js');


// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;


initializeCors(app);


app.use('/', router);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});