var api_key = "cb0bfa0a-419c-44d4-8256-a1123df1ca51"
var person_entry_container;
var movie_results_container;
var films;
var re;
var people;

function initialize() {
	person_entry_container = $("#person-entry-container");
	movie_results_container = $("#movie-results-container");
	films = new Object();

	re = new RegExp("^[A-Za-z. -]+$");

	addNewInput();
}

var input_index = 0;
function addNewInput() {
	var input = $("<input>", {"id": "input-" + input_index, "type": "text", "class": "form-control"});

	input.keyup(function(e) {
		if(e.keyCode == 13) {
			var text = $.trim($(this).val()).toLowerCase();
			$(this).val(text);

			if(text.length < 5 || !text.match(re)) {
				$(this).addClass("alert alert-danger")
				$(this).select();
				return; 
			}

			$(this).removeClass("alert-warning");
			$(this).addClass("alert alert-success");

			fetchPersonID(text);
			addNewInput();
		}
	});

	person_entry_container.append(input);
	input.focus();
}

function fetchPersonID(person_name) {
	$.ajax({
		url: "//imdb.wemakesites.net/api/search?q=" + encodeURIComponent(person_name),
		crossDomain: true,
		data: {
			api_key: api_key
		},
		dataType: "jsonp",
		success: function(data) {
			fetchMoviesByID(data, person_name);
		}
	});
}

function fetchMoviesByID(ret_data, person_name) {
	var id;
	if("data" in ret_data && "results" in ret_data.data && "names" in ret_data.data.results) {
		ret_data.data.results.names.map(function(entry) {
			if(entry.title.toLowerCase() == person_name) {
				id = entry.id;
				return;
			}
		});
		if(id)
			console.log(person_name + " (" + id + ")");
		else {
			console.log(person_name + " not found!");
			return;
		}

		$.ajax({
			url: "//imdb.wemakesites.net/api/" + encodeURIComponent(id),
			crossDomain: true,
			data: {
				api_key: api_key
			},
			dataType: "jsonp",
			success: function(data) {
				updateFilmTotals(data.data.filmography, person_name);
			}
		});
	}
}

function updateFilmTotals(filmography, name) {
	filmography.map(function(film) {
		if(!(film.title in films))
			films[film.title] = [name];
		else
			films[film.title].push(name);
	});
	var sorted_films = Object.keys(films).sort(function(a, b) {
		return films[b].length - films[a].length;
	});
	
	console.log("\nShared Films:");
	sorted_films.map(function(film) {
		if(films[film].length == 1)
			return;
		console.log(film + ": " + films[film].length);
	});
}

initialize();