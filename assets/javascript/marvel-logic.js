
// Initialize Firebase
var config = {
    apiKey: "AIzaSyCg6VGgty7WMU-yb_43IseLAXluJ2giLJ0",
    authDomain: "comicfinder-1521169725007.firebaseapp.com",
    databaseURL: "https://comicfinder-1521169725007.firebaseio.com",
    projectId: "comicfinder-1521169725007",
    storageBucket: "comicfinder-1521169725007.appspot.com",
    messagingSenderId: "588705820284"
};
firebase.initializeApp(config);
var database = firebase.database();

$(document).ready(function () {

    $('.zoo-item').ZooMove();
    //Submits search type, the input to be searched, and the number of desired results to selected search function on #search-button click
    $("#search-button").on("click", function (event) {

        event.preventDefault();
        var searchType = $("#search-by").val();
        var searchParameter = $("#search-text").val().trim();
        var numResults = $('input[name=results]:checked').val();

        //selects search function based on dropdown menu value captured above
        if (searchType == "Choose...") {
            $("#search-modal").modal();
        } else if (searchType == 1) {
            characterSearch(searchParameter, numResults);
        } else if (searchType == 2) {
            issueSearch(searchParameter, numResults);
        } else if (searchType == 3) {
            titleSearch(searchParameter, numResults);
        } else if (searchType == 4) {
            yearSearch(searchParameter, numResults);
        }

    });

});

//Listens for clicks on results table, displays thumbnail and synopsis of clicked on result
$(document).on("click", ".comicData", function () {
    var synopsis = $(this).attr("data-synopsis");
    var thumblink = $(this).attr("data-thumbnail");
    var link = $(this).attr("data-url");
    $("#synopsis-text").text(synopsis);
    $("#thumbnail-image").attr("data-zoo-image", thumblink);
    $('.zoo-item').ZooMove();
    $("#thumbnail-link").attr("href", link);
})

//Searches by passed character name
function characterSearch(name, numResults) {
    var characterName = name;
    var firstSearchURL = "https://gateway.marvel.com:443/v1/public/characters?name=" + characterName + "&apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"
    var inDatabase = false;
    var charID;
    var charURL;
    var charThumb;
    var charDescription

    //As Marvel API calls are limited by day, this checks to see if its a character that has been searched for before and pulls relevant information from data stored in Firebase
    database.ref("characters").once("value").then(function (snapshot) {

        snapshot.forEach(function (child) {
            console.log(child.val().characterName);
            if (child.val().characterName === characterName) {
                console.log("in database");
                inDatabase = true;
                charID = child.val().ID;
                charURL = child.val().URL;
                charThumb = child.val().thumbnail;
                charDescription = child.val().description;
                $("#thumbnail-image").attr("data-zoo-image", charThumb + ".jpg");
                $('.zoo-item').ZooMove();
                $("#thumbnail-link").attr("href", charURL);
                $("#synopsis-text").text(charDescription);

                var secondSearchURL = "https://gateway.marvel.com:443/v1/public/characters/" + charID + "/comics?apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"
                $.ajax({
                    url: secondSearchURL,
                    method: "GET",
                    error: function (partOne, partTwo, partThree) {
                        console.log(partOne);
                        console.log(partTwo);
                        console.log(partThree);
                    }
                }).then(function (response) {
                    console.log(response.data.results);
                    displayComics(response.data.results, numResults)
                })

                return true;
            }
            
        });

        //Alternatively, if the character has not been searched for before this will submit one ajax request to the Marvel API to get and store the characters information for future searches
        if (!inDatabase) {
            $.ajax({
                url: firstSearchURL,
                method: "GET"
            }).then(function (response) {
                console.log(response);
                $("#thumbnail-image").attr("data-zoo-image", response.data.results[0].thumbnail.path + ".jpg");
                $('.zoo-item').ZooMove();
                $("#thumbnail-link").attr("href", response.data.results[0].urls[1].url);
                $("#synopsis-text").text(response.data.results[0].description);
                charID = response.data.results[0].id;
                database.ref("characters").push({ characterName: response.data.results[0].name, ID: charID, thumbnail: response.data.results[0].thumbnail.path, 
                    URL: response.data.results[0].urls[1].url, description : response.data.results[0].description });
                var secondSearchURL = "https://gateway.marvel.com:443/v1/public/characters/" + charID + "/comics?apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"
                
                //Once the characters information has been received and stored, this second ajax request will get a list of comics related to that character
                $.ajax({
                    url: secondSearchURL,
                    method: "GET",
                    error: function (partOne, partTwo, partThree) {
                        console.log(partOne);
                        console.log(partTwo);
                        console.log(partThree);
                    }
                }).then(function (response) {
                    console.log(response.data.results);
                    displayComics(response.data.results, numResults);
                })
            });
        }
    });

};

//Searches for comics based on the given issue number
function issueSearch(issue, numResults) {
    var searchIssue = issue;
    var issueURL = "https://gateway.marvel.com:443/v1/public/comics?issueNumber=" + searchIssue + "&apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"

    $.ajax({
        url: issueURL,
        method: "GET"
    }).then(function (response) {
        displayComics(response.data.results, numResults);
    });
}

//Searches for comics based on the given year
function yearSearch(year, numResults) {
    var yearSearch = year
    var yearURL = "https://gateway.marvel.com:443/v1/public/comics?startYear=" + yearSearch + "&apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"
    console.log("searching by year");  
    $.ajax({
        url : yearURL,
        method : "GET"
    }).then(function(response) {
        displayComics(response.data.results, numResults);
    })
}

//Searches for comics mathcing in whole or in part the given title
function titleSearch(title, numResults) {
    var titleSearch = title;
    var titleURL = "https://gateway.marvel.com:443/v1/public/comics?title=" + titleSearch + "&apikey=c6ddf149200862b50983d1633446c0f7&ts=" + 1 + "&hash=ddc450734c99a083d33d41a3baea4e59"

    $.ajax({
        url : titleURL,
        method : "GET"
    }).then(function(response) {
        displayComics(response.data.results, numResults);
    })
}

//Accepts the results of the above search functions and the max number of results to be displayed and then populates the search table with their results
function displayComics(comics, numResults) {
    $("#comic-table").empty();
    console.log(comics);
    for (let i = 0; i < numResults; i++) {
        console.log(comics[i]);
        if (comics[i] != undefined) {
            var comicRow = $("<tr>");

            var nameTable = $("<td>");
            if (comics[i].characters.available != 0) {
                nameTable.text(comics[i].characters.items[0].name);
            } else {
                nameTable.text(" ");
            }

            var issueTable = $("<td>");
            if (comics[i].issueNumber != undefined) {
                issueTable.text(comics[i].issueNumber);
            } else {
                issueTable.text(" ");
            }
            var titleTable = $("<td>");
            if (comics[i].title != undefined) {
                titleTable.text(comics[i].title);
            } else {
                titleTable.text(" ");
            }

            var yearTable = $("<td>");
            if (comics[i].dates[0].date != undefined) {
                yearTable.text(moment(comics[i].dates[0].date).format("YYYY"));
            } else {
                yearTable.text(" ");
            }

            comicRow.append(nameTable);
            comicRow.append(issueTable);
            comicRow.append(titleTable);
            comicRow.append(yearTable);
            comicRow.attr("data-synopsis", comics[i].description);
            if (comics[i].images.length > 0) {
            comicRow.attr("data-thumbnail", comics[i].images[0].path + ".jpg");
            } else {
                comicRow.attr("data-thumbnail", " ");
            }
            comicRow.attr("data-url", comics[i].urls[0].url);
            comicRow.addClass("comicData");
            $("#comic-table").append(comicRow);
        }
    }
}

