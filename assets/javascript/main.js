$(document).ready(function () {

  ///MODAL///

  // Initially disables the modal submit button
  $("#modalSubmitBtn").prop("disabled", true);

  // Enables the submit button only when there is text in the dialog box
  // Disables the button if text is not present
  $(".input").keyup(function () {
    if ($("#currentPub").val() == "" || $("#destination").val() == "") {
      $("#modalSubmitBtn").prop("disabled", true);
    } else {
      $("#modalSubmitBtn").removeAttr("disabled");
    };
  });

  ///END MODAL///

  ////GLOBAL VARIABLES///

  var map, infowindow, service;

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
      // Marks the location of bars upon application startup
      for (var i = 0; i < results.length; i++) {
        createMarker(results[i]);
      };
    };
  };

  //Places a marker on map using Google's style
  //Adds an event listener to this marker upon user click.
  function createMarker(place) {
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
      map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 37.774,
        lng: -122.419
      },
      zoom: 15,
      mapTypeId: 'roadmap'
    });

    //Moves the map view to the default San Fran position
    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);

    //Searches this area for bars
    service.nearbySearch({
      location: map.center,
      radius: 500,
      type: ['bar']
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
    var crimeMarker = [];

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
      crimeMarker = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function (place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        };

        //Initialize variables for SF Crime AJAX search
        var lat = place.geometry.location.lat();
        var long = place.geometry.location.lng();
        //Remove "limit" below or increase for final product
        var queryString = 'Select * where within_circle(location,' + lat + "," + long + ', 400) and date between "2017-06-10T12:00:00" and "2018-06-10T14:00:00" Limit 150';

        // places.name (header)
        // places.formatted_address (address)
        // places.formatted_phone_number (phone number)
        // places.opening_hours.weekday_text
        // places.price_level
        // places.rating
        // places.website
        //Pushes the searched markers to a list of markers
        markers.push(new google.maps.Marker({
          map: map,
          icon: "assets/images/marker.png",
          title: place.name,
          position: place.geometry.location,
          animation: google.maps.Animation.DROP
        }));
        console.log(markers)
        for (var i = 0; i < markers.length; i++){
          google.maps.event.addListener(markers[i], "click", function(){
              infowindow.setContent(
              "<div><h3>" + this.title + "</h3>" 
              // "<div>Date: " + this.date + "<br>" +
              // "Time: " + this.time + "</div></div>"
            );
            infowindow.open(map, this);
          });
        };

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
            var crimePos = new google.maps.LatLng(data[i].location.coordinates[1], data[i].location.coordinates[0]);
            if (data[i].date.length > 10){
              var dateTime = data[i].date.substr(0, 10);
            }
            //Adds the current crime to the map as a marker
            crimeMarker.push(new google.maps.Marker({
              map: map,
              icon: "assets/images/crime.png",
              title: "Click for more info",
              date: dateTime,
              time: data[i].time,
              crimeType: data[i].category,
              position: crimePos,
              animation: google.maps.Animation.DROP
            }));
          };

          // This is the info window for the crime markers
          // Shows the type of crime, date, and time
          for (var i = 0; i < crimeMarker.length; i++){
            google.maps.event.addListener(crimeMarker[i], "click", function(){
                infowindow.setContent(
                "<div><h3>" + this.crimeType + "</h3>" +
                "<div>Date: " + this.date + "<br>" +
                "Time: " + this.time + "</div></div>"
              );
              infowindow.open(map, this);
            });
          };
        });

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
    searchModal.style.display = "none";
    $("#modalSubmitBtn").prop("disabled", true);

    // Creating variables for modal input values
    var pubName = $("#currentPub").val().trim();
    var nextDestination = $("#destination").val().trim();

    database.ref().push({
      Pub: pubName,
      Destination: nextDestination,
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
    var pubName = $("<td>").html(childSnapshot.val().Pub);
    var nextDestination = $("<td>").html(childSnapshot.val().Destination);
    tableRow.append(pubName, nextDestination);
    tableBody.append(tableRow)
  });

  ///END FUNCTION CALLS
});

///END///

///MODAL///
var searchModal = document.getElementById("searchModal");
var addListBtn = document.getElementById("addList"); // Get the button that opens the modal
var span = document.getElementsByClassName("close")[0]; // Get the <span> element that closes the modal

// When the user clicks the button, open the modal 
addListBtn.onclick = function () {
  $("#currentPub").val("");
  $("#destination").val("");
  $("#modalSubmitBtn").prop("disabled", true);
  searchModal.style.display = "block";
}

// When the user clicks anywhere outside of the modal, close it
searchModal.onclick = function (event) {
  if (event.target == searchModal) {
    searchModal.style.display = "none";
  }
}

// When the user clicks the cancel button,
// remove the modal and disable the sumbit button
$("#modalCancelBtn").on("click", function () {
  searchModal.style.display = "none";
})