$(document).ready(function () {

  ///MODAL///

  // Initially disables the modal submit button
  $("#modalSubmitBtn").prop("disabled", true);

  // Enables the submit button only when there is text in the dialog box
  // Diables the button if text is not present
  $(".input").keyup(function () {
    if ($("#currentPub").val() == "" || $("#destination").val() == "" || $("#travel-time").val() == "") {
      $("#modalSubmitBtn").prop("disabled", true);
    } else {
      $("#modalSubmitBtn").removeAttr("disabled");
    };
  });

  ///END MODAL///

  ////GLOBAL VARIABLES///

  var map, infowindow;

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

  ///END GLOBAL VARIABLES///

  ///FUNCTIONS///

  //Runs the createMarker function on map if Google accepts
  function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        createMarker(results[i]);
      };
    };
  };

  //Places a marker on map using Google's style
  //Adds an event listener to this marker upon user click.
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
  };

  //Calls an Initial map using Google Maps' places library.
  //EX: <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
  //Then adds a listener for user searches.
  //Moves map and searches when user searches. Grabs crime when searching in SF.
  function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 37.774, lng: -122.419 },
      zoom: 15,
      mapTypeId: 'roadmap'
    });

    //Moves the map view to the default San Fran position
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);

    //Searches this area for bars
    service.nearbySearch({
      location: map.center,
      radius: 500,
      type: ['restaurant', 'bar']
    }, callback);

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
      };

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


        //Initialize variables for SF Crime AJAX search
        var lat = place.geometry.location.lat();
        var long = place.geometry.location.lng();
        //Remove "limit" below or increase for final product
        var queryString = 'Select * where within_circle(location,' + lat + "," + long + ', 1600) and date between "2017-06-10T12:00:00" and "2018-06-10T14:00:00" Limit 10';

        //Searches the SF crime database
        $.ajax({
          url: "https://data.sfgov.org/resource/cuks-n6tp.json?$query=" + queryString,
          type: "GET",
          data: {
            //"$$app_token": "YOURAPPTOKENHERE"
          }
        }).done(function (data) {
          console.log(data);
          //Loops through the amount of crimes returned
          for (var i = 0; i < data.length; i++) {
            var crimePos = new google.maps.LatLng(data[i].location.coordinates[0], data[i].location.coordinates[1])

            //Adds the current crime to the map as a marker
            markers.push(new google.maps.Marker({
              map: map,
              title: "Hello World!",
              position: crimePos
            }));
          };
        });

        //Pushes the searched markers to a list of markers
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));
        console.log(markers);

        //Checks if location is within viewport, if not, moves map to fit search
        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        };
      });
      map.fitBounds(bounds);
    });
  };

  ///END FUNCTIONS///

  ///EVENT LISTENERS///

  //Listens for when the Submit button is clicked
  $("#modalSubmitBtn").click(function () {
    // Close the modal box
    modal.style.display = "none";
    $("#modalSubmitBtn").prop("disabled", true);

    // Creating variables for modal input values
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

  ///END EVENT LISTENERS///

  ///FUNCTION CALLS///

  initAutocomplete();

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

  ///END FUNCTION CALLS


});

///END///

///MODAL///

var modal = document.getElementById("searchModal");
var btn = document.getElementById("searchLocal"); // Get the button that opens the modal
var span = document.getElementsByClassName("close")[0]; // Get the <span> element that closes the modal

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

$("#modalCancelBtn").on("click", function () {
  modal.style.display = "none";
})

///END MODAL///

///REMOVED CODE///
// Search button click function
// $("#searchBtn").on("click", function () {
//     var queryTerm = $("#pac-input").val().trim(); 

//     // searchByName(queryTerm);
// });

//Search by Local button clicked
// $("#searchLocal").on("click", function () {
//     searchByArea();

// })

//Called when the search by area button is clicked. Searches by location
//and uses default types of bar and restaurant
// function searchByArea() {
//   var request = {
//     location: pos,
//     radius: '500',
//     type: ['bar', 'restaurant']
//   };

//   service = new google.maps.places.PlacesService(map);
//   service.nearbySearch(request, callback);

// };

// function searchCrimeAPI(lat, long) {
//   var queryString = 'Select * where within_circle(location,' + lat + "," + long + ', 3200) and date between "2017-06-10T12:00:00" and "2018-06-10T14:00:00" Limit 10';

//   $.ajax({
//     url: "https://data.sfgov.org/resource/cuks-n6tp.json?$query=" + queryString,
//     type: "GET",
//     data: {
//       //"$$app_token": "YOURAPPTOKENHERE"
//     }
//   }).done(function (data) {
//     console.log(data);
//     return data;
//   });
// };

// function addCrimeMarker(lat, long) {
//   var crimePos = {
//     lat: lat,
//     lng: long
//   };
//   console.log(crimePos)
//   var marker = new google.maps.Marker({
//     position: crimePos,
//     map: map,
//     title: 'Hello World!'
//   });
//   console.log(marker)
// };

//Calls the searchCrimeAPI with the searched location as center point.
// crimeData = searchCrimeAPI(place.geometry.location.lat(), place.geometry.location.lng())
// console.log(crimeData)

// for (var i = 0; i < crimeData.length; i++) {
//   data[i].location.coordinates[0], data[i].location.coordinates[1];
//   var crimePos = {
//     lat: data[i].location.coordinates[0],
//     lng: data[i].location.coordinates[1]
//   };
//   // Create a marker for each place.
//   markers.push(new google.maps.Marker({
//     position: crimePos,
//     map: map,
//     title: 'Hello World!'
//   }));
// }

// //Necessary google maps function that is called upon searching
// function handleLocationError(browserHasGeolocation, infoWindow, pos) {
//   infoWindow.setPosition(pos);
//   infoWindow.setContent(browserHasGeolocation ?
//     'Error: The Geolocation service failed.' :
//     'Error: Your browser doesn\'t support geolocation.');
//   infoWindow.open(map);
// };

// var crimePos = {
//   lat: data[i].location.coordinates[0],
//   lng: data[i].location.coordinates[1]
// };