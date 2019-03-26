const bcrypt = require( "bcryptjs" );
const bodyParser = require( "body-parser" );
const express = require( "express" );
const fs = require( "fs" );
const jwt = require( "jwt-simple" );
const mongodb = require( "mongodb" );
const spdy = require( "spdy" );
const MongoClient = mongodb.MongoClient;
const Server = mongodb.Server;
const app = express();

app.use( bodyParser.json() );

const PORT = 8443;
const mongo_ip = "192.168.1.9"

const secretKey = "secretKey";

/**
 * Registers a driver, placing them in a Mongo DB.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {Object} resp - The response
 */
app.post( "/alleys/auth/register", async ( reqt, resp ) => {
    try {
        // Handle data
        const u = reqt.body.username;
        const p = reqt.body.password;

        // Create connection
        const svr = new Server( mongo_ip, 27017 );
        const con = await MongoClient.connect( svr );
        const col = con.db( "alleys" ).collection( "auth" );

        // Register user
        const reg = await col.updateOne({ username : u },
                                        { $set : { password : p} },
                                        { upsert : true }
        );
        con.close(); // Close connection
        resp.status( 204 ).end(); // No Content
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

/**
 * Logs the driver in, returning a valid token if successful.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {Object} resp - The response
 */
app.post( "/alleys/auth/issue/:username", async ( reqt, resp ) => {
    try {
        // Handle data
        const u = reqt.params.username
        const p = reqt.body.password

        // Create connection
        const svr = new Server( mongo_ip, 27017 );
        const con = await MongoClient.connect( svr );
        const col = con.db( "alleys" ).collection( "auth" );

        // Find user
        const doc = await col.findOne( { username : u } );
        
        if ( doc ) {
            // Compare passwords
            const vld = await bcrypt.compareSync( p, doc.password );

            if ( vld ) {
                // Create token
                const uid = { username : u };
                const tkn = jwt.encode( uid, secretKey );
                resp.status( 200 ).json( tkn ).end(); // OK
            } else {
                // Password mismatch
                resp.status( 401 ).end(); // Unauthorised
            }
        } else {
            // Couldn't find document
            resp.status( 401 ).end(); // Unauthorised
        }
        con.close();
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 500 ).end(); // Internal Server Error
    }
});

/**
 * Decodes a token, if its valid returns username
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.get( "/alleys/auth/session", async ( reqt, resp ) => {
    try {
        // Decode token into uid
        const tkn = reqt.headers[ "x-auth" ]
        const uid = jwt.decode( tkn, secretKey )
        resp.status( 200 ).json( uid ).end(); // OK
    } catch ( exception ) {
        console.log(exception) // Log the error
        resp.status( 401 ).end(); // Unauthorised
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
