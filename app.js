var bodyParser   = require('body-parser');
var express      = require('express');
//var exphbs     = require('express-handlebars');
var mongoose     = require('mongoose');
var path         = require('path');
var session      = require('express-session');
var jsonwebtoken = require('jsonwebtoken');
var index        = require('./routes/index');
var users        = require('./routes/users');
var projects     = require('./routes/projects');
var issues       = require('./routes/issues');
var members       = require('./routes/members');

const logger     = require('./helpers/logger');
const cors       = require('cors');

var fileUpload = require('express-fileupload');


const TEAM_MANAGER_MONGODB_URI = process.env.TEAM_MANAGER_MONGODB_URI;
const TEAM_MANAGER_PORT        = process.env.TEAM_MANAGER_PORT;
const SECRET_KEY               = process.env.TEAM_MANAGER_SECRET_KEY;


//----------------------------------------------------------------------------
//  SETUP APP
//----------------------------------------------------------------------------
var app = express();
app.use(cors());


app.use(fileUpload());


app.set('views', path.join(__dirname, 'views'));
//app.engine('handlebars', exphbs({defaultLayout: 'main', extname: '.html'}));
//app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(session({secret: "Your secret key"}));


//-----------------------------------------------------
//   APP ROUTES
//-----------------------------------------------------

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/views/" + "index.html" );
})

app.get('/test_verified_page', function (req, res) {
    res.sendFile(__dirname + "/public/views/pages/" + "verification_done.html" );
})

app.get('/file_upload', function (req, res) {
    res.sendFile(__dirname + "/public/views/general/" + "file_upload.html" );
})

app.post('/file_upload', function (req, res) {

    if (!req.files)
    return res.status(400).send('No files were uploaded.');

// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  var sampleFile = req.files.sampleFile;

  console.log("sampleFile: " + sampleFile.name);

  var filePath = "./" + sampleFile.name;
 
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(filePath, function(err) {
    if (err)
      return res.status(500).send(err);
 
    res.send('File uploaded!');
  });

})

//---------------------------------------------------
// url ignore list for token validation middleware
//---------------------------------------------------
var ignore_list = [
    '/users/signup', '/users/login', 'file_upload',
    '/favicon.ico'    
];

//----------------------------------------------------------------------------
//   TOKEN VALIDATION
// 
//   This is middleware function with no mount path. 
//   The function is executed every time the app receives a request.
//   NOTE - register this middleware before registering routes
//----------------------------------------------------------------------------

app.use(function(req, res, next){

    logger.debug("api.use() :: Got some request, validating token, req=" + req.originalUrl);


    // if url is in ignore list, move onto next()
    if (ignore_list.indexOf(req.originalUrl) > -1) {
        return next();
    }

    if(req.originalUrl.indexOf('/members/verify/') > -1) {
        return next();
    }

    if(req.originalUrl.indexOf('/issues/verify/') > -1) {
        return next();
    }

    if(req.originalUrl.indexOf('/users/verify/') > -1) {
        return next();
    }

    if(req.originalUrl.indexOf('/projects/verify/') > -1) {
        return next();
    }


    var token = req.body.token || req.params.token || req.headers['x-access-token'];

    if(token) {

        jsonwebtoken.verify(token, SECRET_KEY, function(err, decoded){

            if(err) {
                res.status(403).send({success: false, message: "Failed to authenticate user"});
                logger.warn("api.use() :: :: Failed to authenticate user");
            } else {
                req.decoded = decoded;
                logger.debug("api.use() :: -> decoded: " + JSON.stringify(req.decoded) );
                next();
            } 	
        });

    } else {
        logger.warn("api.use() :: No token provided");
        res.status(403).send({success: false, message: "No token provided"});
    }
});//use


//----------------------------------------------------------------------------
// adding routers
//----------------------------------------------------------------------------
app.use('/',          index);
app.use('/users',     users);
app.use('/projects',  projects);
app.use('/issues',    issues);
app.use('/members',   members);

app.get('/time', function(request, response) {

   var d = new Date();
   res.send("Current Date: " + d);

});


//----------------------------------------------------------------------------
//   CONNECT TO MONGODB
//----------------------------------------------------------------------------
mongoose.Promise = global.Promise;
mongoose.connection.openUri(TEAM_MANAGER_MONGODB_URI, function(err) {
    if(err) {
        logger.warn("Failed to connect to database: " + err);
    } else {
        logger.info("Successfully connected to database. ");
    }
});


//----------------------------------------------------------------------------
//                    START SERVER 
//----------------------------------------------------------------------------
var server = app.listen(process.env.PORT || TEAM_MANAGER_PORT, function (err) {

    if(err) {
        console.log(err);
    } else {

        var host = server.address().address
            var port = server.address().port

            logger.info("Team Manager server listening at http://%s:%s", host, port)
    }
})
