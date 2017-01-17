var api_key = "cb0bfa0a-419c-44d4-8256-a1123df1ca51"
var person_entry_container;
var movie_results_container;
var films;
var valid_name_re;
var title_id_re;
var people;

function initialize() {
	person_entry_container = $("#person-entry-container");
	movie_results_container = $("#movie-results-container");
	films = new Object();

	valid_name_re = new RegExp("^[A-Za-z. -]+$");
	title_id_re = /http:\/\/www.imdb.com\/title\/(\w+)\/\?ref.*/;

	addNewInput();
}

var input_index = 0;
function addNewInput() {
	var input = $("<input>", {	"id": "input-" + input_index,
								"type": "text",
								"class": "person-search form-control alert",
								"placeholder": "Search for actors, directors, writers, etc."});

	input.keyup(function(e) {
		if(e.keyCode == 13) {
			var text = $.trim($(this).val()).toLowerCase();
			$(this).val(text);

			if(!text.match(valid_name_re)) {
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
		url: "http://imdb.wemakesites.net/api/search?q=" + encodeURIComponent(person_name),
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
				input.next().remove();
				input.after(createSuggestionsPopup(data.data.results.names, input));
				input.removeAttr("readonly");
				input.focus();
				input.select();
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
	person.input = input;
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
		url: "http://imdb.wemakesites.net/api/" + encodeURIComponent(person.id),
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
		var id = title_id_re.exec(film.info)[1];
		if(!(id in films))
			films[id] = {"title": film.title, "members": []};
		return id;
	}));

	unique_credits.forEach(function(film_id) {
		films[film_id].members.push(person);
	});

	var sorted_film_ids = Object.keys(films).sort(function(a, b) {
		return films[b].members.length - films[a].members.length;
	});
	
	var header = $("<h3>");
	header.text("Shared Films");
	movie_results_container.empty();
	movie_results_container.append(header);
	sorted_film_ids.map(function(film_id) {
		if(films[film_id].members.length == 1)
			return;
		var item = $("<h5>", {"class": "film-list-item"});
		item.text(films[film_id].title + ": " + films[film_id].members.length);
		item.hover(function() {
			films[film_id].members.map(function(person) {
				person.input.addClass("input-highlight");
			});
		}, function() {
			films[film_id].members.map(function(person) {
				person.input.removeClass("input-highlight");
			});
		});
		movie_results_container.append(item);
	});
}

initialize();