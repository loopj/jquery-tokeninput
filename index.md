---
layout: project
title: jQuery Tokeninput
tagline: A jQuery Tokenizing Autocomplete Text Entry
version: 1.2
github_url: https://github.com/loopj/jquery-tokeninput
download_url: https://github.com/loopj/jquery-tokeninput
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

Start typing TV show names in the box above.


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


Installation & Setup
--------------------
**Create server-side code** (PHP, Rails, ASP.net, etc) to generate your
search results. The script can fetch data from wherever you like, for
example a database or a hardcoded list, but it must do the following:

Take exactly one GET parameter named “q” which will contain the query string.
E.g. http://www.example.com/myscript?q=query

Output JSON search results in the following format:
{% highlight javascript %}
[
    {"id":"856","name":"House"},
    {"id":"1035","name":"Desperate Housewives"},
    ...
]
{% endhighlight %}

**Include jQuery and Tokeninput Javascript** files on your page:
{% highlight html %}
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
<script type="text/javascript" src="yourfiles/jquery.tokeninput.js"></script>
{% endhighlight %}

**Include a Tokeninput css**, or roll your own:
{% highlight html %}
<link rel="stylesheet" type="text/css" href="yourfiles/token-input.css" />
{% endhighlight %}

**Activate the Tokeninput plugin** on your text input:
{% highlight html %}
<script type="text/javascript">
$(document).ready(function () {
    $("#my-text-input").tokenInput("/url/to/your/script/");
});
</script>
{% endhighlight %}