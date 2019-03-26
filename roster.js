const bodyParser = require( "body-parser" );
const express = require( "express" );
const fs = require( "fs" );
const mongodb = require( "mongodb" );
const spdy = require( "spdy" );
const request = require("request");
const MongoClient = mongodb.MongoClient;
const Server = mongodb.Server;
const app = express();

app.use( bodyParser.json() );

const PORT = 8442;
const mongo_ip = "192.168.1.8"

/**
 * Places a driver in the roster Mongo DB with a specified
 * rate, if a valid token is passed in the header.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.rate - The drivers rate
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.put( "/alleys/roster/join", async ( reqt, resp ) => {
    try {
        // Handle token
        const tkn = reqt.headers['x-auth'];
        
        request.get({
            uri : "https://192.168.1.4:8443/alleys/auth/session",
            headers : {'x-auth' : tkn},
            json: true,
            agentOptions : { rejectUnauthorized : false}
        }, async (error, response, body) => {
            if (!error) {
                // Handle response
                if (body.username == reqt.body.username){
                    // Join roster
                    const user = reqt.body.username;
                    const r = reqt.body.rate;

                    // Create connection
                    const svr = new Server( mongo_ip, 27017 );
                    const con = await MongoClient.connect( svr );
                    const col = con.db( "alleys" ).collection( "roster" );

                    // Insert driver
                    const add = await col.updateOne({ username : user},
                                                    {$set : {username : user,
                                                             rate : r} },
                                                    { upsert : true });
                    con.close(); // Close connection
                    resp.status( 204 ).end(); // No Content
                } else {
                    // Usernames dont match
                    resp.status( 401 ).end(); // Unauthorised
                }
            } else {
                // Handle error
                console.log(error);
                resp.status( 401 ).end() // Unauthorised
            }
        });     
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

/**
 * Removes a driver in the roster Mongo DB,
 * if a valid token is passed in the header.
 * @function
 * @param {Object} req - The request
 * @param {String} req.body.username - The drivers username
 * @param {String} req.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.delete( "/alleys/roster/leave", async ( reqt, resp ) => {
    try {
        // Handle token
        const tkn = reqt.headers['x-auth'];

        request.get({
            uri : "https://192.168.1.4:8443/alleys/auth/session",
            headers : {'x-auth' : tkn},
            json: true,
            agentOptions : { rejectUnauthorized : false}
        }, async (error, response, body) => {
            if (!error) {
                // Handle response
                if (body.username == reqt.body.username){
                    // Leave roster
                    const user = reqt.body.username;

                    // Create connection
                    const svr = new Server( mongo_ip, 27017 );
                    const con = await MongoClient.connect( svr );
                    const col = con.db( "alleys" ).collection( "roster" );

                    // Delete driver
                    const del = await col.deleteOne( { username : user })
                    con.close(); // Close connection
                    resp.status( 204 ).end(); // No Content
                } else {
                    // Usernames dont match
                    resp.status( 401 ).end(); // Unauthorised
                }
            } else {
                // Handle error
                console.log(error);
                resp.status( 401 ).end(); // Unauthorised
            }
        });
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

/**
 * Changes the rate of a driver in the roster Mongo DB,
 * if a valid token is passed in the header.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.put("/alleys/roster/change", async(reqt, resp) => {
    try{
        // Handle token
        const tkn = reqt.headers['x-auth'];

        request.get({
            uri : "https://192.168.1.4:8443/alleys/auth/session",
            headers : {'x-auth' : tkn},
            json: true,
            agentOptions : { rejectUnauthorized : false}
        }, async (error, response, body) => {
            if (!error) {
                // Handle response
                if (body.username == reqt.body.username){
                    // Change rate
                    const user = reqt.body.username;
                    const r = reqt.body.rate;

                    // Create connection
                    const svr = new Server(mongo_ip, 27017);
                    const con = await MongoClient.connect( svr );
                    const col = con.db("alleys").collection("roster");

                    // Update rate
                    const update = await col.updateOne({username : user},
                                                       {$set : {rate : r }},
                                                       {upsert: false})
                    con.close() // Close connection
                    resp.status(204).end(); // No Content
                } else {
                    // Usernames dont match
                    resp.status( 401 ).end(); // Unauthorised
                }
            } else {
                // Handle error
                console.log(error); // Log the error
                resp.status( 401 ).end(); // Unauthorised
            }
        });
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

/**
 * Calulates the number of drivers in the roster Mongo DB
 * and which driver is the cheapest
 * @function
 * @param {Object} reqt - The request
 * @param {Object} resp - The response
 */
app.get( "/alleys/roster/rates", async ( reqt, resp ) => {
    try {
        // Create connection
        const svr = new Server( mongo_ip, 27017 );
        const con = await MongoClient.connect( svr );
        const col = con.db( "alleys" ).collection( "roster" );
        
        // Get number of drivers in roster
        const num = await col.countDocuments();

        // Get cheapest driver
        var bestrates = await col.distinct("rate");
        var bestrate = bestrates.sort(function(a,b){ return a-b})[0];
        var bestDriver = await col.findOne({"rate" : bestrate})

        con.close(); // Close connection

        
        if ( num && bestDriver ) {
            // Create return document
            const doc = {
                'numdrivers' : num,
                'rate' : bestDriver.rate,
                'name' : bestDriver.username
            }
            resp.status( 200 ).json( doc ).end(); // OK
        } else {
            resp.status( 404 ).end(); // Not Found
        }
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

// Start listening on specified port. 
const server = spdy.createServer( {
    key : fs.readFileSync( "key.pem" ),
    cert : fs.readFileSync( "cert.pem" )
    }, app );

server.listen( PORT, () => {
    console.log( `listening on port ${PORT}...` )
});
