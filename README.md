# Microservices-CW
A microservices Node.js approach to a ride-sharing taxi app for coursework


Driver
* The Driver service is an entry point for the drivers of Alleys app to interact with the other services.
* From here they can register with a username and password for the Alleys app. Once registered and authorised they can join the roster, leave the roster and change their rate.

Authentication
* The Authentication service is used by the Driver service when registering, logging in and when checking a token is valid.
* The service uses JSON Web Tokens to confirm identity.

Roster
* The Roster service is connected to a MongoDB of available drivers and their respective rates.
* The Driver service makes requests to the Roster service whenever a driver wants to join the roster, leave the roster or change their rate.

Rider
* The Rider service is an entry point for the riders of Alleys app to find the best driver for their journey and the associated price of the journey.
* It sends a request to the pricing service which is connected to both the mapping service and the roster service.

Pricing
* The Pricing service calculates the best driver for the journey and the price via surge pricing.
* The price is based on the route taken, which is obtained from the mapping service, the driver rates, which are obtained from the roster and the time of day, obtained from the system clock.
* The best driver is the one with the cheapest rate.
* The cost is doubled if the majority of the journey is made on A roads, doubled if there are fewer than five drivers in the roster and doubles if the journey is set to begin between 23:00 and 05:00.

Mapping
* The Mapping service determines if the route specified by the rider consists of a majority of A roads.
* It uses Google Maps API to calculate the total distance of the journey and also gets the system time.

Auth MongoDB
* The Auth MongoDB service is a container that holds the authentication database.
* Upon registering, users store their username and hashed passwords here.
* When logging in the users password is compared to the hashed one in the DB.

Roster MongoDB
* The Roster MongoDB service is a container that holds the roster database.
* Drivers are stored in here after joining with their username and rate.


Driver – Register
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" --data "{\"username\":\"<user>\", \"password\":\"<pass>\"}" https://localhost:8441/alleys/driver/register
```
Driver – Login
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" --data "{\"username\":\"<user>\", \"password\":\"<pass>\"}" https://localhost:8441/alleys/driver/login
```
Driver – Join
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" -H "X-Auth: <TOKEN>" --data "{\"username\":\"<user>\", \"rate\":\"<rate>\"}" https://localhost:8441/alleys/driver/join
```
Driver – Leave
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" -H "X-Auth: <TOKEN>" --data "{\"username\":\"<user>\"}" https://localhost:8441/alleys/driver/leave
```
Driver – Change
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" -H "X-Auth: <TOKEN>" --data "{\"username\":\"<user>\", \"rate\":\"<rate>\"}" https://localhost:8441/alleys/driver/change
```

Rider – Journey
```
curl --cacert cacert.pem -i -X POST -H "Content-Type: application/json" --data "{\"start\":\"<Post Code 1>\", \"end\":\"<Post Code 2>\"}" https://localhost:5009/alleys/rider
```
