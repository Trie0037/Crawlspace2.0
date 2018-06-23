$(document).ready(function () {
    //Global Variables Here
    var map, service, infowindow, pos;

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBfcA7tK5gAh1dxN-l7WMhHhVc2DlaVha0",
        authDomain: "crawlspace-eefe4.firebaseapp.com",
        databaseURL: "https://crawlspace-eefe4.firebaseio.com",
        projectId: "crawlspace-eefe4",
        storageBucket: "",
        messagingSenderId: "432691243438"
    };
    firebase.initializeApp(config);

    //Global Variables Finished

    //Functions

    //calls initial map and asks user to use local data.
    //Google Maps function
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -34.397, lng: 150.644 },
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
                locationBias: { radius: 50, center: pos }
            };
            service = new google.maps.places.PlacesService(map);
            service.findPlaceFromQuery(request, callback);
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

    //Necessary google maps function that is called upon searching
    function callback(results, status) {
        var marker
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

    //Search by Local button clicked
    $("#searchLocal").on("click", function () {
        searchByArea();
    })

    //End of on[x] functions

    //Function Calls
    initMap();

    //End of all JS Data
})