const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

app.get('/portfolio', (req, res) => {
  const data = fs.readFileSync('portfolio.json', 'utf8');
  res.json(JSON.parse(data));
});

app.get('/customers', (req, res) => {
  const data = fs.readFileSync('customers.json', 'utf8');
  res.json(JSON.parse(data));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));