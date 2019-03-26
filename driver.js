const bodyParser = require( "body-parser" );
const express = require( "express" );
const fs = require( "fs" );
const spdy = require( "spdy" );
const request = require("request");
const bcrypt = require("bcryptjs");
const app = express();

app.use( bodyParser.json() );

const PORT = 8441;

/**
 * Registers a driver via the authentication service
 * placing them in a Mongo DB.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {Object} resp - The response
 */
app.post("/alleys/driver/register", async ( reqt, resp ) => {
    
    try {
        // Handle data
        const user = reqt.body.username;
        const pass = reqt.body.password;

        // Hash the password
        const hash = await bcrypt.hashSync( pass, 10 );

        request.post({
            uri : "https://192.168.1.4:8443/alleys/auth/register",
            json: true,
            body: {username: user, password : hash},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                resp.status( 204 ).end(); // No Content
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
 * Logs the driver in with the authentication service
 * Returns an alive token if succesful.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {Object} resp - The response
 */
app.post("/alleys/driver/login", async (reqt, resp) => {
    try {
        // Handle data
        const user = reqt.body.username;
        const pass = reqt.body.password;

        request.post({
            uri : "https://192.168.1.4:8443/alleys/auth/issue/"+user,
            json: true,
            body: {username: user, password : pass},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                var token = body;
                if (token) {
                    resp.status( 200 ).json({token : token}).end(); // No Content
                } else {
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
})

/**
 * Places a driver in the roster Mongo DB with a specified
 * rate, if a valid token is passed in the header.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.post( "/alleys/driver/join", async ( reqt, resp ) => {
    try {
        // Handle data
        const user = reqt.body.username;
        const rate = reqt.body.rate;
        const tkn  = reqt.headers[ "x-auth" ];

        request.put({ // Join roster
            uri : "https://192.168.1.3:8442/alleys/roster/join",
            json: true,
            headers : {'x-auth' : tkn},
            body: {username : user, rate : rate},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                if (response.statusCode == 204) {
                    resp.status( 204 ).end(); // No Content
                } else {
                    // Handle error
                    console.log(error); // Log the error
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
 * Removes a driver from the roster Mongo DB, 
 * if a valid token is passed in the header.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.post("/alleys/driver/leave", async ( reqt, resp ) => {
    try {
        // Handle data
        const user = reqt.body.username;
        const tkn  = reqt.headers[ "x-auth" ];
        
        request.delete({ // Join roster
            uri : "https://192.168.1.3:8442/alleys/roster/leave",
            json: true,
            headers : {'x-auth' : tkn},
            body: {username : user},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                if (response.statusCode == 204) {
                    resp.status( 204 ).end(); // No Content
                } else {
                    // Handle error
                    console.log(error); // Log the error
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
 * Changes the rate of a driver in the roster Mongo DB,
 * if a valid token is passed in the header.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.username - The drivers username
 * @param {String} reqt.body.password - The drivers password
 * @param {String} reqt.headers['x-auth'] - A valid token
 * @param {Object} resp - The response
 */
app.post("/alleys/driver/change", async ( reqt, resp ) => {
    try {
        // Handle data
        const user = reqt.body.username;
        const rate = reqt.body.rate;
        const tkn  = reqt.headers[ "x-auth" ];

        request.put({ // Join roster
            uri : "https://192.168.1.3:8442/alleys/roster/change",
            json: true,
            headers : {'x-auth' : tkn},
            body: {username : user, rate : rate},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                if (response.statusCode == 204) {
                    resp.status( 204 ).end(); // No Content
                } else {
                    // Handle error
                    console.log(error); // Log the error
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

// Start listening on specified port.
const server = spdy.createServer( {
    key : fs.readFileSync( "key.pem" ),
    cert : fs.readFileSync( "cert.pem" )
    }, app );

server.listen( PORT, () => {
    console.log( `listening on port ${PORT}...` )
});