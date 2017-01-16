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
	var input = $("<input>", {"id": "input-" + input_index, "type": "text", "class": "person-search form-control alert"});

	input.keyup(function(e) {
		if(e.keyCode == 13) {
			var text = $.trim($(this).val()).toLowerCase();
			$(this).val(text);

			if(!text.match(re)) {
				$(this).addClass("alert-danger")
				$(this).select();
				return; 
			}

			$(this).removeClass("alert-danger alert-success");
			$(this).addClass("alert-warning");
			$(this).addClass("loading");
			$(this).attr("readonly", "readonly");

			fetchPersonID(text, $(this));
		}
	});

	person_entry_container.append(input);
	input.focus();
}

function fetchPersonID(person_name, input) {
	$.ajax({
		url: "//imdb.wemakesites.net/api/search?q=" + encodeURIComponent(person_name),
		crossDomain: true,
		data: {
			api_key: api_key
		},
		dataType: "jsonp",
		success: function(data) {
			var person;
			data.data.results.names.map(function(entry) {
				if(entry.title.toLowerCase() == person_name) {
					person = entry;
					return;
				}
			});
			input.removeClass("loading");
			if(person) {
				fillInputSuggestion(input, person);
			} else {
				input.after(createSuggestionsPopup(data.data.results.names, input));
			}
		}
	});
}

function createSuggestionsPopup(persons, input) {
	var container = $("<div>", {"class": "suggestions"});
	var list = $("<ul>", {"class": "list-group"});
	persons.map(function(person) {
		var li = $("<li>", {"class": "list-group-item person-suggestion"});
		li.text(person.title);
		li.data("person", person);
		li.click(function() {
			fillInputSuggestion(input, li.data("person"));
		});
		list.append(li);
	});
	container.append(list);
	return container;
}

function fillInputSuggestion(input, person) {
	input.next().remove();
	input.val(person.title);
	input.removeClass("alert-warning alert-danger");
	input.addClass("alert-success");
	input.attr("readonly", "");
	fetchMoviesByID(person);
	addNewInput();
}

function fetchMoviesByID(person) {
	$.ajax({
		url: "//imdb.wemakesites.net/api/" + encodeURIComponent(person.id),
		crossDomain: true,
		data: {
			api_key: api_key
		},
		dataType: "jsonp",
		success: function(data) {
			updateFilmTotals(data.data.filmography, person);
		}
	});
}

function updateFilmTotals(filmography, person) {
	var unique_credits = new Set(filmography.map(function(film) {
		return film.title;
	}));

	unique_credits.forEach(function(film) {
		if(!(film in films))
			films[film] = [person];
		else
			films[film].push(person);
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