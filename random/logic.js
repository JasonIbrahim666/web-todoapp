const express = require('express');
const app = express();
const port = 3500;


app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'halo'})
});


app.listen(port, ()=> {
    console.log(`server jalan di ${port}`)
});


