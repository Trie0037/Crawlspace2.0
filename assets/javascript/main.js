$(document).ready(function(){
    // Search button click function
    $("#searchBtn").on("click", function(){
        // alert("works")
    })

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

})