const bodyParser = require("body-parser");
const express = require("express");
const spdy = require("spdy");
const fs = require("fs");
const app = express();

const PORT = 5011;

app.use(bodyParser.json());

// Create the google maps client
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyBXq3lrzyRiMPlkHITVQWLFnKIHDPRfV9Q'  // CHANGE ME
});

/**
 * Given start and endpoints determine if the journey
 * consists of majority A roads, calculate the distance
 * and get the system time.
 * @function
 * @param {Object} reqt - The request
 * @param {String} reqt.query.start - Start of journey
 * @param {String} reqt.query.end   - End of journey
 * @param {Object} resp - The response
 */
app.get('/alleys/mapping', (reqt, resp) => {

    try {
        googleMapsClient.directions({
            origin: reqt.query.start,
            destination: reqt.query.end,
            mode: "driving"
        }, function (error, response) {
            if (!error) {
                // Handle response.
                var route = response.json
                var aroadLength = 0;
                var totalLength = 0;
                
                // Count total distance and A road distance
                for (var i = 0; i < route.routes[0].legs[0].steps.length; i++) {

                    // A road distance
                    var html = route.routes[0].legs[0].steps[i].html_instructions
                    if (html.match(/A[1-9]/i) != null) {
                        aroadLength += route.routes[0].legs[0].steps[i].distance.value;
                    }
                    // Total distance
                    totalLength += route.routes[0].legs[0].steps[i].distance.value;
                }

                // Determine if journey is majority A roads
                var majorityARoads;
                if (aroadLength > (totalLength / 2)) {
                    majorityARoads = true;
                } else {
                    majorityARoads = false;
                }
                
                // Create document
                const doc = {  
                    'aroads' : majorityARoads,
                    'distance' : totalLength/1000, // m => km
                    'time' : (new Date()).getHours() // Current system time
                }
                resp.status( 200 ).json( doc ).end(); // OK
            } else if (error === 'timeout') {
                // Handle timeout.
                console.log(error) // Log the error
                resp.status( 408 ).end() // Request Timeout
            } else if (error.json) {
                // Inspect error.status for more info.
                console.log(error.json) // Log the error
                resp.status( 401 ).end() // Unauthorised
            } else {
                // Handle network error.
                console.log(error) // Log the error
                resp.status( 500 ).end() // Internal Server Error
            }
        });
    } catch (exception) {
        console.log(exception) // Log the error
        resp.status( 500 ).end() // Internal Server Error
    }
});

// Start listening on specified port.
const server = spdy.createServer( {
        key : fs.readFileSync( "key.pem" ),
        cert : fs.readFileSync( "cert.pem" )
    }, app );

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`)
});

