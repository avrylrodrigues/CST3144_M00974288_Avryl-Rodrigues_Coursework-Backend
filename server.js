const express = require("express");
var path = require("path");
const app = express();
const cors = require('cors');

// Enable CORS for requests from the frontend
app.use(cors({
  origin: 'https://avrylrodrigues.github.io',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Set headers for CORS
app.use ((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

// Middleware to log date and method of the request
app.use(function(req, res, next){
    console.log("Request date: " + new Date());
    console.log("Request method: ", req.method)
    next();
});

app.use(express.json());

// Serve static files from the /static folder
app.use('/static', express.static(path.join(__dirname, 'static')));

// Sets the default port
app.set("port", 3000);

const MongoClient = require("mongodb").MongoClient;

let db;
// Connect to the database
MongoClient.connect("mongodb+srv://avrylrodrigues_db_user:LZqc5pTdiCZdpSv7@afterschoolclub.dku2hbd.mongodb.net/", (err, client) => {
    db = client.db("Lessons_DB")
})

// Root route
app.get("/", (req, res, next) => {
    res.send("Select a collection, e.g., /collection/messages")
})

// Middleware to handle collection name in the URL
app.param("collectionName", (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

// Gets all the documents in the collection
app.get("/collection/:collectionName", (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next (e)
            res.send(results)
    })
})

// Inserts a new document into a collection
app.post("/collection/:collectionName", (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next (e)
            res.send(results.ops)
    })
})

const ObjectID = require("mongodb").ObjectID;

// Gets a specific document
app.get("/collection/:collectionName/:id", (req, res, next) => {
    req.collection.findOne({_id: new ObjectID(req.params.id)}, (e, result) => {
        if (e) return next (e)
            res.send(result)
    })
})

// Updates a document
app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        {_id: new ObjectID(req.params.id)},
        {$set: req.body},
        {safe: true, multi: false},
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'});
        });
});

// Search feature
app.get("/search", (req, res, next) => {
    let q = req.query.q || "";
    const query = {
        $or: [
            { Subject: { $regex: q, $options: "i" } },
            { Location: { $regex: q, $options: "i" } },
            { Price: { $regex: q, $options: "i" } },
            { availableSeats: { $regex: q, $options: "i" } }
        ]
    };
    db.collection("Lessons").find(query).toArray((err, results) => {
        if (err) return next(err);
        res.send(results);
    });
});

// Error Handler
app.use(function(req, res){
    res.status(404);
    res.send("File not Found!");
});

// Start the server
const port = process.env.PORT || 3000
app.listen(port)
