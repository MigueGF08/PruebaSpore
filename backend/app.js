const express = require('express');
const cors = require('cors');
const app = express();
 console.log("Stack trace de require de express:", new Error().stack); 
 
app.use(cors());
app.options('*', cors());
app.use(express.json());

const carrosRouter = require('./routes/carros');
app.use('/api/carros', carrosRouter);

const setupSwagger = require('./swagger');
setupSwagger(app);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});