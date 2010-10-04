// $Id$
/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.2
 *
 * Copyright (c) 2009 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 * Severely modified for use with the Drupal module: Navigate 2.0 (http://drupal.org/project/navigate).
 * Copyright (c) 2010 Mark Carver (http://github.com/markcarver/jQuery-Tokenizing-Autocomplete-Plugin)
 * Licensed under the GPL and MIT licenses
 * Documentation is currently limited due to time restraints. Please contact me directly if you have any
 * questions regarding the modifications to this wonderful script! mark.carver@me.com
 *
 */

(function($) {

$.fn.tokenInput = function (url, options) {
    var settings = $.extend({
        categories: false,                       // Allow categories
        contentType: "json",
        delimiter: ',',
        descriptions: false,                     // Display descriptions
        dropdownAnimation: 'slideDown',         // Dropdown animation effect
        dropdownDuration: 'fast',               // Dropdown animation speed
        dropdownLimit: 10,                      // Limit the number of dropdown requests. If the limit is 10 and the first category has only 2 items, then one or more categories
                                                // following the first category are limited to just 8 results
        duplicates: false,                      // Filter results from showing tokens that already exist
        existingParam: "e",                     // Parameter to send to server. Contains existing tokens to filter search
        hintText: "Type in a search term",
        jsonContainer: null,
        noResultsText: "No results",
        method: "GET",
        minChars: 1,
        onResult: null,
        prePopulate: null,
        queryParam: "q",
        searchingText: "Searching...",
        searchDelay: 300,
        tokenLimit: null,
        url: url
    }, options);

    settings.classes = $.extend({
        fieldset: "token-input",
        tokenList: "token-input-list",
        token: "token-input-token",
        tokenDelete: "token-input-delete-token",
        selectedToken: "token-input-selected-token",
        highlightedToken: "token-input-highlighted-token",
        dropdown: "token-input-dropdown",
        dropdownCategory: "token-input-dropdown-category",
        dropdownItem: "token-input-dropdown-item",
        dropdownItemZebra: "token-input-dropdown-item odd",
        dropdownItemDescription: "token-input-dropdown-item-description",
        selectedDropdownItem: "token-input-selected-dropdown-item",
        inputToken: "token-input-input-token"
    }, options.classes);

    return this.each(function () {
        var list = new $.TokenList(this, settings);
    });
};

$.TokenList = function (input, settings) {
    //
    // Variables
    //

    // Input box position "enum"
    var POSITION = {
        BEFORE: 0,
        AFTER: 1,
        END: 2
    };

    // Keys "enum"
    var KEY = {
        BACKSPACE: 8,
        TAB: 9,
        RETURN: 13,
        ESC: 27,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        COMMA: 188
    };

    // Save the tokens
    var saved_tokens = [];
    
    // Keep track of the number of tokens in the list
    var token_count = 0;

    // Basic cache to save on db hits
    var cache = new $.TokenList.Cache();

    // Keep track of the timeout
    var timeout;

    // Create a new text input an attach keyup events
    var input_box = $("<input type=\"text\">")
        .css({
            outline: "none"
        })
        .focus(function () {
            if (settings.tokenLimit == null || settings.tokenLimit != token_count) {
                show_dropdown_hint();
            }
        })
        .blur(function () {
            hide_dropdown();
        })
        .keydown(function (event) {
            var previous_token;
            var next_token;

            switch(event.keyCode) {
                case KEY.LEFT:
                case KEY.RIGHT:
                case KEY.UP:
                case KEY.DOWN:
                    if(!$(this).val()) {
                        previous_token = input_token.prev();
                        next_token = input_token.next();

                        if((previous_token.length && previous_token.get(0) === selected_token) || (next_token.length && next_token.get(0) === selected_token)) {
                            // Check if there is a previous/next token and it is selected
                            if(event.keyCode == KEY.LEFT || event.keyCode == KEY.UP) {
                                deselect_token($(selected_token), POSITION.BEFORE);
                            } else {
                                deselect_token($(selected_token), POSITION.AFTER);
                            }
                        } else if((event.keyCode == KEY.LEFT || event.keyCode == KEY.UP) && previous_token.length) {
                            // We are moving left, select the previous token if it exists
                            select_token($(previous_token.get(0)));
                        } else if((event.keyCode == KEY.RIGHT || event.keyCode == KEY.DOWN) && next_token.length) {
                            // We are moving right, select the next token if it exists
                            select_token($(next_token.get(0)));
                        }
                    } else {
                        var dropdown_item = null;

                        if(event.keyCode == KEY.DOWN || event.keyCode == KEY.RIGHT) {
                            dropdown_item = $(selected_dropdown_item).next();
                            if(!dropdown_item.length) {
                              dropdown_item = $(selected_dropdown_item).parent().nextAll('ul').find('li:first')
                            }
                        } else {
                            dropdown_item = $(selected_dropdown_item).prev();
                            if(!dropdown_item.length) {
                              dropdown_item = $(selected_dropdown_item).parent().prevAll('ul').find('li:last')
                            }
                        }

                        if(dropdown_item.length) {
                            select_dropdown_item(dropdown_item);
                        }
                        return false;
                    }
                    break;

                case KEY.BACKSPACE:
                    previous_token = input_token.prev();

                    if(!$(this).val().length) {
                        if(selected_token) {
                            delete_token($(selected_token));
                        } else if(previous_token.length) {
                            select_token($(previous_token.get(0)));
                        }

                        return false;
                    } else if($(this).val().length == 1) {
                        hide_dropdown();
                    } else {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){do_search(false);}, 5);
                    }
                    break;

                case KEY.TAB:
                case KEY.RETURN:
                case KEY.COMMA:
                  if(selected_dropdown_item) {
                    add_token($(selected_dropdown_item));
                  }
                  return false;
                  break;

                case KEY.ESC:
                  hide_dropdown();
                  return true;
                  break;

                default:
                    if(is_printable_character(event.keyCode)) {
                      // set a timeout just long enough to let this function finish.
                      setTimeout(function(){do_search(false);}, 5);
                    }
                    break;
            }
        });

    // Keep a reference to the original input box
    var hidden_input = $(input)
                           .hide()
                           .focus(function () {
                               input_box.focus();
                           })
                           .blur(function () {
                               input_box.blur();
                           });

    // Keep a reference to the selected token and dropdown item
    var selected_token = null;
    var selected_dropdown_item = null;
    var fieldset = $("<fieldset />")
        .addClass(settings.classes.fieldset)
        .insertAfter(hidden_input);
    // The list to store the token items in
    var token_list = $("<ul />")
        .addClass(settings.classes.tokenList)
        .appendTo(fieldset)
        .click(function (event) {
            var li = get_element_from_event(event, "li");
            if(li && li.get(0) != input_token.get(0)) {
                toggle_select_token(li);
                return false;
            } else {
                input_box.focus();

                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }
            }
        })
        .mouseover(function (event) {
            var li = get_element_from_event(event, "li");
            if(li && selected_token !== this) {
                li.addClass(settings.classes.highlightedToken);
            }
        })
        .mouseout(function (event) {
            var li = get_element_from_event(event, "li");
            if(li && selected_token !== this) {
                li.removeClass(settings.classes.highlightedToken);
            }
        })
        .mousedown(function (event) {
            // Stop user selecting text on tokens
            var li = get_element_from_event(event, "li");
            if(li){
                return false;
            }
        });

    // The list to store the dropdown items in
    var dropdown = $("<div>")
        .addClass(settings.classes.dropdown)
        .insertAfter(token_list)
        .hide();

    // The token holding the input box
    var input_token = $("<li />")
        .addClass(settings.classes.inputToken)
        .appendTo(token_list)
        .append(input_box);

    init_list();

    //
    // Functions
    //


    // Pre-populate list if items exist
    function init_list () {
        if ($.isFunction(settings.prePopulate)) {
          li_data = settings.prePopulate.call(this);
        }
        else {
          li_data = settings.prePopulate;
        }
        var values = [];
        if(li_data && li_data.length) {
            for(var i in li_data) {
                var this_token = $("<li><p>"+li_data[i].name+"</p> </li>")
                    .addClass(settings.classes.token)
                    .insertBefore(input_token);

                $("<span>x</span>")
                    .addClass(settings.classes.tokenDelete)
                    .appendTo(this_token)
                    .click(function () {
                        delete_token($(this).parent());
                        return false;
                    });

                $.data(this_token.get(0), "tokeninput", {"id": li_data[i].id, "name": li_data[i].name});

                // Clear input box and make sure it keeps focus
                input_box
                    .val("")
                    .focus();

                // Don't show the help dropdown, they've got the idea
                hide_dropdown();

                values.push(li_data[i].id);
            }
        }
        hidden_input.val(values.join());
    }
    
    function token_exists(id) {
      var regex = new RegExp(id);
      var token_exists = hidden_input.val().match(regex);
      return token_exists == null ? false : true;
    }

    function is_printable_character(keycode) {
        if((keycode >= 48 && keycode <= 90) ||      // 0-1a-z
           (keycode >= 96 && keycode <= 111) ||     // numpad 0-9 + - / * .
           (keycode >= 186 && keycode <= 192) ||    // ; = , - . / ^
           (keycode >= 219 && keycode <= 222)       // ( \ ) '
          ) {
              return true;
          } else {
              return false;
          }
    }

    // Get an element of a particular type from an event (click/mouseover etc)
    function get_element_from_event (event, element_type) {
        var target = $(event.target);
        var element = null;

        if(target.is(element_type)) {
            element = target;
        } else if(target.parent(element_type).length) {
            element = target.parent(element_type+":first");
        }

        return element;
    }

    // Inner function to a token to the list
    function insert_token(id, value) {
      var this_token = $("<li><p>"+ value +"</p> </li>")
      .addClass(settings.classes.token)
      .insertBefore(input_token);

      // The 'delete token' button
      $("<span>x</span>")
          .addClass(settings.classes.tokenDelete)
          .appendTo(this_token)
          .click(function () {
              delete_token($(this).parent());
              return false;
          });

      $.data(this_token.get(0), "tokeninput", {"id": id, "name": value});

      return this_token;
    }

    // Add a token to the token list based on user input
    function add_token (item) {
        if (fieldset.hasClass('error')) {
          fieldset.removeClass('error');
        }
        var data = $.data(item.get(0), "tokeninput");
        var this_token = insert_token(data.id, data.name);

        // Clear input box and make sure it keeps focus
        input_box
            .val("")
            .focus();

        // Don't show the help dropdown, they've got the idea
        hide_dropdown();

        // Save this token id
        var hidden_val = hidden_input.val();
        var values = hidden_val == '' ? [] : hidden_val.split(',');
        values.push(data.id);
        hidden_input.val(values.join());
        
        token_count++;
        
        if(settings.tokenLimit != null && settings.tokenLimit >= token_count) {
            input_box.hide();
            hide_dropdown();
        }
        cache.flush();
    }

    // Select a token in the token list
    function select_token (token) {
        token.addClass(settings.classes.selectedToken);
        selected_token = token.get(0);

        // Hide input box
        input_box.val("");

        // Hide dropdown if it is visible (eg if we clicked to select token)
        hide_dropdown();
    }

    // Deselect a token in the token list
    function deselect_token (token, position) {
        token.removeClass(settings.classes.selectedToken);
        selected_token = null;

        if(position == POSITION.BEFORE) {
            input_token.insertBefore(token);
        } else if(position == POSITION.AFTER) {
            input_token.insertAfter(token);
        } else {
            input_token.appendTo(token_list);
        }

        // Show the input box and give it focus again
        input_box.focus();
    }

    // Toggle selection of a token in the token list
    function toggle_select_token (token) {
        if(selected_token == token.get(0)) {
            deselect_token(token, POSITION.END);
        } else {
            if(selected_token) {
                deselect_token($(selected_token), POSITION.END);
            }
            select_token(token);
        }
    }

    // Delete a token from the token list
    function delete_token (token) {
        // Remove the id from the saved list
        var token_data = $.data(token.get(0), "tokeninput");

        // Delete the token
        token.remove();
        selected_token = null;

        // Show the input box and give it focus again
        input_box.focus();

        // Delete this token's id from hidden input
        var hidden_val = hidden_input.val();
        var values = hidden_val == '' ? [] : hidden_val.split(',');
        for(var i=0; i<values.length;i++ ) { 
          if(values[i]==token_data.id) {
            values.splice(i,1);
          }
        }
        hidden_input.val(values.join());
        
        token_count--;
        
        cache.flush();
        
        if (settings.tokenLimit != null) {
            input_box
                .show()
                .val("")
                .focus();
        }
    }

    // Hide and clear the results dropdown
    function hide_dropdown () {
        dropdown.hide().empty();
        selected_dropdown_item = null;
        fieldset.removeClass(settings.classes.dropdown);
        
    }

    function show_dropdown_searching () {
        fieldset.addClass(settings.classes.dropdown);
        dropdown
            .html("<p>"+settings.searchingText+"</p>")
            .show();
    }

    function show_dropdown_hint () {
        fieldset.addClass(settings.classes.dropdown);
        dropdown
            .html("<p>"+settings.hintText+"</p>")
            .show();
    }

    // Highlight the query part of the search term
	function highlight_term(value, term) {
		return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
	}

    // Populate the results dropdown with some results
    function populate_dropdown (query, results) {
      var item = [];
      for (var i = 0; i < results.length; i++) {
        results[i] = $.extend(true, {
          id: '',
          name: '',
          description: '',
          category: '',
        }, results[i]);
        if (!token_exists(results[i].id)) {
          item.push(results[i]);
        }
        else if (token_exists(results[i].id) && settings.duplicates) {
          item.push(results[i]);
        }
      }
      if(item.length) {
          dropdown.hide().empty();
          // Setup Categories
          var categories = { 'none': { title: null, items: [] }};
          for(var i in item) {
            if (settings.categories) {
              if (item[i].category == undefined || item[i].category == '') {
                item[i].category = 'none';
              }
              if (categories[item[i].category] == undefined) {
                categories[item[i].category] = { title: item[i].category, items: [] };
              }
            } 
            else {
              item[i].category = 'none';
            }
            categories[item[i].category].items.push(item[i]);
          }
          
          // Category Limit          
          function sortCategoryLength(o) {
              var sorted = {},
              key, a = [];
              for (key in o) {
                if (o.hasOwnProperty(key)) {
                  a.push(o[key]);
                }
              }
              a.sort(function compare(a,b) {
                if (a.length < b.length)
                   return -1;
                if (a.length > b.length)
                  return 1;
                return 0;
              });
              
              for (key = 0; key < a.length; key++) {
                sorted[a[key].category] = a[key].length;
              }
              return sorted;
          }
          
          var itemsLength = {};
          var categoriesLength = 0;
          $.each(categories, function(category, data){
            var length = data.items.length;
            if (length) {
              itemsLength[category] = {'category': category, 'length': length};
              categoriesLength++;
            }
          });
          
          itemsLength = sortCategoryLength(itemsLength);
          var categoryLimit, dropdownLimit = new Number(settings.dropdownLimit);
          $.each(itemsLength, function(category, length){
            categoryLimit = new Number(dropdownLimit);
            if (categoriesLength > 0) {
              categoryLimit = (categoryLimit / categoriesLength).toFixed();
            }
            if (length >= categoryLimit) {
              length = categoryLimit;
            }
            categories[category].limit = length;
            dropdownLimit -= length;
            categoriesLength--;
          });
          
          // Render each category
          $.each(categories, function(category, data){
            if (category != 'none') {
              $('<h3>').addClass(settings.classes.dropdownCategory).html(category).appendTo(dropdown);
            }
            var ul = $("<ul>").appendTo(dropdown)
                .mouseover(function (event) {
                    select_dropdown_item(get_element_from_event(event, "li"));
                })
                .click(function (event) {
                    add_token(get_element_from_event(event, "li"));
                })
                .mousedown(function (event) {
                    // Stop user selecting text on tokens
                    return false;
                });
            var limit = 0;
            $.each(data.items, function(key, item){
              if (limit >= categories[category].limit) {
                return false;
              }
              limit++;
              var li = $("<li/>").html(highlight_term(item.name, query)).appendTo(ul);
              var description = $("<span/>").addClass(settings.classes.dropdownItemDescription).html(highlight_term(item.description, query)).appendTo(li);
              if(key%2) {
                li.addClass(settings.classes.dropdownItem);
              } else {
                li.addClass(settings.classes.dropdownItemZebra);
              }
              $.data(li.get(0), "tokeninput", {"id": item.id, "name": item.name});
            });
          });
          select_dropdown_item($('li:first', dropdown));
          dropdown[settings.dropdownAnimation](settings.dropdownDuration);
      } else {
          dropdown
              .html("<p>"+settings.noResultsText+"</p>")
              [settings.dropdownAnimation](settings.dropdownDuration);
      }
    }

    // Highlight an item in the results dropdown
    function select_dropdown_item (item) {
        if(item) {
            if(selected_dropdown_item) {
                deselect_dropdown_item($(selected_dropdown_item));
            }

            item.addClass(settings.classes.selectedDropdownItem);
            selected_dropdown_item = item.get(0);
        }
    }

    // Remove highlighting from an item in the results dropdown
    function deselect_dropdown_item (item) {
        item.removeClass(settings.classes.selectedDropdownItem);
        selected_dropdown_item = null;
    }

    // Do a search and show the "searching" dropdown if the input is longer
    // than settings.minChars
    function do_search(immediate) {
        var query = input_box.val().toLowerCase();
        if (query && query.length) {
            if (selected_token) {
                deselect_token($(selected_token), POSITION.AFTER);
            }
            if (query.length >= settings.minChars) {
              var cached_results = cache.get(query);
              if(cached_results) {
                  populate_dropdown(query, cached_results);
              } else {
                show_dropdown_searching();
                if (immediate) {
                    run_search(query);
                } else {
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        run_search(query);
                    },
                    settings.searchDelay);
                }
              }
            } else {
                hide_dropdown();
            }
        }
    }

    // Do the actual search
    function run_search(query) {
        var queryStringDelimiter = settings.url.indexOf("?") < 0 ? "?": "&";
        var callback = function(results) {
            if ($.isFunction(settings.onResult)) {
                results = settings.onResult.call(this, results);
            }
            cache.add(query, settings.jsonContainer ? results[settings.jsonContainer] : results);
            populate_dropdown(query, settings.jsonContainer ? results[settings.jsonContainer] : results);
        };
        var data = {};
        data[settings.queryParam] = query;
        data[settings.existingParam] = hidden_input.val().replace(/,$/, '');
        if (settings.method == "POST") {
            $.post(settings.url, data, callback, settings.contentType);
        } else {
            $.get(settings.url, data, callback, settings.contentType);
        }
    }
};

// Really basic cache for the results
$.TokenList.Cache = function (options) {
    var settings = $.extend({
        max_size: 50
    }, options);

    var data = {};
    var size = 0;

    this.flush = function () {
        data = {};
        size = 0;
    };

    this.add = function (query, results) {
        if(size > settings.max_size) {
            flush();
        }

        if(!data[query]) {
            size++;
        }

        data[query] = results;
    };

    this.get = function (query) {
        return data[query];
    };
};

})(jQuery);