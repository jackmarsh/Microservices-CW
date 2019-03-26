const bodyParser = require( "body-parser" );
const express = require( "express" );
const fs = require( "fs" );
const spdy = require( "spdy" );
var request = require("request");

const app = express();

app.use( bodyParser.json() );

const PORT = 5010;

/**
 * Returns the best driver and price of journey for
 * given start and end points.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.query.start - Start of journey
 * @param {String} reqt.query.end   - End of journey
 * @param {Object} resp - The response
 */
app.get("/alleys/pricing/", async ( reqt, resp ) => {
    try {
        // Handle query data
        const start = reqt.query.start;
        const end   = reqt.query.end;

        // Call to mapping service
        var promisemap = new Promise(function(resolve, reject) {
            // Set timeout length and return value  
            setTimeout(function() {
                request.get({
                    uri : "http://192.168.1.7:5011/alleys/mapping",
                    json: true,
                    qs : { start : start, end : end},
                    agentOptions : { rejectUnauthorized : false}
                }, (error, response, body) => {
                    if (!error) {
                        // Handle response
                        if (response.statusCode == 200) {
                            resolve(body)
                        } else {
                            console.log(error); // Log the error
                            resp.status( 404 ).end(); // Not Found
                        }
                    } else {
                        // Handle error
                        console.log(error); // Log the error
                        resp.status( 404 ).end(); // Not Found
                    }
                })
            }, 500, null);
        });

        // Call to roster service
        var promiseros = new Promise(function(resolve, reject) {
            // Set timeout length and return value  
            setTimeout(function() {
                request.get({
                    uri : "https://192.168.1.3:8442/alleys/roster/rates",
                    json: true,
                    agentOptions : { rejectUnauthorized : false}
                }, (error, response, body) => {
                    if (!error) {
                        // Handle response
                        if (response.statusCode == 200) {
                            resolve(body)
                        } else {
                            console.log(error); // Log the error
                            resp.status( 404 ).end(); // Not Found
                        }
                    } else {
                        // Handle error
                        console.log(error); // Log the error
                        resp.status( 404 ).end(); // Not Found
                    }
                })
            }, 500, null);
        });

        Promise.all([promisemap, promiseros]).then(function(values) {
            
            // Handle responses
            const mapdoc = values[0]
            const rosdoc = values[1]

            if (mapdoc && rosdoc) {
                // Surge pricing calculations
                price = mapdoc.distance * rosdoc.rate
                if (mapdoc.aroads){
                    price *= 2 // Double if majority A roads
                }
                if (rosdoc.numdrivers < 5){
                    price *= 2 // Double if less than five drivers
                }
                if (mapdoc.time > 23 && mapdoc.time < 5){
                    price *= 2 // Double if between 23:00 and 05:00
                }

                // Create document
                const doc = { name  : rosdoc.name,
                              price : price}
                resp.status( 200 ).json( doc ).end(); // OK
            } else {
                // If either response times out
                resp.status( 408 ).end(); // Request Timeout
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
