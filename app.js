const express = require('express');
const cors = require('cors');
const app = express();
 console.log("Stack trace de require de express:", new Error().stack); 
 
app.use(cors());
app.options('*', cors());
app.use(express.json());

const carrosRouter = require('./routes/carros');
app.use('/api/carros', carrosRouter);

app.get('/api/test', (req, res) => {
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});


