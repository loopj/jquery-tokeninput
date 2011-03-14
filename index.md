---
layout: project
title: jQuery Tokeninput
tagline: A jQuery Tokenizing Autocomplete Text Entry
version: 1.2
github_url: https://github.com/loopj/jquery-tokeninput
download_url: https://github.com/loopj/jquery-tokeninput/zipball/jquery-tokeninput-1.2
---

<script type="text/javascript" src="https://github.com/loopj/jquery-tokeninput/raw/master/src/jquery.tokeninput.js"></script>
<link rel="stylesheet" href="https://github.com/loopj/jquery-tokeninput/raw/master/styles/token-input-facebook.css" type="text/css" />

<script type="text/javascript"> 
$(document).ready(function() {
    $("#tokeninput-demo").tokenInput("http://shell.loopj.com/tokeninput/tvshows.php", {
        classes: {
            tokenList: "token-input-list-facebook",
            token: "token-input-token-facebook",
            tokenDelete: "token-input-delete-token-facebook",
            selectedToken: "token-input-selected-token-facebook",
            highlightedToken: "token-input-highlighted-token-facebook",
            dropdown: "token-input-dropdown-facebook",
            dropdownItem: "token-input-dropdown-item-facebook",
            dropdownItem2: "token-input-dropdown-item2-facebook",
            selectedDropdownItem: "token-input-selected-dropdown-item-facebook",
            inputToken: "token-input-input-token-facebook"
        },
        crossDomain: true
    });
});
</script>

Instant Demo
------------
<input type="text" id="tokeninput-demo" />

Start typing TV show names in the box above.<br />
More demos can be found [here](demo.html).


Overview
--------
Tokeninput is a jQuery plugin which allows your users to select multiple items
from a predefined list, using autocompletion as they type to find each item.
You may have seen a similar type of text entry when filling in the recipients 
field sending messages on facebook.


Features
--------
- Intuitive UI for selecting multiple items from a large list
- Easy to skin/style purely in css, no images required
- Supports any backend which can generate JSON, including PHP, Rails, Django, ASP.net
- Smooth animations when results load
- Select, delete and navigate items using the mouse or keyboard
- Client-side result caching to reduce server load
- *New!* Crossdomain support via JSONP
- *New!* Callbacks when items are added or removed from the list
- *New!* Preprocess results from the server with the onResult callback


Screenshots
-----------
![List style](list-style.png)

Vertical list style item selection


![List style](facebook-style.png)

Facebook style item selection


Installation & Setup
--------------------

### Create a server-side script to handle search requests ###

Create a server-side script (PHP, Rails, ASP.net, etc) to generate your
search results. The script can fetch data from wherever you like, for
example a database or a hardcoded list. Your script must accept a GET parameter
named `q` which will contain the term to search for. E.g.
http://www.example.com/myscript?q=query

Your script should output JSON search results in the following format:
{% highlight javascript %}
[
    {"id":"856","name":"House"},
    {"id":"1035","name":"Desperate Housewives"},
    ...
]
{% endhighlight %}


### Include and initialize the plugin ###

Include jQuery and Tokeninput Javascript and stylesheet files on your page, and
attach to your text input:
Tokeninput stylesheet:
{% highlight html %}
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
<script type="text/javascript" src="yourfiles/jquery.tokeninput.js"></script>
<link rel="stylesheet" type="text/css" href="yourfiles/token-input.css" />

<script type="text/javascript">
$(document).ready(function () {
    $("#my-text-input").tokenInput("/url/to/your/script/");
});
</script>
{% endhighlight %}


Configuration
-------------
The tokeninput takes an optional second parameter on intitialization which
allows you to customize the appearance and behaviour of the script, as well as
add your own callbacks to intercept certain events. The following options are
available:

hintText
:   The text to show in the dropdown label which appears when you first click 
    in the search field. *default: "Type in a search term"*.

noResultsText
:   The text to show in the dropdown label when no results are found which 
    match the current query. *default: "No results"*.

searchingText
:   The text to show in the dropdown label when a search is currently in
    progress. *default: "Searching..."*.

searchDelay
:   The delay, in milliseconds, between the user finishing typing and the
    search being performed. *default: 300*.

minChars
:   The minimum number of characters the user must enter before a search is
    performed. *default: 1*.

tokenLimit
:   The maximum number of results allowed to be selected by the user. Use 
    `null` to allow unlimited selections. *default: null*.

jsonContainer
:   The name of the json object in the response which contains the search
    results. Use `null` to use the top level response object. *default: null*.

method
:   The HTTP method (eg. GET, POST) to use for the server request. *default:
    "GET"*.

queryParam
:   The name of the query param which you expect to contain the search term
    on the server-side. *default: "q"*.

crossDomain
:   Use JSONP cross-domain communication to the server instead of a normal
    ajax request. *default: false*.

onResult
:   A function to call whenever we receive results back from the server. You 
    can use this function to pre-process results from the server before they
    are displayed to the user. *default: null*.

onAdd
:   A function to call whenever the user adds another token to their
    selections. *defaut: null*.

onDelete
:   A function to call whenever the user removes a token from their selections.
    *default: null*.


Reporting Bugs
--------------
Please report any bugs or feature requests on the github issues page for this
project here:

<https://github.com/loopj/jquery-tokeninput/issues>


License
-------
Tokeninput is released under a dual license. You can choose either the GPL or
MIT license depending on the project you are using it in and how you wish to
use it.