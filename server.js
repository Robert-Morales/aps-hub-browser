const express = require('express');
const session = require('cookie-session');
const {PORT, SERVER_SESSION_SECRET} = require('./config.js');


let app = express();

app.use(express.static('wwwroot'));
app.use(session({secret:SERVER_SESSION_SECRET,Cursoaps:"CURSO APS"}));
app.use(require('./routes/auth.js'));
app.use(require('./routes/hubs.js'));
app.listen(PORT, () => console.log(`server listening on port ${PORT}...`));
