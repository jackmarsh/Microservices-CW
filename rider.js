const bodyParser = require( "body-parser" );
const express = require( "express" );
const fs = require( "fs" );
const spdy = require( "spdy" );
const request = require("request");
const app = express();

app.use( bodyParser.json() );

const PORT = 5009

/**
 * Returns the best driver and price of journey for
 * given start and end points.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.body.start - Start of journey
 * @param {String} reqt.body.end   - End of journey
 * @param {Object} resp - The response
 */
app.post("/alleys/rider", async ( reqt, resp ) => {
    
    try {
        // Handle data
        const start = reqt.body.start;
        const end   = reqt.body.end;
    
        request.get({
            uri : "https://192.168.1.6:5010/alleys/pricing",
            json: true,
            qs: {start : start, end : end},
            agentOptions : { rejectUnauthorized : false}
        }, (error, response, body) => {
            if (!error) {
                // Handle response
                if (response.statusCode == 200) {
                    resp.status( 200 ).json(body).end(); // OK
                } else {
                    console.log(error); // Log the error
                    resp.status( 404 ).end(); // Not Found
                }
            } else {
                // Handle error
                console.log(error); // Log the error
                resp.status( 404 ).json(body).end(); // Not Found
            }
        });
    } catch (exception) {
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
