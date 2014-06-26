var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongoskin');
var moment = require('moment');

// set up mongodb
var db = mongo.db('mongodb://localhost/chat');

// set up app
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app actions
app.get('/', function(req, res) {
    res.render('home.jade', {title: "Hello"});
});

app.post('/users', function(req, res) {
    res.render('post-users.jade');
});

app.get('/rooms', function(req, res) {
    db.collection('rooms').find().toArray(function(err, rooms){
        console.log(JSON.stringify(rooms));
        res.render('get-rooms.jade', {rooms: rooms});
    });
});

app.post('/room', function(req, res) {
    var data = {
        created: new Date(),
        users: [],
        panels: []
    };
    db.collection('rooms').insert(data, function(err, result) {
        console.log(result);
        res.redirect('/rooms', 301);
    });
});

app.get('/rooms/:id', function(req, res) {
    var id = req.params.id;
    db.collection('rooms').findById(id, function(err, room) {
        for (var i = 0; i < room.panels.length; i++) {
            var panel = room.panels[i];
            if (! panel.hasOwnProperty("emotion")) {
                panel.emotion = 'default';
            }
            if (panel.hasOwnProperty("created")) {
                panel.created =  new moment(panel.created.toString()).format("YYYY-MM-DD HH:mm");
            } else {
                panel.created = 'null';
            }
        }
        res.render('get-room.jade', {result: room});
    });
});

app.get('/rooms/:id/add-user', function(req, res) {
    var roomId = req.params.id;
    var userId = req.query.userId;
    var name = req.query.name;

    db.collection('rooms').findById(roomId, function(err, result) {
        var room = result;
        if (room.users.indexOf(name) == -1) {
            result.users.push(name);
        }

        db.collection('rooms').updateById(roomId, room, function(err, result) {
            res.render('get-room.jade', {result: room});
        });
    });
});

app.get('/rooms/:id/add-message', function(req, res) {
    var roomId = req.params.id;
    var userId = req.query.userId;
    var message = req.query.message;
    var emotion = req.query.emotion;

    db.collection('rooms').findById(roomId, function(err, result) {
        var room = result;
        room.panels.push({
            userId: userId,
            message: message,
            created: new Date(),
            emotion: emotion
        });
        db.collection('rooms').updateById(roomId, room, function(err, result) {
            app.render("message.jade", {message: "added message to room"});
        });
    });
});



// add default error routes
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = app.listen(3000, function() {
    console.log('Running app at: http://localhost:%d/', server.address().port);
});