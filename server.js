const express = require('express');
const path = require('path');
const app = express();

const PUBLIC = path.join(__dirname, 'public');
app.use(express.static(PUBLIC));

// DODAJ: serwuj node_modules pod /node_modules aby przeglądarka mogła importować moduły ES
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serwer działa: http://localhost:${port}`);
});
