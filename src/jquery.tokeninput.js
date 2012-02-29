/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.6.6 merged with https://github.com/vdepizzol/jquery-tokeninput
 * and applied fix from https://github.com/loopj/jquery-tokeninput/pull/172/files
 * by Adam Kuśmierz (https://github.com/kusmierz/jquery-tokeninput)
 *
 * Copyright (c) 2009-2012 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 */

(function ($) {
// Default settings
var DEFAULT_SETTINGS = {
    // Search settings
    method: "GET",
    queryParam: "q",
    searchDelay: 300,
    minChars: 1,
    propertyToSearch: "name",
    jsonContainer: null,
    contentType: "json",

    // Prepopulation settings
    prePopulate: null,
    processPrePopulate: false,

    // Display settings
    hintText: "Type in a search term",
    noResultsText: "No results",
    searchingText: "Searching...",
    deleteText: "&times;",
    animateDropdown: true,
    theme: null,
    zindex: 999,
    escapeHTML: true, // NEW
    makeSortable: false, // NEW

    // Tokenization settings
    tokenLimit: null,
    tokenDelimiter: ",",
    tokenQuote: "'", // NEW
    tokenQuoteEscaped: "\\'", // NEW
    allowCustomEntry: false, // NEW
    preventDuplicates: false,

    // Output settings
    tokenValue: "id",


    // Manipulation settings
    idPrefix: "token-input-",

    // Formatters
    resultsFormatter: function(item){ return "<li>" + item[this.propertyToSearch]+ "</li>" },
    tokenFormatter: function(item) { return "<li><p>" + item[this.propertyToSearch] + "</p></li>" },
    inputValueFormatter: null,

    // Callbacks
    onResult: null,
    onAdd: null,
    onDelete: null,
    onReady: null
};

// Default classes to use when theming
var DEFAULT_CLASSES = {
    tokenList: "token-input-list",
    tokenListFocused: "token-input-focus", // NEW
    token: "token-input-token",
    tokenDelete: "token-input-delete-token",
    selectedToken: "token-input-selected-token",
    highlightedToken: "token-input-highlighted-token",
    draggedToken: "token-input-dragged-token", // NEW
    draggedClone: "token-input-dragged-clone", // NEW
    dropdown: "token-input-dropdown",
    dropdownItem: "token-input-dropdown-item",
    dropdownItem2: "token-input-dropdown-item2",
    selectedDropdownItem: "token-input-selected-dropdown-item",
    inputToken: "token-input-input-token",
    disabled: "token-input-disabled",
    insertBefore: "token-input-insert-before", // NEW
    insertAfter: "token-input-insert-after" // NEW
};

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
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46,
    NUMPAD_ENTER: 108,
    COMMA: 188
};

// Additional public (exposed) methods
var methods = {
    init: function(url_or_data_or_function, options) {
        var settings = $.extend({}, DEFAULT_SETTINGS, options || {});

        return this.each(function () {
            $(this).data("tokenInputObject", new $.TokenList(this, url_or_data_or_function, settings));
        });
    },
    clear: function() {
        this.data("tokenInputObject").clear();
        return this;
    },
    add: function(item) {
        this.data("tokenInputObject").add(item);
        return this;
    },
    remove: function(item) {
        this.data("tokenInputObject").remove(item);
        return this;
    },
    get: function() {
        return this.data("tokenInputObject").getTokens();
    },
    toggleDisabled: function(disable) {
        this.data("tokenInputObject").toggleDisabled(disable);
        return this;
   	}
}

// Expose the .tokenInput function to jQuery as a plugin
$.fn.tokenInput = function (method) {
    // Method calling and initialization logic
    if(methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        return methods.init.apply(this, arguments);
    }
};

// TokenList class for each input
$.TokenList = function (input, url_or_data_or_function, settings) {
    //
    // Initialization
    //

    // Configure the data source
    if($.type(url_or_data_or_function) === "string" || $.type(url_or_data_or_function) === "function") {
        // Set the url to query against
        settings.url = url_or_data_or_function;

        // If the URL is a function, evaluate it here to do our initalization work
        var url = computeURL();

        // Make a smart guess about cross-domain if it wasn't explicitly specified
        if(settings.crossDomain === undefined && typeof url === "string") {
            if(url.indexOf("://") === -1) {
                settings.crossDomain = false;
            } else {
                settings.crossDomain = (location.href.split(/\/+/g)[1] !== url.split(/\/+/g)[1]);
            }
        }
    } else if(typeof(url_or_data_or_function) === "object") {
        // Set the local data to search through
        settings.local_data = url_or_data_or_function;
    }

    // Build class names
    if(settings.classes) {
        // Use custom class names
        settings.classes = $.extend({}, DEFAULT_CLASSES, settings.classes);
    } else if(settings.theme) {
        // Use theme-suffixed default class names
        settings.classes = {};
        $.each(DEFAULT_CLASSES, function(key, value) {
            settings.classes[key] = value + "-" + settings.theme;
        });
    } else {
        settings.classes = DEFAULT_CLASSES;
    }


    // Save the tokens
    var saved_tokens = {};

    // Keep track of the number of tokens in the list
    var token_count = 0;

    // Basic cache to save on db hits
    var cache = new $.TokenList.Cache();

    // Keep track of the timeout, old vals
    var timeout;
    var input_val;

    // Create a new text input an attach keyup events
    var input_box = $("<input type=\"text\"  autocomplete=\"off\">")
        .css({
            outline: "none"
        })
        .attr("id", settings.idPrefix + input[settings.tokenValue])
        .focus(function () {
            if (settings.disabled) {
                return false;
            } else if (settings.tokenLimit === null || settings.tokenLimit !== token_count) {
                show_dropdown_hint();
            }
            if($(input_box).is(":visible")) {
                token_list.addClass(settings.classes.tokenListFocused);
            }
        })
        .blur(function () {
            if(selected_token) {
                deselect_token($(selected_token));
            }
            token_list.removeClass(settings.classes.tokenListFocused);
            hide_dropdown();
            $(this).val("");
        })
        .bind("keyup keydown blur update", resize_input)
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
                            if(event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) {
                                deselect_token($(selected_token), POSITION.BEFORE);
                            } else {
                                deselect_token($(selected_token), POSITION.AFTER);
                            }
                        } else if((event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) && previous_token.length) {
                            if(selected_token) {
                                deselect_token($(selected_token));
                            }
                            // We are moving left, select the previous token if it exists
                            select_token($(previous_token.get(0)));
                        } else if((event.keyCode === KEY.RIGHT || event.keyCode === KEY.DOWN) && next_token.length) {
                            if(selected_token) {
                                deselect_token($(selected_token));
                            }
                            // We are moving right, select the next token if it exists
                            select_token($(next_token.get(0)));
                        }
                    } else {
                        var dropdown_item = null;

                        if(settings.allowCustomEntry == true) {

                            if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                                if($(selected_dropdown_item).length) {
                                    if($(selected_dropdown_item).next().length) {
                                        dropdown_item = $(selected_dropdown_item).next();
                                    } else {
                                        deselect_dropdown_item($(selected_dropdown_item));
                                    }
                                } else {
                                    dropdown_item = $(dropdown).find('li:first-child');
                                }
                            } else if(event.keyCode === KEY.UP  || event.keyCode === KEY.LEFT) {
                                if($(selected_dropdown_item).length) {
                                    if($(selected_dropdown_item).prev().length) {
                                        dropdown_item = $(selected_dropdown_item).prev();
                                    } else {
                                        deselect_dropdown_item($(selected_dropdown_item));
                                    }
                                } else {
                                    dropdown_item = $(dropdown).find('li:last-child');
                                }
                            }

                            if(dropdown_item != null) {
                                select_dropdown_item(dropdown_item);
                            }

                        } else {

                            if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                                dropdown_item = $(selected_dropdown_item).next();
                            } else {
                                dropdown_item = $(selected_dropdown_item).prev();
                            }

                            if(dropdown_item && dropdown_item.length) {
                                select_dropdown_item(dropdown_item);
                            }
                        }

                        if(event.keyCode === KEY.LEFT || event.keyCode === KEY.RIGHT) {
                            // we need to allow caret moving here
                            return true;
                        } else {
                            return false;
                        }
                    }
                    break;

                case KEY.BACKSPACE:
                    previous_token = input_token.prev();

                    if(!$(this).val().length) {
                        if(selected_token) {
                            delete_token($(selected_token));
                            hidden_input.change();
                        } else if(previous_token.length) {
                            select_token($(previous_token.get(0)));
                        }

                        return false;
                    } else if($(this).val().length === 1) {
                        hide_dropdown();
                    } else {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){do_search();}, 5);
                    }
                    break;

                case KEY.DELETE:
                    next_token = input_token.next();
                    if(!$(this).val().length) {
                        if(selected_token) {
                            delete_token($(selected_token));
                        } else if(next_token.length) {
                            select_token($(next_token.get(0)));
                        }
                    }

                    break;
                case KEY.TAB:
                case KEY.ENTER:
                case KEY.NUMPAD_ENTER:
                case KEY.COMMA:

                    if(event.keyCode == KEY.TAB && !$(input_box).val().length) {
                        hide_dropdown();
                        // let the browser handle the tab key properly if user is trying to tab through or out
                        return true;
                    }
                    if(selected_dropdown_item) {
                        add_token($(selected_dropdown_item).data("tokeninput"));
                        hidden_input.change();
                    }

                    if(settings.allowCustomEntry == true && $.trim($(input_box).val()) != '') {
                        add_token($(input_box).val());
                    }

                    return false;
                    break;

                case KEY.ESCAPE:
                  hide_dropdown();
                  return true;

                default:
                    if(String.fromCharCode(event.which)) {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){do_search();}, 5);
                    }
                    break;
            }
        });

    var unique_counter = 0;
    function get_unique_id() {
        unique_counter++;
        return 'u' + unique_counter;
    }

    // hides original input box
    // input.type = 'hidden'; // for back compability, I had to comment it

    // Keep a reference to the original input box
    var hidden_input = $(input)
                           .hide()
                           .val("")
                           .focus(function () {
                                focus_with_timeout(input_box);
                           })
                           .blur(function () {
                               input_box.blur();
                           });

    // Carry over the tab index if it's set
    input_box.attr({ tabindex: hidden_input.attr('tabindex') });

    // Keep a reference to the selected token and dropdown item
    var selected_token = null;
    var selected_token_index = 0;
    var selected_dropdown_item = null;

    // The list to store the token items in
    var token_list = $("<ul />")
        .addClass(settings.classes.tokenList + ' ' + hidden_input.attr('class'))
        .click(function (event) {
            var li = $(event.target).closest("li");
            if(li && li.get(0) && $.data(li.get(0), "tokeninput")) {
                focus_with_timeout(input_box);
                toggle_select_token(li);
            } else {
                // Deselect selected token
                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }

                // Focus input box
                focus_with_timeout(input_box);
            }
        })
        .mouseover(function (event) {
            var li = $(event.target).closest("li");
            if(li && selected_token !== this) {
                li.addClass(settings.classes.highlightedToken);
            }
        })
        .mouseout(function (event) {
            var li = $(event.target).closest("li");
            if(li && selected_token !== this) {
                li.removeClass(settings.classes.highlightedToken);
            }
        })
        .insertBefore(hidden_input);

    // The token holding the input box
    var input_token = $("<li />")
        .addClass(settings.classes.inputToken)
        .appendTo(token_list)
        .append(input_box);

    // The list to store the dropdown items in
    var dropdown = $("<div>")
        .addClass(settings.classes.dropdown)
        .appendTo("body")
        .hide();

    // Magic element to help us resize the text input
    var input_resizer = $("<tester/>")
        .insertAfter(input_box)
        .css({
            position: "absolute",
            top: -9999,
            left: -9999,
            width: "auto",
            fontSize: input_box.css("fontSize"),
            fontFamily: input_box.css("fontFamily"),
            fontWeight: input_box.css("fontWeight"),
            letterSpacing: input_box.css("letterSpacing"),
            whiteSpace: "nowrap"
        });

    // True during dragging process
    var dragging = false;

    var dragTimeout;

    // the dragged Token
    var dragToken;

    // the destination Token
    var dragDestination;

    // Pre-populate list if items exist
    hidden_input.val("");
    var li_data = settings.prePopulate || hidden_input.data("pre");
    if(settings.processPrePopulate && $.isFunction(settings.onResult)) {
        li_data = settings.onResult.call(hidden_input, li_data);
    }
    if(li_data && li_data.length) {
        $.each(li_data, function (index, value) {
            insert_token(value);
            checkTokenLimit();
        });
    }

    // Check if widget should initialize as disabled
    if (settings.disabled) {
        toggleDisabled(true);
    }

    // Initialization is done
    if($.isFunction(settings.onReady)) {
        settings.onReady.call();
    }

    //
    // Public functions
    //

    this.clear = function() {
        token_list.children("li").each(function() {
            if ($(this).children("input").length === 0) {
                delete_token($(this));
            }
        });
    }

    this.add = function(item) {
        add_token(item);
    }

    this.remove = function(item) {
        token_list.children("li[data-uniqueid]").each(function() {
            if ($(this).children("input").length === 0) {
                var currToken = $(this).data("tokeninput");
                var match = true;
                for (var prop in item) {
                    if (item[prop] !== currToken[prop]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    delete_token($(this));
                }
            }
        });
    }

    this.getTokens = function() {
   		return saved_tokens;
   	}

    this.toggleDisabled = function(disable) {
        toggleDisabled(disable);
    }

    //
    // Private functions
    //

    // Toggles the widget between enabled and disabled state, or according
    // to the [disable] parameter.
    function toggleDisabled(disable) {
        if (typeof disable === 'boolean') {
          settings.disabled = disable
        } else {
            settings.disabled = !settings.disabled;
        }
        input_box.prop('disabled', settings.disabled);
        token_list.toggleClass(settings.classes.disabled, settings.disabled);
        // if there is any token selected we deselect it
        if(selected_token) {
            deselect_token($(selected_token), POSITION.END);
        }
        hidden_input.prop('disabled', settings.disabled);
    }

    function checkTokenLimit() {
        if(settings.tokenLimit !== null && token_count >= settings.tokenLimit) {
            input_box.hide();
            hide_dropdown();
            return;
        }
    }

    function resize_input() {
        if(input_val === (input_val = input_box.val())) {return;}

        // Enter new content into resizer and resize input accordingly
        var escaped = input_val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        input_resizer.html(escaped);
        input_box.width(input_resizer.width() + 30);
    }

    function is_printable_character(keycode) {
        return ((keycode >= 48 && keycode <= 90) ||     // 0-1a-z
                (keycode >= 96 && keycode <= 111) ||    // numpad 0-9 + - / * .
                (keycode >= 186 && keycode <= 192) ||   // ; = , - . / ^
                (keycode >= 219 && keycode <= 222));    // ( \ ) '
    }

    // Inner function to a token to the list
    function insert_token(item) {
        var uniqueid = get_unique_id();

        var this_token = settings.tokenFormatter(item);
        this_token = $(this_token)
          .addClass(settings.classes.token)
          .insertBefore(input_token)
          .attr('data-uniqueid', uniqueid);


        if(settings.makeSortable) {
            addDragFunctionality(this_token);
        };


        // The 'delete token' button
        $("<span>" + settings.deleteText + "</span>")
            .addClass(settings.classes.tokenDelete)
            .appendTo(this_token)
            .click(function () {
                if (!settings.disabled) {
                    delete_token($(this).parent());
                    hidden_input.change();
                    return false;
                }
                delete_token($(this).parent());
                hidden_input.change();
                return false;
            });

        // Store data on the token
        var token_data = item;
        $.data(this_token.get(0), "tokeninput", item);

        // Save this token for duplicate checking
        // saved_tokens = saved_tokens.slice(0,selected_token_index).concat([token_data]).concat(saved_tokens.slice(selected_token_index));
        saved_tokens[uniqueid] = token_data;
        selected_token_index++;

        // Update the hidden input
        update_hidden_input(saved_tokens, hidden_input);
        token_count += 1;

        // Check the token limit
        checkTokenLimit();

        return this_token;
    }

    // Add a token to the token list based on user input
    function add_token (item) {

        if(typeof(item) === "string") {
            var li_data = {name: item};
        } else if(item[0]) {
            var li_data = $.data(item.get(0), "tokeninput");
        } else {
            var li_data = item;
        }

        if(!li_data) {
            return false;
        }

        var callback = settings.onAdd;

        // See if the token already exists and select it if we don't want duplicates
        if(token_count > 0 && settings.preventDuplicates) {
            var found_existing_token = null;
            token_list.children().each(function () {
                var existing_token = $(this);
                var existing_data = $.data(existing_token.get(0), "tokeninput");
                if(existing_data &&
                    ((existing_data[settings.tokenValue] && existing_data[settings.tokenValue] === item[settings.tokenValue]) ||
                    (!existing_data[settings.tokenValue] && existing_data[settings.propertyToSearch] === li_data[settings.propertyToSearch]))
                ) {
                    found_existing_token = existing_token;
                    return false;
                }
            });

            if(found_existing_token) {
                select_token(found_existing_token);
                input_token.insertAfter(found_existing_token);
                focus_with_timeout(input_box);
                return;
            }
        }

        // Insert the new tokens
        if(settings.tokenLimit == null || token_count < settings.tokenLimit) {
            insert_token(li_data);
            checkTokenLimit();
        }

        // Clear input box
        input_box.val("");

        // Don't show the help dropdown, they've got the idea
        hide_dropdown();

        // Execute the onAdd callback if defined
        if($.isFunction(callback)) {
            callback.call(hidden_input,li_data);
        }
    }

    //
    //  Drag and Drop  Functionality
    //
    function addDragFunctionality(token) {
        token.bind('mousedown', function() {
            var token = $(this);

            dragToken = token;

            dragTimeout = window.setTimeout(function(e) {

                if(selected_token == token) {
                    return;
                }

                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }

                select_token(token);

                var position = $(token).position();

                $(token).clone().appendTo('body').addClass(settings.classes.draggedClone).css({'top': position.top, 'left': position.left});
                token.addClass(settings.classes.draggedToken);

                dragging = true;

            }, 200);

            $(document).one('mouseup', function() {

                window.clearTimeout(dragTimeout);

                if(dragging != true) {
                    return;
                }

                dragging = false;

                $('li.'+settings.classes.draggedClone).remove();
                $('li.'+settings.classes.draggedToken).removeClass(settings.classes.draggedToken);

                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }

                if(dragDestination) {
                    move_token(token, dragDestination);
                    reindex_results();
                }
            });

            return false;
        })
            .bind('mouseover', function() {

                if(!dragging) return;

                dragDestination = $(this);

                if(is_after(dragToken, dragDestination)) {
                    dragDestination.addClass(settings.classes.insertAfter);
                } else {
                    dragDestination.addClass(settings.classes.insertBefore);
                }
            })
            .bind('mouseout', function() {

                if(!dragging) return;

                $(this).removeClass(settings.classes.insertBefore);
                $(this).removeClass(settings.classes.insertAfter);
            }).
            bind('mouseup', function(){
                $(this).removeClass(settings.classes.insertBefore);
                $(this).removeClass(settings.classes.insertAfter);
            });

        $('body').mousemove(function(e) {
            if(!dragging) return;

            $('li.'+settings.classes.draggedClone).css({'top': e.pageY, 'left': e.pageX});
        });
    }


    function move_token(token, destinationToken) {
        if(!destinationToken || token.get(0) == destinationToken.get(0)) return;

        if(is_after(token, destinationToken)) {
            token.insertAfter(destinationToken);
        } else {
            token.insertBefore(destinationToken);
        }
    }

    function is_after(first, last) {
        index_tokens();
        first = $.data(first.get(0), "tokeninput");
        last = $.data(last.get(0), "tokeninput");
        if(!first || !last) return;
        return last.index > first.index
    }


    function index_tokens() {
        var i = 0;
        token_list.find('li').each(function() {
            var data = $.data(this, "tokeninput");
            if(data) {
                data.index = i;
            }
            i++;
        });
    }

    function reindex_results() {
        var ids = [], tokens = [];
        token_list.find('li').each(function() {
            var data = $.data(this, "tokeninput");
            if(data) {
                ids.push(data[settings.tokenValue]);
                tokens.push(data);
            };
        });
        saved_tokens = tokens;
        update_hidden_input(saved_tokens, hidden_input);
    }


    // end Drag and Drop Functionality

    // Select a token in the token list
    function select_token (token) {
        if (!settings.disabled) {
            token.addClass(settings.classes.selectedToken);
            selected_token = token.get(0);

            // Hide input box
            input_box.val("").css('color', 'transparent');
        }
        // Hide dropdown if it is visible (eg if we clicked to select token)
        hide_dropdown();
    }

    // Deselect a token in the token list
    function deselect_token (token, position) {
        token.removeClass(settings.classes.selectedToken);
        selected_token = null;

        input_box.css('color', '');

        if(position === POSITION.BEFORE) {
            input_token.insertBefore(token);
            selected_token_index--;
        } else if(position === POSITION.AFTER) {
            input_token.insertAfter(token);
            selected_token_index++;
        } else {
            input_token.appendTo(token_list);
            selected_token_index = token_count;
        }

        // Show the input box and give it focus again
        focus_with_timeout(input_box);
    }

    // Toggle selection of a token in the token list
    function toggle_select_token(token) {
        var previous_selected_token = selected_token;

        if(selected_token) {
            deselect_token($(selected_token), POSITION.END);
        }

        if(previous_selected_token === token.get(0)) {
            deselect_token(token, POSITION.END);
        } else {
            select_token(token);
        }
    }

    // Delete a token from the token list
    function delete_token (token) {
        // Remove the id from the saved list
        var token_data = $.data(token.get(0), "tokeninput");
        var callback = settings.onDelete;

        var index = token.prevAll().length;
        if(index > selected_token_index) index--;

        var uniqueid = $(token).attr('data-uniqueid');

        // Delete the token
        token.remove();
        selected_token = null;

        // Show the input box and give it focus again
        focus_with_timeout(input_box);
        input_box.css('color', '');

        // Remove this token from the saved list
        delete saved_tokens[uniqueid];

        if(index < selected_token_index) selected_token_index--;

        // Update the hidden input
        update_hidden_input(saved_tokens, hidden_input);

        token_count -= 1;

        if(settings.tokenLimit !== null) {
            input_box
                .show()
                .val("");
            focus_with_timeout(input_box);
        }

        // Execute the onDelete callback if defined
        if($.isFunction(callback)) {
            callback.call(hidden_input,token_data);
        }
    }

    function format_tokens(tokens) {
        var token_ids = [];
        var regex = new RegExp(settings.tokenQuote, "gi");
        $.each(tokens, function (index, value) {
            token_ids.push(value[settings.tokenValue]
                ? value[settings.tokenValue]
                : settings.tokenQuote + value[settings.propertyToSearch].replace(regex, settings.tokenQuoteEscaped) + settings.tokenQuote
            );
        });
        return token_ids.join(settings.tokenDelimiter);
    }

    // Update the hidden input box value
    function update_hidden_input(saved_tokens, hidden_input) {
        var formatter = settings.inputValueFormatter || format_tokens;
        hidden_input.val(formatter(saved_tokens));
    }

    // Hide and clear the results dropdown
    function hide_dropdown () {
        dropdown.hide().empty();
        selected_dropdown_item = null;
    }

    function show_dropdown() {
        dropdown
            .css({
                position: "absolute",
                top: $(token_list).offset().top + $(token_list).outerHeight(),
                left: $(token_list).offset().left,
                'z-index': settings.zindex,
                zindex: settings.zindex,
                width: $(token_list).outerWidth()
            })
            .show();
    }

    function show_dropdown_searching () {
        if(settings.searchingText) {
            dropdown.html("<p>"+settings.searchingText+"</p>");
            show_dropdown();
        }
    }

    function show_dropdown_hint () {
        if(settings.hintText) {
            dropdown.html("<p>"+settings.hintText+"</p>");
            show_dropdown();
        }
    }

    // Highlight the query part of the search term
    // from http://www.alistapart.com/articles/accent-folding-for-auto-complete/
    function highlight_term(str, q) {
        str = str.toString();
        var q_folded = q.toString().removeDiacritics().toLowerCase().preg_quote().sql_regcase(); // make kind of regexp

        // create an intermediary string with hilite hints
        // example: fulani<lo> <lo>pez
        var re = new RegExp("(" + q_folded + ")", "gi");
        //  return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<b>$1</b>");
        var highlighted = str.replace(re, '<b>$1</b>');

        return highlighted;
    }

    function find_value_and_highlight_term(template, value, term) {
        // return template.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + value.preg_quote() + ")(?![^<>]*>)(?![^&;]+;)", "g"), highlight_term(value, term));
        return template.replace(new RegExp("(" + value.preg_quote() + ")", "g"), highlight_term(value, term));
    }

    // Populate the results dropdown with some results
    function populate_dropdown (query, results) {
        if(results && results.length) {
            dropdown.empty();
            var dropdown_ul = $("<ul>")
                .appendTo(dropdown)
                .mouseover(function (event) {
                    select_dropdown_item($(event.target).closest("li"));
                })
                .mousedown(function (event) {
                    add_token($(event.target).closest("li").data("tokeninput"));
                    hidden_input.change();
                    return false;
                })
                .hide();

            $.each(results, function(index, value) {

                var this_li = settings.resultsFormatter(value);

                this_li = find_value_and_highlight_term(this_li ,value[settings.propertyToSearch], query);

                this_li = $(this_li).appendTo(dropdown_ul);

                if(index % 2) {
                    this_li.addClass(settings.classes.dropdownItem);
                } else {
                    this_li.addClass(settings.classes.dropdownItem2);
                }

                if(settings.allowCustomEntry == false) {
                    if(index === 0) {
                        select_dropdown_item(this_li);
                    }
                }

                $.data(this_li.get(0), "tokeninput", value);
            });

            show_dropdown();

            if(settings.animateDropdown) {
                dropdown_ul.slideDown("fast");
            } else {
                dropdown_ul.show();
            }
        } else {
            if(settings.noResultsText && !settings.allowCustomEntry) {
                dropdown.html("<p>"+settings.noResultsText+"</p>");
                show_dropdown();
            } else {
                hide_dropdown();
            }
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

    function escapeHTML(text) {
        if(!settings.escapeHTML) return text;
        return $("<p></p>").text(text).html();
    }

    // Do a search and show the "searching" dropdown if the input is longer
    // than settings.minChars
    function do_search() {
        var query = input_box.val().toLowerCase();

        checkTokenLimit();

        if(query && query.length) {
            if(selected_token) {
                deselect_token($(selected_token), POSITION.AFTER);
            }

            if(query.length >= settings.minChars) {
                show_dropdown_searching();
                clearTimeout(timeout);

                timeout = setTimeout(function(){
                    run_search(query);
                }, settings.searchDelay);
            } else {
                hide_dropdown();
            }
        }
    }

    // Do the actual search
    function run_search(query) {
        var cache_key = query + computeURL();
        var cached_results = cache.get(cache_key);
        if(cached_results) {
            populate_dropdown(query, cached_results);
        } else {
            // Are we doing an ajax search or local data search?
            if(settings.url) {
                var url = computeURL();
                // Extract exisiting get params
                var ajax_params = {};
                ajax_params.data = {};
                if(url.indexOf("?") > -1) {
                    var parts = url.split("?");
                    ajax_params.url = parts[0];

                    var param_array = parts[1].split("&");
                    $.each(param_array, function (index, value) {
                        var kv = value.split("=");
                        ajax_params.data[kv[0]] = kv[1];
                    });
                } else {
                    ajax_params.url = url;
                }

                // Prepare the request
                ajax_params.data[settings.queryParam] = query;
                ajax_params.type = settings.method;
                ajax_params.dataType = settings.contentType;
                if(settings.crossDomain) {
                    ajax_params.dataType = "jsonp";
                }

                // Attach the success callback
                ajax_params.success = function(results) {
                  if($.isFunction(settings.onResult)) {
                      results = settings.onResult.call(hidden_input, results);
                  }
                  cache.add(cache_key, settings.jsonContainer ? results[settings.jsonContainer] : results);

                  // only populate the dropdown if the results are associated with the active search query
                  if(input_box.val().toLowerCase() === query) {
                      populate_dropdown(query, settings.jsonContainer ? results[settings.jsonContainer] : results);
                  }
                };

                // Make the request
                $.ajax(ajax_params);
            } else if(settings.local_data) {
                // Do the search through local data
                var results = $.grep(settings.local_data, function (row) {
                    var founded = false;
                    return row[settings.propertyToSearch].toString().toLowerCase().removeDiacritics().indexOf(query.toString().toLowerCase().removeDiacritics()) > -1;
                });

                if($.isFunction(settings.onResult)) {
                    results = settings.onResult.call(hidden_input, results);
                }
                cache.add(cache_key, results);
                populate_dropdown(query, results);
            }
        }
    }

    // compute the dynamic URL
    function computeURL() {
        var url = settings.url;
        if(typeof settings.url == 'function') {
            url = settings.url.call(settings);
        }
        return url;
    }
};

// works almost as php equivalent
String.prototype.sql_regcase = function() {
    var str = this;

    var reversedAccentMap = {
        '0': ['０'],
        '1': ['１'],
        '2': ['２'],
        '3': ['３'],
        '4': ['４'],
        '5': ['５'],
        '6': ['６'],
        '7': ['７'],
        '8': ['８'],
        '9': ['９'],
        'a': ['ẚ', 'Á', 'á', 'À', 'à', 'Ă', 'ă', 'Ắ', 'ắ', 'Ằ', 'ằ', 'Ẵ', 'ẵ', 'Ẳ', 'ẳ', 'Â', 'â', 'Ấ', 'ấ', 'Ầ', 'ầ', 'Ẫ', 'ẫ', 'Ẩ', 'ẩ', 'Ǎ', 'ǎ', 'Å', 'å', 'Ǻ', 'ǻ', 'Ä', 'ä', 'Ǟ', 'ǟ', 'Ã', 'ã', 'Ȧ', 'ȧ', 'Ǡ', 'ǡ', 'Ą', 'ą', 'Ā', 'ā', 'Ả', 'ả', 'Ȁ', 'ȁ', 'Ȃ', 'ȃ', 'Ạ', 'ạ', 'Ặ', 'ặ', 'Ậ', 'ậ', 'Ḁ', 'ḁ', 'Ⱥ', 'ⱥ', 'Ǽ', 'ǽ', 'Ǣ', 'ǣ', 'Ĺ', 'ａ'],
        'b': ['Ḃ', 'ḃ', 'Ḅ', 'ḅ', 'Ḇ', 'ḇ', 'Ƀ', 'ƀ', 'ᵬ', 'Ɓ', 'ɓ', 'Ƃ', 'ƃ', 'ｂ'],
        'c': ['Ć', 'ć', 'Ĉ', 'ĉ', 'Č', 'č', 'Ċ', 'ċ', 'Ç', 'ç', 'Ḉ', 'ḉ', 'Ȼ', 'ȼ', 'Ƈ', 'ƈ', 'ɕ', 'ｃ'],
        'd': ['Ď', 'ď', 'Ḋ', 'ḋ', 'Ḑ', 'ḑ', 'Ḍ', 'ḍ', 'Ḓ', 'ḓ', 'Ḏ', 'ḏ', 'Đ', 'đ', 'ᵭ', 'Ɖ', 'ɖ', 'Ɗ', 'ɗ', 'Ƌ', 'ƌ', 'ȡ', 'ð', 'ｄ'],
        'e': ['É', 'Ə', 'Ǝ', 'ǝ', 'é', 'È', 'è', 'Ĕ', 'ĕ', 'Ê', 'ê', 'Ế', 'ế', 'Ề', 'ề', 'Ễ', 'ễ', 'Ể', 'ể', 'Ě', 'ě', 'Ë', 'ë', 'Ẽ', 'ẽ', 'Ė', 'ė', 'Ȩ', 'ȩ', 'Ḝ', 'ḝ', 'Ę', 'ę', 'Ē', 'ē', 'Ḗ', 'ḗ', 'Ḕ', 'ḕ', 'Ẻ', 'ẻ', 'Ȅ', 'ȅ', 'Ȇ', 'ȇ', 'Ẹ', 'ẹ', 'Ệ', 'ệ', 'Ḙ', 'ḙ', 'Ḛ', 'ḛ', 'Ɇ', 'ɇ', 'ɚ', 'ɝ', 'ｅ'],
        'f': ['Ḟ', 'ḟ', 'ᵮ', 'Ƒ', 'ƒ', 'ｆ'],
        'g': ['Ǵ', 'ǵ', 'Ğ', 'ğ', 'Ĝ', 'ĝ', 'Ǧ', 'ǧ', 'Ġ', 'ġ', 'Ģ', 'ģ', 'Ḡ', 'ḡ', 'Ǥ', 'ǥ', 'Ɠ', 'ɠ', 'ｇ'],
        'h': ['Ĥ', 'ĥ', 'Ȟ', 'ȟ', 'Ḧ', 'ḧ', 'Ḣ', 'ḣ', 'Ḩ', 'ḩ', 'Ḥ', 'ḥ', 'Ḫ', 'ḫ', 'H', '̱', 'ẖ', 'Ħ', 'ħ', 'Ⱨ', 'ⱨ', 'ｈ'],
        'i': ['Í', 'í', 'Ì', 'ì', 'Ĭ', 'ĭ', 'Î', 'î', 'Ǐ', 'ǐ', 'Ï', 'ï', 'Ḯ', 'ḯ', 'Ĩ', 'ĩ', 'İ', 'i', 'Į', 'į', 'Ī', 'ī', 'Ỉ', 'ỉ', 'Ȉ', 'ȉ', 'Ȋ', 'ȋ', 'Ị', 'ị', 'Ḭ', 'ḭ', 'I', 'ı', 'Ɨ', 'ɨ', 'ｉ'],
        'j': ['Ĵ', 'ĵ', 'J', '̌', 'ǰ', 'ȷ', 'Ɉ', 'ɉ', 'ʝ', 'ɟ', 'ʄ', 'ｊ'],
        'k': ['Ḱ', 'ḱ', 'Ǩ', 'ǩ', 'Ķ', 'ķ', 'Ḳ', 'ḳ', 'Ḵ', 'ḵ', 'Ƙ', 'ƙ', 'Ⱪ', 'ⱪ', 'ｋ'],
        'l': ['ĺ', 'Ľ', 'ľ', 'Ļ', 'ļ', 'Ḷ', 'ḷ', 'Ḹ', 'ḹ', 'Ḽ', 'ḽ', 'Ḻ', 'ḻ', 'Ł', 'ł', '̣', 'Ŀ', 'ŀ', 'Ƚ', 'ƚ', 'Ⱡ', 'ⱡ', 'Ɫ', 'ɫ', 'ɬ', 'ɭ', 'ȴ', 'ｌ'],
        'm': ['Ḿ', 'ḿ', 'Ṁ', 'ṁ', 'Ṃ', 'ṃ', 'ɱ', 'ｍ'],
        'n': ['Ń', 'ń', 'Ǹ', 'ǹ', 'Ň', 'ň', 'Ñ', 'ñ', 'Ṅ', 'ṅ', 'Ņ', 'ņ', 'Ṇ', 'ṇ', 'Ṋ', 'ṋ', 'Ṉ', 'ṉ', 'Ɲ', 'ɲ', 'Ƞ', 'ƞ', 'ɳ', 'ȵ', 'N', 'n', 'ｎ'],
        't': ['̈', 'Þ', 'þ', 'Ť', 'ť', 'T', 'ẗ', 'Ṫ', 'ṫ', 'Ţ', 'ţ', 'Ṭ', 'ṭ', 'Ț', 'ț', 'Ṱ', 'ṱ', 'Ṯ', 'ṯ', 'Ŧ', 'ŧ', 'Ⱦ', 'ⱦ', 'ᵵ', 'ƫ', 'Ƭ', 'ƭ', 'Ʈ', 'ʈ', 'ȶ', 'ｔ'],
        'o': ['Ó', 'ó', 'Ò', 'ò', 'Ŏ', 'ŏ', 'Ô', 'ô', 'Ố', 'ố', 'Ồ', 'ồ', 'Ỗ', 'ỗ', 'Ổ', 'ổ', 'Ǒ', 'ǒ', 'Ö', 'ö', 'Ȫ', 'ȫ', 'Ő', 'ő', 'Õ', 'õ', 'Ṍ', 'ṍ', 'Ṏ', 'ṏ', 'Ȭ', 'ȭ', 'Ȯ', 'ȯ', 'Ȱ', 'ȱ', 'Ø', 'ø', 'Ǿ', 'ǿ', 'Ǫ', 'ǫ', 'Ǭ', 'ǭ', 'Ō', 'ō', 'Ṓ', 'ṓ', 'Ṑ', 'ṑ', 'Ỏ', 'ỏ', 'Ȍ', 'ȍ', 'Ȏ', 'ȏ', 'Ơ', 'ơ', 'Ớ', 'ớ', 'Ờ', 'ờ', 'Ỡ', 'ỡ', 'Ở', 'ở', 'Ợ', 'ợ', 'Ọ', 'ọ', 'Ộ', 'ộ', 'Ɵ', 'ɵ', 'ｏ'],
        'p': ['Ṕ', 'ṕ', 'Ṗ', 'ṗ', 'Ᵽ', 'Ƥ', 'ƥ', 'P', '̃', 'p', 'ｐ'],
        'q': ['ʠ', 'Ɋ', 'ɋ', 'ｑ'],
        'r': ['Ŕ', 'ŕ', 'Ř', 'ř', 'Ṙ', 'ṙ', 'Ŗ', 'ŗ', 'Ȑ', 'ȑ', 'Ȓ', 'ȓ', 'Ṛ', 'ṛ', 'Ṝ', 'ṝ', 'Ṟ', 'ṟ', 'Ɍ', 'ɍ', 'ᵲ', 'ɼ', 'Ɽ', 'ɽ', 'ɾ', 'ᵳ', 'ｒ'],
        's': ['ß', 'Ś', 'ś', 'Ṥ', 'ṥ', 'Ŝ', 'ŝ', 'Š', 'š', 'Ṧ', 'ṧ', 'Ṡ', 'ṡ', 'ẛ', 'Ş', 'ş', 'Ṣ', 'ṣ', 'Ṩ', 'ṩ', 'Ș', 'ș', 'ʂ', 'S', '̩', 's', 'ｓ'],
        'u': ['Ú', 'ú', 'Ù', 'ù', 'Ŭ', 'ŭ', 'Û', 'û', 'Ǔ', 'ǔ', 'Ů', 'ů', 'Ü', 'ü', 'Ǘ', 'ǘ', 'Ǜ', 'ǜ', 'Ǚ', 'ǚ', 'Ǖ', 'ǖ', 'Ű', 'ű', 'Ũ', 'ũ', 'Ṹ', 'ṹ', 'Ų', 'ų', 'Ū', 'ū', 'Ṻ', 'ṻ', 'Ủ', 'ủ', 'Ȕ', 'ȕ', 'Ȗ', 'ȗ', 'Ư', 'ư', 'Ứ', 'ứ', 'Ừ', 'ừ', 'Ữ', 'ữ', 'Ử', 'ử', 'Ự', 'ự', 'Ụ', 'ụ', 'Ṳ', 'ṳ', 'Ṷ', 'ṷ', 'Ṵ', 'ṵ', 'Ʉ', 'ʉ', 'ｕ'],
        'v': ['Ṽ', 'ṽ', 'Ṿ', 'ṿ', 'Ʋ', 'ʋ', 'ｖ'],
        'w': ['Ẃ', 'ẃ', 'Ẁ', 'ẁ', 'Ŵ', 'ŵ', 'W', 'ẘ', 'Ẅ', 'ẅ', 'Ẇ', 'ẇ', 'Ẉ', 'ẉ', 'ｗ'],
        'y': ['̊', 'Ý', 'ý', 'Ỳ', 'ỳ', 'Ŷ', 'ŷ', 'Y', 'ẙ', 'Ÿ', 'ÿ', 'Ỹ', 'ỹ', 'Ẏ', 'ẏ', 'Ȳ', 'ȳ', 'Ỷ', 'ỷ', 'Ỵ', 'ỵ', 'ʏ', 'Ɏ', 'ɏ', 'Ƴ', 'ƴ', 'ｙ'],
        'x': ['Ẍ', 'ẍ', 'Ẋ', 'ẋ', 'ｘ'],
        'z': ['Ź', 'ź', 'Ẑ', 'ẑ', 'Ž', 'ž', 'Ż', 'ż', 'Ẓ', 'ẓ', 'Ẕ', 'ẕ', 'Ƶ', 'ƶ', 'Ȥ', 'ȥ', 'ʐ', 'ʑ', 'Ⱬ', 'ⱬ', 'Ǯ', 'ǯ', 'ƺ', 'ｚ'],
        'B': ['Ｂ'],
        'F': ['Ｆ'],
        'J': ['Ｊ'],
        'N': ['Ｎ'],
        'R': ['Ｒ'],
        'V': ['Ｖ'],
        'Z': ['Ｚ'],
        'A': ['Ａ'],
        'E': ['Ｅ'],
        'I': ['Ｉ'],
        'M': ['Ｍ'],
        'Q': ['Ｑ'],
        'U': ['Ｕ'],
        'Y': ['Ｙ'],
        'D': ['Ｄ'],
        'H': ['Ｈ'],
        'L': ['Ｌ'],
        'P': ['Ｐ'],
        'T': ['Ｔ'],
        'X': ['Ｘ'],
        'C': ['Ｃ'],
        'G': ['Ｇ'],
        'K': ['Ｋ'],
        'O': ['Ｏ'],
        'S': ['Ｓ'],
        'W': ['Ｗ']
    };

    var ret = '';
    for (var i = 0; i < str.length; i++) {
        if (reversedAccentMap[str.charAt(i)]) {
            ret += '[' + str.charAt(i) + reversedAccentMap[str.charAt(i)].join('') + ']';
        } else {
            ret += str.charAt(i);
        }
    }
    return ret;
};


// Works as php's preg_quote
String.prototype.preg_quote = function(delimiter) {
    var str = this;
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

// Remove Diacritics
// @see http://www.alistapart.com/articles/accent-folding-for-auto-complete/
String.prototype.removeDiacritics = function () {

    var str = this;

    if (!str) {
        return '';
    }

    var accent_map = {
        'ẚ':'a', 'Á':'a', 'á':'a', 'À':'a', 'à':'a', 'Ă':'a', 'ă':'a', 'Ắ':'a', 'ắ':'a', 'Ằ':'a', 'ằ':'a', 'Ẵ':'a', 'ẵ':'a', 'Ẳ':'a', 'ẳ':'a', 'Â':'a', 'â':'a', 'Ấ':'a', 'ấ':'a', 'Ầ':'a', 'ầ':'a', 'Ẫ':'a', 'ẫ':'a', 'Ẩ':'a', 'ẩ':'a', 'Ǎ':'a', 'ǎ':'a', 'Å':'a', 'å':'a', 'Ǻ':'a', 'ǻ':'a', 'Ä':'a', 'ä':'a', 'Ǟ':'a', 'ǟ':'a', 'Ã':'a', 'ã':'a', 'Ȧ':'a', 'ȧ':'a', 'Ǡ':'a', 'ǡ':'a', 'Ą':'a', 'ą':'a', 'Ā':'a', 'ā':'a', 'Ả':'a', 'ả':'a', 'Ȁ':'a', 'ȁ':'a', 'Ȃ':'a', 'ȃ':'a', 'Ạ':'a', 'ạ':'a', 'Ặ':'a', 'ặ':'a', 'Ậ':'a', 'ậ':'a', 'Ḁ':'a', 'ḁ':'a', 'Ⱥ':'a', 'ⱥ':'a', 'Ǽ':'a', 'ǽ':'a', 'Ǣ':'a', 'ǣ':'a',
        'Ḃ':'b', 'ḃ':'b', 'Ḅ':'b', 'ḅ':'b', 'Ḇ':'b', 'ḇ':'b', 'Ƀ':'b', 'ƀ':'b', 'ᵬ':'b', 'Ɓ':'b', 'ɓ':'b', 'Ƃ':'b', 'ƃ':'b',
        'Ć':'c', 'ć':'c', 'Ĉ':'c', 'ĉ':'c', 'Č':'c', 'č':'c', 'Ċ':'c', 'ċ':'c', 'Ç':'c', 'ç':'c', 'Ḉ':'c', 'ḉ':'c', 'Ȼ':'c', 'ȼ':'c', 'Ƈ':'c', 'ƈ':'c', 'ɕ':'c',
        'Ď':'d', 'ď':'d', 'Ḋ':'d', 'ḋ':'d', 'Ḑ':'d', 'ḑ':'d', 'Ḍ':'d', 'ḍ':'d', 'Ḓ':'d', 'ḓ':'d', 'Ḏ':'d', 'ḏ':'d', 'Đ':'d', 'đ':'d', 'ᵭ':'d', 'Ɖ':'d', 'ɖ':'d', 'Ɗ':'d', 'ɗ':'d', 'Ƌ':'d', 'ƌ':'d', 'ȡ':'d', 'ð':'d',
        'É':'e', 'Ə':'e', 'Ǝ':'e', 'ǝ':'e', 'é':'e', 'È':'e', 'è':'e', 'Ĕ':'e', 'ĕ':'e', 'Ê':'e', 'ê':'e', 'Ế':'e', 'ế':'e', 'Ề':'e', 'ề':'e', 'Ễ':'e', 'ễ':'e', 'Ể':'e', 'ể':'e', 'Ě':'e', 'ě':'e', 'Ë':'e', 'ë':'e', 'Ẽ':'e', 'ẽ':'e', 'Ė':'e', 'ė':'e', 'Ȩ':'e', 'ȩ':'e', 'Ḝ':'e', 'ḝ':'e', 'Ę':'e', 'ę':'e', 'Ē':'e', 'ē':'e', 'Ḗ':'e', 'ḗ':'e', 'Ḕ':'e', 'ḕ':'e', 'Ẻ':'e', 'ẻ':'e', 'Ȅ':'e', 'ȅ':'e', 'Ȇ':'e', 'ȇ':'e', 'Ẹ':'e', 'ẹ':'e', 'Ệ':'e', 'ệ':'e', 'Ḙ':'e', 'ḙ':'e', 'Ḛ':'e', 'ḛ':'e', 'Ɇ':'e', 'ɇ':'e', 'ɚ':'e', 'ɝ':'e',
        'Ḟ':'f', 'ḟ':'f', 'ᵮ':'f', 'Ƒ':'f', 'ƒ':'f',
        'Ǵ':'g', 'ǵ':'g', 'Ğ':'g', 'ğ':'g', 'Ĝ':'g', 'ĝ':'g', 'Ǧ':'g', 'ǧ':'g', 'Ġ':'g', 'ġ':'g', 'Ģ':'g', 'ģ':'g', 'Ḡ':'g', 'ḡ':'g', 'Ǥ':'g', 'ǥ':'g', 'Ɠ':'g', 'ɠ':'g',
        'Ĥ':'h', 'ĥ':'h', 'Ȟ':'h', 'ȟ':'h', 'Ḧ':'h', 'ḧ':'h', 'Ḣ':'h', 'ḣ':'h', 'Ḩ':'h', 'ḩ':'h', 'Ḥ':'h', 'ḥ':'h', 'Ḫ':'h', 'ḫ':'h', 'H':'h', '̱':'h', 'ẖ':'h', 'Ħ':'h', 'ħ':'h', 'Ⱨ':'h', 'ⱨ':'h',
        'Í':'i', 'í':'i', 'Ì':'i', 'ì':'i', 'Ĭ':'i', 'ĭ':'i', 'Î':'i', 'î':'i', 'Ǐ':'i', 'ǐ':'i', 'Ï':'i', 'ï':'i', 'Ḯ':'i', 'ḯ':'i', 'Ĩ':'i', 'ĩ':'i', 'İ':'i', 'i':'i', 'Į':'i', 'į':'i', 'Ī':'i', 'ī':'i', 'Ỉ':'i', 'ỉ':'i', 'Ȉ':'i', 'ȉ':'i', 'Ȋ':'i', 'ȋ':'i', 'Ị':'i', 'ị':'i', 'Ḭ':'i', 'ḭ':'i', 'I':'i', 'ı':'i', 'Ɨ':'i', 'ɨ':'i',
        'Ĵ':'j', 'ĵ':'j', 'J':'j', '̌':'j', 'ǰ':'j', 'ȷ':'j', 'Ɉ':'j', 'ɉ':'j', 'ʝ':'j', 'ɟ':'j', 'ʄ':'j',
        'Ḱ':'k', 'ḱ':'k', 'Ǩ':'k', 'ǩ':'k', 'Ķ':'k', 'ķ':'k', 'Ḳ':'k', 'ḳ':'k', 'Ḵ':'k', 'ḵ':'k', 'Ƙ':'k', 'ƙ':'k', 'Ⱪ':'k', 'ⱪ':'k',
        'Ĺ':'a', 'ĺ':'l', 'Ľ':'l', 'ľ':'l', 'Ļ':'l', 'ļ':'l', 'Ḷ':'l', 'ḷ':'l', 'Ḹ':'l', 'ḹ':'l', 'Ḽ':'l', 'ḽ':'l', 'Ḻ':'l', 'ḻ':'l', 'Ł':'l', 'ł':'l', 'Ł':'l', '̣':'l', 'ł':'l', '̣':'l', 'Ŀ':'l', 'ŀ':'l', 'Ƚ':'l', 'ƚ':'l', 'Ⱡ':'l', 'ⱡ':'l', 'Ɫ':'l', 'ɫ':'l', 'ɬ':'l', 'ɭ':'l', 'ȴ':'l',
        'Ḿ':'m', 'ḿ':'m', 'Ṁ':'m', 'ṁ':'m', 'Ṃ':'m', 'ṃ':'m', 'ɱ':'m',
        'Ń':'n', 'ń':'n', 'Ǹ':'n', 'ǹ':'n', 'Ň':'n', 'ň':'n', 'Ñ':'n', 'ñ':'n', 'Ṅ':'n', 'ṅ':'n', 'Ņ':'n', 'ņ':'n', 'Ṇ':'n', 'ṇ':'n', 'Ṋ':'n', 'ṋ':'n', 'Ṉ':'n', 'ṉ':'n', 'Ɲ':'n', 'ɲ':'n', 'Ƞ':'n', 'ƞ':'n', 'ɳ':'n', 'ȵ':'n', 'N':'n', '̈':'n', 'n':'n', '̈':'n',
        'Ó':'o', 'ó':'o', 'Ò':'o', 'ò':'o', 'Ŏ':'o', 'ŏ':'o', 'Ô':'o', 'ô':'o', 'Ố':'o', 'ố':'o', 'Ồ':'o', 'ồ':'o', 'Ỗ':'o', 'ỗ':'o', 'Ổ':'o', 'ổ':'o', 'Ǒ':'o', 'ǒ':'o', 'Ö':'o', 'ö':'o', 'Ȫ':'o', 'ȫ':'o', 'Ő':'o', 'ő':'o', 'Õ':'o', 'õ':'o', 'Ṍ':'o', 'ṍ':'o', 'Ṏ':'o', 'ṏ':'o', 'Ȭ':'o', 'ȭ':'o', 'Ȯ':'o', 'ȯ':'o', 'Ȱ':'o', 'ȱ':'o', 'Ø':'o', 'ø':'o', 'Ǿ':'o', 'ǿ':'o', 'Ǫ':'o', 'ǫ':'o', 'Ǭ':'o', 'ǭ':'o', 'Ō':'o', 'ō':'o', 'Ṓ':'o', 'ṓ':'o', 'Ṑ':'o', 'ṑ':'o', 'Ỏ':'o', 'ỏ':'o', 'Ȍ':'o', 'ȍ':'o', 'Ȏ':'o', 'ȏ':'o', 'Ơ':'o', 'ơ':'o', 'Ớ':'o', 'ớ':'o', 'Ờ':'o', 'ờ':'o', 'Ỡ':'o', 'ỡ':'o', 'Ở':'o', 'ở':'o', 'Ợ':'o', 'ợ':'o', 'Ọ':'o', 'ọ':'o', 'Ộ':'o', 'ộ':'o', 'Ɵ':'o', 'ɵ':'o',
        'Ṕ':'p', 'ṕ':'p', 'Ṗ':'p', 'ṗ':'p', 'Ᵽ':'p', 'Ƥ':'p', 'ƥ':'p', 'P':'p', '̃':'p', 'p':'p', '̃':'p',
        'ʠ':'q', 'Ɋ':'q', 'ɋ':'q',
        'Ŕ':'r', 'ŕ':'r', 'Ř':'r', 'ř':'r', 'Ṙ':'r', 'ṙ':'r', 'Ŗ':'r', 'ŗ':'r', 'Ȑ':'r', 'ȑ':'r', 'Ȓ':'r', 'ȓ':'r', 'Ṛ':'r', 'ṛ':'r', 'Ṝ':'r', 'ṝ':'r', 'Ṟ':'r', 'ṟ':'r', 'Ɍ':'r', 'ɍ':'r', 'ᵲ':'r', 'ɼ':'r', 'Ɽ':'r', 'ɽ':'r', 'ɾ':'r', 'ᵳ':'r',
        'ß':'s', 'Ś':'s', 'ś':'s', 'Ṥ':'s', 'ṥ':'s', 'Ŝ':'s', 'ŝ':'s', 'Š':'s', 'š':'s', 'Ṧ':'s', 'ṧ':'s', 'Ṡ':'s', 'ṡ':'s', 'ẛ':'s', 'Ş':'s', 'ş':'s', 'Ṣ':'s', 'ṣ':'s', 'Ṩ':'s', 'ṩ':'s', 'Ș':'s', 'ș':'s', 'ʂ':'s', 'S':'s', '̩':'s', 's':'s', '̩':'s',
        'Þ':'t', 'þ':'t', 'Ť':'t', 'ť':'t', 'T':'t', '̈':'t', 'ẗ':'t', 'Ṫ':'t', 'ṫ':'t', 'Ţ':'t', 'ţ':'t', 'Ṭ':'t', 'ṭ':'t', 'Ț':'t', 'ț':'t', 'Ṱ':'t', 'ṱ':'t', 'Ṯ':'t', 'ṯ':'t', 'Ŧ':'t', 'ŧ':'t', 'Ⱦ':'t', 'ⱦ':'t', 'ᵵ':'t', 'ƫ':'t', 'Ƭ':'t', 'ƭ':'t', 'Ʈ':'t', 'ʈ':'t', 'ȶ':'t',
        'Ú':'u', 'ú':'u', 'Ù':'u', 'ù':'u', 'Ŭ':'u', 'ŭ':'u', 'Û':'u', 'û':'u', 'Ǔ':'u', 'ǔ':'u', 'Ů':'u', 'ů':'u', 'Ü':'u', 'ü':'u', 'Ǘ':'u', 'ǘ':'u', 'Ǜ':'u', 'ǜ':'u', 'Ǚ':'u', 'ǚ':'u', 'Ǖ':'u', 'ǖ':'u', 'Ű':'u', 'ű':'u', 'Ũ':'u', 'ũ':'u', 'Ṹ':'u', 'ṹ':'u', 'Ų':'u', 'ų':'u', 'Ū':'u', 'ū':'u', 'Ṻ':'u', 'ṻ':'u', 'Ủ':'u', 'ủ':'u', 'Ȕ':'u', 'ȕ':'u', 'Ȗ':'u', 'ȗ':'u', 'Ư':'u', 'ư':'u', 'Ứ':'u', 'ứ':'u', 'Ừ':'u', 'ừ':'u', 'Ữ':'u', 'ữ':'u', 'Ử':'u', 'ử':'u', 'Ự':'u', 'ự':'u', 'Ụ':'u', 'ụ':'u', 'Ṳ':'u', 'ṳ':'u', 'Ṷ':'u', 'ṷ':'u', 'Ṵ':'u', 'ṵ':'u', 'Ʉ':'u', 'ʉ':'u',
        'Ṽ':'v', 'ṽ':'v', 'Ṿ':'v', 'ṿ':'v', 'Ʋ':'v', 'ʋ':'v',
        'Ẃ':'w', 'ẃ':'w', 'Ẁ':'w', 'ẁ':'w', 'Ŵ':'w', 'ŵ':'w', 'W':'w', '̊':'w', 'ẘ':'w', 'Ẅ':'w', 'ẅ':'w', 'Ẇ':'w', 'ẇ':'w', 'Ẉ':'w', 'ẉ':'w',
        'Ẍ':'x', 'ẍ':'x', 'Ẋ':'x', 'ẋ':'x',
        'Ý':'y', 'ý':'y', 'Ỳ':'y', 'ỳ':'y', 'Ŷ':'y', 'ŷ':'y', 'Y':'y', '̊':'y', 'ẙ':'y', 'Ÿ':'y', 'ÿ':'y', 'Ỹ':'y', 'ỹ':'y', 'Ẏ':'y', 'ẏ':'y', 'Ȳ':'y', 'ȳ':'y', 'Ỷ':'y', 'ỷ':'y', 'Ỵ':'y', 'ỵ':'y', 'ʏ':'y', 'Ɏ':'y', 'ɏ':'y', 'Ƴ':'y', 'ƴ':'y',
        'Ź':'z', 'ź':'z', 'Ẑ':'z', 'ẑ':'z', 'Ž':'z', 'ž':'z', 'Ż':'z', 'ż':'z', 'Ẓ':'z', 'ẓ':'z', 'Ẕ':'z', 'ẕ':'z', 'Ƶ':'z', 'ƶ':'z', 'Ȥ':'z', 'ȥ':'z', 'ʐ':'z', 'ʑ':'z', 'Ⱬ':'z', 'ⱬ':'z', 'Ǯ':'z', 'ǯ':'z', 'ƺ':'z',
        // Roman fullwidth ascii equivalents: 0xff00 to 0xff5e
        '２':'2', '６':'6', 'Ｂ':'B', 'Ｆ':'F', 'Ｊ':'J', 'Ｎ':'N', 'Ｒ':'R', 'Ｖ':'V', 'Ｚ':'Z', 'ｂ':'b', 'ｆ':'f', 'ｊ':'j', 'ｎ':'n', 'ｒ':'r', 'ｖ':'v', 'ｚ':'z', '１':'1', '５':'5', '９':'9', 'Ａ':'A', 'Ｅ':'E', 'Ｉ':'I', 'Ｍ':'M', 'Ｑ':'Q', 'Ｕ':'U', 'Ｙ':'Y', 'ａ':'a', 'ｅ':'e', 'ｉ':'i', 'ｍ':'m', 'ｑ':'q', 'ｕ':'u', 'ｙ':'y', '０':'0', '４':'4', '８':'8', 'Ｄ':'D', 'Ｈ':'H', 'Ｌ':'L', 'Ｐ':'P', 'Ｔ':'T', 'Ｘ':'X', 'ｄ':'d', 'ｈ':'h', 'ｌ':'l', 'ｐ':'p', 'ｔ':'t', 'ｘ':'x', '３':'3', '７':'7', 'Ｃ':'C', 'Ｇ':'G', 'Ｋ':'K', 'Ｏ':'O', 'Ｓ':'S', 'Ｗ':'W', 'ｃ':'c', 'ｇ':'g', 'ｋ':'k', 'ｏ':'o', 'ｓ':'s', 'ｗ':'w'
    };

    var ret = '';
    for (var i = 0; i < str.length; i++) {
        ret += accent_map[str.charAt(i)] || str.charAt(i);
    }
    return ret;

};

// Bring browser focus to the specified object.
// Use of setTimeout is to get around an IE bug.
// (See, e.g., http://stackoverflow.com/questions/2600186/focus-doesnt-work-in-ie)
//
// obj: a jQuery object to focus()
function focus_with_timeout(obj) {
    setTimeout(function() { obj.focus(); }, 50);
}

// Really basic cache for the results
$.TokenList.Cache = function (options) {
    var settings = $.extend({
        max_size: 500
    }, options);

    var data = {};
    var size = 0;

    var flush = function () {
        data = {};
        size = 0;
    };

    this.add = function (query, results) {
        if(size > settings.max_size) {
            flush();
        }

        if(!data[query]) {
            size += 1;
        }

        data[query] = results;
    };

    this.get = function (query) {
        return data[query];
    };
};
}(jQuery));
