$(document).ready(function () {
    //Global Variables Here
    var map, service, infowindow, pos;

    //Spotcrime call, I think - requires testing
    //var spotcrime = require('spotcrime');

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBfcA7tK5gAh1dxN-l7WMhHhVc2DlaVha0",
        authDomain: "crawlspace-eefe4.firebaseapp.com",
        databaseURL: "https://crawlspace-eefe4.firebaseio.com",
        projectId: "crawlspace-eefe4",
        storageBucket: "crawlspace-eefe4.appspot.com",
        messagingSenderId: "432691243438"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    $("#modalSubmitBtn").click(function () {
        // Close the modal box
        modal.style.display = "none";

        // Creating variables for Train Schedule
        var pubName = $("#pub-name").val().trim();
        var nextDestination = $("#destination").val().trim();
        var currentLocation = $("#current-location").val().trim();
        var travelTime = $("#travel-time").val().trim();
        // console.log(trainName);

        database.ref().push({

            Pub: pubName,
            Destination: nextDestination,
            Location: currentLocation,
            Travel: travelTime,

            dateAdded: firebase.database.ServerValue.TIMESTAMP

        });
    });

    database.ref().orderByChild("dateAdded").limitToLast(7).on("child_added", function (childSnapshot) {
        var tableBody = $("tbody");
        var tableRow = $("<tr>");
        
        // Place user inputs into the table
        // Creates new td tags to place user inputs in
        // td will be our cells
        var pubName = $("<tD>").html(childSnapshot.val().Pub);
        var nextDestination = $("<td>").html(childSnapshot.val().Destination);
        var currentLocation = $("<td>").html(childSnapshot.val().Location);
        var travelTime = $("<td>").html(childSnapshot.val().Travel);
        tableRow.append(pubName, nextDestination, currentLocation, travelTime);
        tableBody.append(tableRow);

        /*var trainFrequency = (childSnapshot.val().Frequency);
        var dateFormat = moment().format('LLLL');
    
        var firstTrain = moment($("#first-train").val().trim(), "HH:mm").format();
        var currentTime = moment();
        var nextArrival = moment(childSnapshot.val().FirstTrain, "HH:mm");
        while (nextArrival.isBefore(currentTime)) {
            nextArrival.add(trainFrequency, "minutes");
        }
        var minutesAway = Math.abs(currentTime.diff(nextArrival, 'minutes'));
        console.log(minutesAway);
        console.log(nextArrival);
        var minutesAwayTd = $("<td>").html(minutesAway);
        var tBody = $("tbody");
        var tRow = $("<tr>");
        trainName = $("<td>").html(childSnapshot.val().Train);
        trainDestination = $("<td>").html(childSnapshot.val().Destination);
        trainFrequency = $("<td>").html(childSnapshot.val().Frequency);
        firstTrain = $("<td>").html(childSnapshot.val().FirstTrain); 
        nextArrivalTd = $("<td>").html(nextArrival.format('LT'));
    
        tRow.append(trainName, trainDestination, trainFrequency, firstTrain, nextArrivalTd, minutesAwayTd); 
        tBody.append(tRow);*/
    });


    //Global Variables Finished

    //Functions

    //calls initial map and asks user to use local data.
    //Google Maps function
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: -34.397,
                lng: 150.644
            },
            zoom: 18
        });
        infoWindow = new google.maps.InfoWindow;

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                infoWindow.setPosition(pos);
                infoWindow.setContent('Location found.');
                infoWindow.open(map);
                map.setCenter(pos);
            }, function () {
                handleLocationError(true, infoWindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        };

        document.add;
    };

    //Searches for places by name submitted. If the user submits search data
    //that doesn't match with restaurant names, do a custom search
    function searchByName(name) {
        var testName = name.toLowerCase();
        if (testName === "bar" || "bars" || "restaurant" || "restaurants" || "food" || "beer") {
            var request = {
                location: pos,
                radius: '500',
                type: ['bar', 'restaurant']
            };
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);
        } else {
            var request = {
                query: name,
                fields: ['photos', 'formatted_address', 'name', 'rating', 'opening_hours', 'geometry'],
                locationBias: {
                    radius: 50,
                    center: pos
                }
            };
            service = new google.maps.places.PlacesService(map);
            service.findPlaceFromQuery(request, callback);
            // somewhere near phoenix, az

        };
    };

    //Called when the search by area button is clicked. Searches by location
    //and uses default types of bar and restaurant
    function searchByArea() {
        var request = {
            location: pos,
            radius: '500',
            type: ['bar', 'restaurant']
        };

        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);

    };

    //To be called with each map update
    //Data needs to be set one page by using the lat and long fields
    function callSpotCrime() {
        var radius = 0.01; // Miles to be searched
        spotcrime.getCrimes(pos, radius, function (err, crimes) {

        });
        //We need to take the response from this spotcrime call
    }


    //Necessary google maps function that is called upon searching
    function callback(results, status) {
        var marker;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var place = results[i];

                createMarker(results[i]);
            };
        };
    };

    //Necessary google maps function that is called upon searching
    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);
    };

    //Create marker function that is necessary for google maps
    function createMarker(place) {
        new google.maps.Marker({
            position: place.geometry.location,
            map: map
        });
    };

    //End of Functions

    //On[x] functions

    // Search button click function
    $("#searchBtn").on("click", function () {
        var queryTerm = $("#searchInput").val().trim();
        searchByName(queryTerm);
    });

    $("#modalCancelBtn").on("click", function(){
        modal.style.display = "none";
    })

    // --Modal Code Starts Here--
    var modal = document.getElementById("searchModal");

    // Get the button that opens the modal
    var btn = document.getElementById("searchLocal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal 
    btn.onclick = function() {
        $("#pub-name").val("");
        $("#destination").val("");
        $("#current-location").val("");
        $("#travel-time").val("");
        modal.style.display = "block";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    // --Modal Code Ends--

    //Search by Local button clicked
    // $("#searchLocal").on("click", function () {
    //     searchByArea();
        
    // })

    //End of on[x] functions

    //Function Calls
    initMap();

    //End of all JS Data
})