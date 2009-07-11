=================================================
jQuery Plugin: Tokenizing Autocomplete Text Entry
       By James Smith - http://loopj.com
=================================================

Overview
--------
This is a jQuery plugin to allow users to select multiple items from a predefined list, using autocompletion as they type to find each item. You may have seen a similar type of text entry when filling in the recipients field sending messages on facebook.


License
-------
This plugin is licensed under both the GPL and MIT licenses. Choose which ever one suits your project best.


How to Use This jQuery Plugin:
------------------------------
* Make sure you have jquery script included on your page
* Include jquery.tokeninput.js on your page
* Include one of the provided stylesheets, or make your own
* Create a server-side script (php/rails/django anything goes) to generate the search results.
  The script itself can fetch data from wherever you like, for example a database or a hardcoded list, but it must do the following:
      o Take exactly one GET parameter named “q” which will contain the query string. E.g. http://www.example.com/myscript?q=query
      o Output JSON search results in the following format:

        [{"id":"856","name":"House"},
         {"id":"1035","name":"Desperate Housewives"},
         {"id":"1048","name":"Dollhouse"},
         {"id":"1113","name":"Full House"}
        ]

* Turn text inputs into tokeninputs using jQuery and point them to your results script:

  <script type="text/javascript">
  $(document).ready(function () {
    $("#my-text-input").tokenInput("/url/to/your/script/");
  });
  </script>

* A list of selected item ids is created inside the original text entry, process them as usual when the form is submitted.
