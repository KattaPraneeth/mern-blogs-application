const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const User = require('./models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const fs = require('fs')
const Post = require('./models/Post')
const uploadMiddleware = multer({ dest: 'uploads/' })
const dotenv = require('dotenv')


dotenv.config();
const app = express();

app.use(cors({credentials: true, origin: 'http://localhost:3000'}))
app.options('*', cors({
    credentials: true,
    origin: 'http://localhost:3000'
  }));

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname+'/uploads'));

mongoose.connect(process.env.MONGO_URI);

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

app.get('/', (req, res) => {
    res.send("All ok");
})
app.post('/register', async(req, res) => {
    const {username, password} = req.body;
    try{
        const userDoc = await User.create({
            username, 
            password: bcrypt.hashSync(password, salt)
        });
        res.json(userDoc);
    } catch(e){
        res.status(400).json(e);
    }
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc =await User.findOne({username})
    const passOk = bcrypt.compareSync(password, userDoc.password);
    // res.json(passOk);
    if(passOk){
        // logged in
        jwt.sign({username, id: userDoc._id}, secret, {}, (err, token) => {
            if(err) throw err;
            // console.log(token);
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('Wrong creds')
    }
})

app.get('/profile', (req, res) => {
    // console.log("This is profile route.");
    // console.log(req);
    const {token} = req.cookies
    jwt.verify(token, secret, {}, (err, info) => {
        if(err) throw err;
        res.json(info)
    })
    // res.json(req.cookies);
});

app.post('/logout', (req, res) => {
    res.cookie('token','').json('ok');
})

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath)
    // res.json({files: req.file});
    const {token} = req.cookies

    jwt.verify(token, secret, {}, async(err, info) => {
        if(err) throw err;
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });

        res.json(postDoc);
        // res.json(info)
    })    
})

app.get('/post', async (req, res) => {
    const posts = await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
    res.json(posts);
})

app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
})

app.delete('/post/:id', async(req, res) => {
    const {id} = req.params;
    await Post.deleteOne({_id: id})
    res.json('Deleted')
})

app.put('/post', uploadMiddleware.single('file'), async(req, res) => {
    // res.json(req.file);
    let newPath = null;
    // console.log(req.file);
    if(req.file){
        const {originalname, path} = req.file;
        const parts = originalname.split('.')
        const ext = parts[parts.length - 1];
        newPath = path+'.'+ext;
        fs.renameSync(path, newPath)
    }
    const {token} = req.cookies;

    jwt.verify(token, secret, {}, async(err, info) => {
        if(err) throw err;
        const {id, title, summary, content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        
        if(!isAuthor){
            return res.status(400).json('you are not the author');
        }
        
        Object.assign(postDoc, {
            title: title,
            summary: summary,
            content: content,
            cover: newPath ? newPath : postDoc.cover,
        })
        
        await postDoc.save();
        res.json(postDoc)
    });
});

app.listen(4000);


// kattapraneeth288
// o2xRGs2k3pjlqPMr

// mongodb+srv://kattapraneeth288:o2xRGs2k3pjlqPMr@cluster0.kmaukgk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
