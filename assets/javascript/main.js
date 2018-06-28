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
    var pubName = $("#currentPub").val().trim();
    var nextDestination = $("#destination").val().trim();
    var travelTime = $("#travel-time").val().trim();

    database.ref().push({

      Pub: pubName,
      Destination: nextDestination,
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
    var travelTime = $("<td>").html(childSnapshot.val().Travel);
    tableRow.append(pubName, nextDestination, travelTime);
    tableBody.append(tableRow);
  });

  //Global Variables Finished

  //Functions

  //calls initial map and asks user to use local data.
  //Google Maps function
  // This example requires the Places library. Include the libraries=places
  // parameter when you first load the API. For example:
  // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

  var map;
  var infowindow;

  function initMap() {
    var sanFran = { lat: 37.774, lng: -122.419 };

    map = new google.maps.Map(document.getElementById('map'), {
      center: sanFran,
      zoom: 15
    });

    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
      location: sanFran,
      radius: 500,
      type: ['store']
    }, callback);
  }

  function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        createMarker(results[i]);
      }
    }
  }

  function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function () {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
    });
  }

  //Searches for places by name submitted. If the user submits search data
  //that doesn't match with restaurant names, do a custom search
  function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 37.774, lng: -122.419 },
      zoom: 13,
      mapTypeId: 'roadmap'
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
      searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function () {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      markers.forEach(function (marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function (place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        //Calls the searchCrimeAPI with the searched location as center point.
        searchCrimeAPI(place.geometry.location.lat(),place.geometry.location.lng())

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });
  }

  initAutocomplete();

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

  function searchCrimeAPI(lat, long) {
    var queryString = 'Select * where within_circle(location,' + lat + "," + long + ', 3200) and date between "2017-06-10T12:00:00" and "2018-06-10T14:00:00" Limit 10';

    $.ajax({
      url: "https://data.sfgov.org/resource/cuks-n6tp.json?$query=" + queryString,
      type: "GET",
      data: {
        //"$$app_token": "YOURAPPTOKENHERE"
      }
    }).done(function (data) {
      console.log(data);
    });
  };

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
  createMarker();

  //End of Functions

  //On[x] functions

  // Search button click function
  // $("#searchBtn").on("click", function () {
  //     var queryTerm = $("#pac-input").val().trim(); 

  //     // searchByName(queryTerm);
  // });

  $("#modalCancelBtn").on("click", function () {
    modal.style.display = "none";
  })

  // --Modal Code Starts Here--
  var modal = document.getElementById("searchModal");

  // Get the button that opens the modal
  var btn = document.getElementById("searchLocal");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks the button, open the modal 
  btn.onclick = function () {
    $("#currentPub").val("");
    $("#destination").val("");
    $("#travel-time").val("");
    modal.style.display = "block";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  // --Modal Code Ends--

  // Loading gif



  //Search by Local button clicked
  // $("#searchLocal").on("click", function () {
  //     searchByArea();

  // })

  //End of on[x] functions

  //Function Calls
  initMap();

  //End of all JS Data
})