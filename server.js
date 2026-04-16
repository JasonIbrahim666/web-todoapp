const express = require('express');
const app = express();
const validator = require('validator');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const port = 3100;
const fs = require('fs');
const {Loadtask} = require('./utils/app');
const bcrypt = require('bcrypt');
const Filestore = require('session-file-store')(session);
const path = require('path');

app.use(express.static('public'));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.urlencoded ({ extended: true }));
app.set('layout', 'layouts/main');

if(!fs.existsSync('./sessions')){
    fs.mkdirSync('./sessions');
};

app.use(session({
    store: new Filestore({
        path: path.join(__dirname, 'sessions')
    }),
    secret: 'abcdefuck',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60,
    }
}));

app.use((req, res ,next)=>{
    console.log('session id: ', req.sessionID);
    console.log('session data: ', req.session);
    next();
});

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

function isauth(req, res, next){
    console.log('USER SESSION', req.session.user);

    if(!req.session.user) {
        return res.redirect('/login')
    }
    next();
}

app.get('/', (req, res)=>{
    res.render('register', {
        title: 'form register',
    });
});

app.post('/register', (req, res)=>{
    let eror = [];
    const {username, password} = req.body;
    const hashedpassword = bcrypt.hashSync(password, 10);

    if(!validator.isLength(username, {min: 3})){
        eror.push('username minimal 3 karakter')
    }

    if(!validator.isAlphanumeric(username)){
        eror.push('username hanya boleh angka dan huruf')
    }

    if(!validator.isLength(password, {min: 5})){
        eror.push('password minimal 5 karakter')
    }

    
    const data = fs.readFileSync('./data/akun.json', 'utf-8')
    const json = JSON.parse(data);
    
    let dataexist = json.find(u => u.username === username);
    if(dataexist){
        eror.push('username sudah digunakan!')
    }

    if(eror.length > 0) {
        return res.render('register', {
            title: 'form register',
            eror,
        })
    }
    console.log('lolos validasi');
    console.log('data sebelum save', json)

    json.push({
        id: Date.now(),
        username,
        password: hashedpassword,
        
    });

    fs.writeFileSync('./data/akun.json', JSON.stringify(json));
    console.log('data tersimpan')
    res.redirect('/success');
});

app.get('/success', (req, res)=>{
    res.render('ToLogin', {
        title: 'register berhasil'
    });
});

app.get('/login',(req, res) => {

    const data = fs.readFileSync('./data/akun.json', 'utf-8');
    const json = JSON.parse(data);

    res.render('login', {
        title: 'form login',
        // datas : json,
    });
});

app.post('/login', (req, res)=>{
    const {username, password} = req.body

    const file = fs.readFileSync('./data/akun.json', 'utf-8');
    const json = JSON.parse(file);

    const user = json.find(u => u.username === username);

    if(!user || !bcrypt.compareSync(password, user.password)){
        return res.render('login', {
            title: 'form login',
            eror: 'login gagal / akun tidak ditemukan',
        });
    }

    req.session.user = user;

    req.session.save(()=>{
        res.redirect('/ToDoApp');
    });
});

app.get('/ToDoApp', isauth, (req, res)=>{
    const alltask = Loadtask();
    const task = alltask.filter(t => t.username === req.session.user.username);

    res.render('ToDoApp', {
        title: 'todoapp',
        task,
    });
});

app.get('/add', isauth, (req, res)=>{
    res.render('add', {
        title: 'tambah tugas'
    });
});

app.post('/add', isauth, (req, res)=>{
    const {tugas} = req.body;

    const file = fs.readFileSync('./data/task.json', 'utf-8');
    const json = JSON.parse(file);

    json.push({
        id: Date.now(),
        username: req.session.user.username,
        tugas,
    });

    fs.writeFileSync('./data/task.json', JSON.stringify(json));

    res.redirect('/ToDoApp');
});

app.post('/delete/:id', isauth, (req, res)=>{
    const {id} = req.params;
    const file = fs.readFileSync('./data/task.json', 'utf-8');
    let json = JSON.parse(file);

    json = json.filter(t => 
        t.id != id || t.username !== req.session.user.username);

    fs.writeFileSync('./data/task.json', JSON.stringify(json));
    

    res.redirect('/ToDoApp');
});

app.get('/logout', (req, res) => {
    req.session.destroy((err)=>{
        if(err){
            return res.redirect('/ToDoApp')
        }

        res.clearCookie('connect.sid')
        res.redirect('/login')
    });
});

app.listen(port, ()=>{
    console.log(`server running in http://localhost:${port}`)
});

