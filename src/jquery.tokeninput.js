/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.6.1
 *
 * Copyright (c) 2009-2014 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 */
(function ($) {

    var DEFAULT_SETTINGS = {
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
        deleteText: "&#215;",
        animateDropdown: true,
        placeholder: null,
        theme: null,
        zindex: 999,
        resultsLimit: null,

        enableHTML: false,

        resultsFormatter: function(item) {
            var string = item[this.propertyToSearch];
            return "<li>" + (this.enableHTML ? string : _escapeHTML(string)) + "</li>";
        },

        tokenFormatter: function(item) {
            var string = item[this.propertyToSearch];
            return "<li><p>" + (this.enableHTML ? string : _escapeHTML(string)) + "</p></li>";
        },

        // Tokenization settings
        tokenLimit: null,
        tokenDelimiter: ",",
        preventDuplicates: false,
        tokenValue: "id",

        // Behavioral settings
        allowFreeTagging: false,
        allowTabOut: false,

        // Callbacks
        onResult: null,
        onCachedResult: null,
        onAdd: null,
        onFreeTaggingAdd: null,
        onDelete: null,
        onReady: null,

        // Other settings
        idPrefix: "token-input-",

        // Keep track if the input is currently in disabled mode
        disabled: false
};

// Default classes to use when theming
var DEFAULT_CLASSES = {
    tokenList            : "token-input-list",
    token                : "token-input-token",
    tokenReadOnly        : "token-input-token-readonly",
    tokenDelete          : "token-input-delete-token",
    selectedToken        : "token-input-selected-token",
    highlightedToken     : "token-input-highlighted-token",
    dropdown             : "token-input-dropdown",
    dropdownItem         : "token-input-dropdown-item",
    dropdownItem2        : "token-input-dropdown-item2",
    selectedDropdownItem : "token-input-selected-dropdown-item",
    inputToken           : "token-input-input-token",
    focused              : "token-input-focused",
    disabled             : "token-input-disabled"
};

// Input box position "enum"
var POSITION = {
    BEFORE : 0,
    AFTER  : 1,
    END    : 2
};

var KEY = {
    BACKSPACE    : 8,
    TAB          : 9,
    ENTER        : 13,
    ESCAPE       : 27,
    SPACE        : 32,
    PAGE_UP      : 33,
    PAGE_DOWN    : 34,
    END          : 35,
    HOME         : 36,
    LEFT         : 37,
    UP           : 38,
    RIGHT        : 39,
    DOWN         : 40,
    NUMPAD_ENTER : 108,
    COMMA        : 188
};

var HTML_ESCAPE_CHARS = /[&<>"'\/]/g;
var HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

var Settings;

function coerceToString(val) {
  return String((val === null || val === undefined) ? '' : val);
}

function _escapeHTML(text) {
  return coerceToString(text).replace(HTML_ESCAPE_CHARS, function(match) {
    return HTML_ESCAPES[match];
  });
}

// Additional public (exposed) methods
var methods = {
    init: function(url_or_data_or_function, options) {
        var settings = $.extend({}, DEFAULT_SETTINGS, options || {});

        return this.each(function () {
            $(this).data("settings", settings);
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
    },
    setOptions: function(options){
        $(this).data("settings", $.extend({}, $(this).data("settings"), options || {}));
        return this;
    },
    destroy: function () {
        if(this.data("tokenInputObject")) {
            this.data("tokenInputObject").clear();
            var tmpInput = this;
            var closest = this.parent();
            closest.empty();
            tmpInput.show();
            closest.append(tmpInput);

            return tmpInput;
        }
    }
};

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
$.TokenList = function (input, source, settings) {
    Settings = $(input).data("settings");

    //
    // Initialization
    //
    // Configure the data source
    if(typeof source === "string" || typeof source === "function") {
        // Set the url to query against
        Settings.url = source;

        // If the URL is a function, evaluate it here to do our initalization work
        var url = computeURL();

        // Make a smart guess about cross-domain if it wasn't explicitly specified
        if(Settings.crossDomain === undefined && typeof url === "string") {
            if(url.indexOf("://") === -1) {
                Settings.crossDomain = false;
            } else {
                Settings.crossDomain = (location.href.split(/\/+/g)[1] !== url.split(/\/+/g)[1]);
            }
        }
    } else if(typeof source === "object") {
        // Set the local data to search through
        Settings.local_data = source;
    }

    // Build class names
    if(Settings.classes) {
        // Use custom class names
        Settings.classes = $.extend({}, DEFAULT_CLASSES, Settings.classes);
    } else if(Settings.theme) {
        // Use theme-suffixed default class names
        Settings.classes = {};
        $.each(DEFAULT_CLASSES, function(key, value) {
            Settings.classes[key] = value + "-" + Settings.theme;
        });
    } else {
        Settings.classes = DEFAULT_CLASSES;
    }

    // Save the tokens
    var saved_tokens = [];

    // Keep track of the number of tokens in the list
    var token_count = 0;

    // Basic cache to save on db hits
    var cache = new $.TokenList.Cache();

    // Keep track of the timeout, old vals
    var timeout;
    var inputValue;

    // Create a new text input an attach keyup events
    var input_box = $("<input type=\"text\"  autocomplete=\"off\" autocapitalize=\"off\"/>")
        .css({
            outline: "none"
        })
        .attr("id", Settings.idPrefix + input.id)
        .focus(function () {
            if (Settings.disabled) {
                return false;
            } else {
                if (Settings.tokenLimit === null || Settings.tokenLimit !== token_count) {
                    onDropdownShow_hint();
                }
            }

            tokenList.addClass(Settings.classes.focused);
        })
        .on("blur", function (event) {
            var target = $(event.target);

            onHideDropdown();
            if (Settings.allowFreeTagging) {
                onAddFreeTaggingToken();
            }

            target.val("");
            tokenList.removeClass(Settings.classes.focused);
        })
        .bind("keyup keydown blur update", onResizeInput)
        .on("keydown", function (event) {
            var tokenPrevious,
                tokenNext,
                target = $(event.target);

            switch(event.keyCode) {
                case KEY.LEFT:
                case KEY.RIGHT:
                case KEY.UP:
                case KEY.DOWN:

                    if(target.val().length === 0) {
                        tokenPrevious = tokenInput.prev();
                        tokenNext     = tokenInput.next();

                        if((tokenPrevious.length && tokenPrevious.get(0) === tokenSelected) || (tokenNext.length && tokenNext.get(0) === tokenSelected)) {
                            // Check if there is a previous/next token and it is selected
                            if(event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) {
                                deonTokenSelect($(tokenSelected), POSITION.BEFORE);
                            } else {
                                deonTokenSelect($(tokenSelected), POSITION.AFTER);
                            }
                        } else if((event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) && tokenPrevious.length) {
                            // We are moving left, select the previous token if it exists
                            onTokenSelect($(tokenPrevious.get(0)));
                        } else if((event.keyCode === KEY.RIGHT || event.keyCode === KEY.DOWN) && tokenNext.length) {
                            // We are moving right, select the next token if it exists
                            onTokenSelect($(tokenNext.get(0)));
                        }
                    } else {
                        var dropdownItem = null;

                        if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                            dropdownItem = $(selected_dropdownItem).next();
                        } else {
                            dropdownItem = $(selected_dropdownItem).prev();
                        }

                        if(dropdownItem.length) {
                            onDropdownItem(dropdownItem);
                        }
                    }

                    return false;
                    break;

                case KEY.BACKSPACE:
                    tokenPrevious = tokenInput.prev();

                    if(target.val().length === 0) {
                        if(tokenSelected) {
                            onDelete($(tokenSelected));
                            inputHidden.change();
                        } else if(tokenPrevious.length) {
                            onTokenSelect($(tokenPrevious.get(0)));
                        }

                        return false;
                    } else if(target.val().length === 1) {
                        onHideDropdown();
                    } else {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){
                            onSearch();
                        }, 5);
                    }
                    break;

                case KEY.TAB:
                case KEY.ENTER:
                case KEY.NUMPAD_ENTER:
                case KEY.COMMA:
                    if(selected_dropdownItem) {
                        onTokenAdd($(selected_dropdownItem).data("tokeninput"));
                        inputHidden.change();
                  } else {
                    if (Settings.allowFreeTagging) {
                        if(Settings.allowTabOut && $(this).val() === "") {
                            return true;
                        } else {
                            onAddFreeTaggingToken();
                        }
                    } else {
                        $(this).val("");
                        if(Settings.allowTabOut) {
                            return true;
                        }
                    }

                    event.stopPropagation();
                    event.preventDefault();
                  }

                  return false;

                case KEY.ESCAPE:
                  onHideDropdown();
                  return true;

                default:
                    if(String.fromCharCode(event.which)) {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){
                            onSearch();
                        }, 5);
                    }
                    break;
            }
        });

    // Keep reference for placeholder
    if (settings.placeholder) {
        input_box.attr("placeholder", settings.placeholder)
    }

    // Keep a reference to the original input box
    var inputHidden = $(input).hide().val("");

    inputHidden
        .on("focus", function () {
            onFocusWithTimeout(input_box);
        })
        .on("blur", function () {
            input_box.blur();
            // return the object to this can be referenced in the callback functions.
            return inputHidden;
        })
    ;

    // Keep a reference to the selected token and dropdown item
    var tokenSelected = null;
    var tokenSelected_index = 0;
    var selected_dropdownItem = null;

    // The list to store the token items in
    var tokenList = $("<ul />")
        .addClass(Settings.classes.tokenList)
        .on("click", function (event) {
            var li = $(event.target).closest("li");
            if(li && li.get(0) && $.data(li.get(0), "tokeninput")) {
                toggle_onTokenSelect(li);
            } else {
                // Deselect selected token
                if(tokenSelected) {
                    deonTokenSelect($(tokenSelected), POSITION.END);
                }

                // Focus input box
                onFocusWithTimeout(input_box);
            }
        })
        .on("click", function (event) {
            var li = $(event.target).closest("li");
        })
        .on("mouseover", function (event) {
            var li = $(event.target).closest("li");

            if(li && tokenSelected !== this) {
                li.addClass(Settings.classes.highlightedToken);
            }
        })
        .on("mouseout", function (event) {
            var li = $(event.target).closest("li");

            if(li && tokenSelected !== this) {
                li.removeClass(Settings.classes.highlightedToken);
            }
        })
        .insertBefore(inputHidden)
    ;

    // The token holding the input box
    var tokenInput = $("<li />")
        .addClass(Settings.classes.inputToken)
        .appendTo(tokenList)
        .append(input_box);

    // The list to store the dropdown items in
    var dropdown = $("<div/>")
        .addClass(Settings.classes.dropdown)
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

    // Pre-populate list if items exist
    inputHidden.val("");

    var li_data = Settings.prePopulate || inputHidden.data("pre");

    if(Settings.processPrePopulate && $.isFunction(Settings.onResult)) {
        li_data = Settings.onResult.call(inputHidden, li_data);
    }

    if(li_data && li_data.length) {
        $.each(li_data, function (index, value) {
            insert_token(value);
            checkTokenLimit();
            input_box.attr("placeholder", null)
        });
    }

    // Check if widget should initialize as disabled
    if (Settings.disabled) {
        toggleDisabled(true);
    }

    // Initialization is done
    if($.isFunction(Settings.onReady)) {
        Settings.onReady.call();
    }

    //
    // Public functions
    //

    this.clear = function() {
        tokenList.children("li").each(function() {
            if ($(this).children("input").length === 0) {
                onDelete($(this));
            }
        });
    };

    this.add = function(item) {
        onTokenAdd(item);
    };

    this.remove = function(item) {
        tokenList.children("li").each(function() {
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
                    onDelete($(this));
                }
            }
        });
    };

    this.getTokens = function() {
        return saved_tokens;
    };

    this.toggleDisabled = function(disable) {
        toggleDisabled(disable);
    };

    // Resize input to maximum width so the placeholder can be seen
    onResizeInput();

    //
    // Private functions
    //

    function escapeHTML(text) {
      return Settings.enableHTML ? text : _escapeHTML(text);
    }

    // Toggles the widget between enabled and disabled state, or according
    // to the [disable] parameter.
    function toggleDisabled(disable) {
        if (typeof disable === 'boolean') {
            Settings.disabled = disable
        } else {
            Settings.disabled = !Settings.disabled;
        }
        input_box.attr('disabled', Settings.disabled);
        tokenList.toggleClass(Settings.classes.disabled, Settings.disabled);
        // if there is any token selected we deselect it
        if(tokenSelected) {
            deonTokenSelect($(tokenSelected), POSITION.END);
        }
        inputHidden.attr('disabled', Settings.disabled);
    }

    function checkTokenLimit() {
        if(Settings.tokenLimit !== null && token_count >= Settings.tokenLimit) {
            input_box.hide();
            onHideDropdown();
            return;
        }
    }

    function onResizeInput() {
        if(inputValue === (inputValue = input_box.val())) {return;}

        // Get width left on the current line
        var width_left = tokenList.width() - input_box.offset().left - tokenList.offset().left;
        // Enter new content into resizer and resize input accordingly
        input_resizer.html(_escapeHTML(inputValue) || _escapeHTML(settings.placeholder));

        // Get maximum width, minimum the size of input and maximum the widget's width
        input_box.width(
            Math.min(
                tokenList.width(),
                Math.max(width_left, input_resizer.width() + 30)
            )
        );
    }

    function is_printable_character(keycode) {
        return ((keycode >= 48 && keycode <= 90) ||     // 0-1a-z
                (keycode >= 96 && keycode <= 111) ||    // numpad 0-9 + - / * .
                (keycode >= 186 && keycode <= 192) ||   // ; = , - . / ^
                (keycode >= 219 && keycode <= 222));    // ( \ ) '
    }

    function onAddFreeTaggingToken() {
        var value = $.trim(input_box.val());
        var tokens = value.split(Settings.tokenDelimiter);
        $.each(tokens, function(i, token) {

          if (!token) {
            return;
          }

          if ($.isFunction(Settings.onFreeTaggingAdd)) {
            token = Settings.onFreeTaggingAdd.call(inputHidden, token);
          }

          var object = {};

          object[Settings.tokenValue] = object[Settings.propertyToSearch] = token;
          onTokenAdd(object);

        });
    }

    // Inner function to a token to the list
    function insert_token(item) {
        var $this_token = $(Settings.tokenFormatter(item));
        var readonly = item.readonly === true ? true : false;

        if(readonly) {
            $this_token.addClass(Settings.classes.tokenReadOnly);
        }

        $this_token.addClass(Settings.classes.token).insertBefore(tokenInput);

        // The 'delete token' button
        if(!readonly) {
          $("<span>" + Settings.deleteText + "</span>")
              .addClass(Settings.classes.tokenDelete)
              .appendTo($this_token)
              .click(function () {
                  if (!Settings.disabled) {
                      onDelete($(this).parent());
                      inputHidden.change();
                      return false;
                  }
              });
        }

        // Store data on the token
        var token_data = item;
        $.data($this_token.get(0), "tokeninput", item);

        // Save this token for duplicate checking
        saved_tokens = saved_tokens.slice(0,tokenSelected_index).concat([token_data]).concat(saved_tokens.slice(tokenSelected_index));
        tokenSelected_index++;

        // Update the hidden input
        update_inputHidden(saved_tokens, inputHidden);

        token_count += 1;

        // Check the token limit
        if(Settings.tokenLimit !== null && token_count >= Settings.tokenLimit) {
            input_box.hide();
            onHideDropdown();
        }

        return $this_token;
    }

    // Add a token to the token list based on user input
    function onTokenAdd (item) {
        var callback = Settings.onAdd;

        // See if the token already exists and select it if we don't want duplicates
        if(token_count > 0 && Settings.preventDuplicates) {
            var found_existing_token = null;

            tokenList.children().each(function () {
                var existing_token = $(this);
                var existing_data = $.data(existing_token.get(0), "tokeninput");
                if(existing_data && existing_data[settings.tokenValue] === item[settings.tokenValue]) {
                    found_existing_token = existing_token;
                    return false;
                }
            });

            if(found_existing_token) {
                onTokenSelect(found_existing_token);
                tokenInput.insertAfter(found_existing_token);
                onFocusWithTimeout(input_box);
                return;
            }
        }

        // Squeeze input_box so we force no unnecessary line break
        input_box.width(0);

        // Insert the new tokens
        if(Settings.tokenLimit == null || token_count < Settings.tokenLimit) {
            insert_token(item);
            // Remove the placeholder so it's not seen after you've added a token
            input_box.attr("placeholder", null)
            checkTokenLimit();
        }

        // Clear input box
        input_box.val("");

        // Don't show the help dropdown, they've got the idea
        onHideDropdown();

        // Execute the onAdd callback if defined
        if($.isFunction(callback)) {
            callback.call(inputHidden,item);
        }
    }

    // Select a token in the token list
    function onTokenSelect (token) {
        if (!Settings.disabled) {
            token.addClass(Settings.classes.selectedToken);
            tokenSelected = token.get(0);

            // Hide input box
            input_box.val("");

            // Hide dropdown if it is visible (eg if we clicked to select token)
            onHideDropdown();
        }
    }

    // Deselect a token in the token list
    function deonTokenSelect (token, position) {
        token.removeClass(Settings.classes.selectedToken);
        tokenSelected = null;

        if(position === POSITION.BEFORE) {
            tokenInput.insertBefore(token);
            tokenSelected_index--;
        } else if(position === POSITION.AFTER) {
            tokenInput.insertAfter(token);
            tokenSelected_index++;
        } else {
            tokenInput.appendTo(tokenList);
            tokenSelected_index = token_count;
        }

        // Show the input box and give it focus again
        onFocusWithTimeout(input_box);
    }

    // Toggle selection of a token in the token list
    function toggle_onTokenSelect(token) {
        var previous_tokenSelected = tokenSelected;

        if(tokenSelected) {
            deonTokenSelect($(tokenSelected), POSITION.END);
        }

        if(previous_tokenSelected === token.get(0)) {
            deonTokenSelect(token, POSITION.END);
        } else {
            onTokenSelect(token);
        }
    }

    // Delete a token from the token list
    function onDelete (token) {
        // Remove the id from the saved list
        var token_data = $.data(token.get(0), "tokeninput");
        var callback = Settings.onDelete;

        var index = token.prevAll().length;
        if(index > tokenSelected_index) index--;

        // Delete the token
        token.remove();
        tokenSelected = null;

        // Show the input box and give it focus again
        onFocusWithTimeout(input_box);

        // Remove this token from the saved list
        saved_tokens = saved_tokens.slice(0,index).concat(saved_tokens.slice(index+1));

        if (saved_tokens.length == 0) {
            input_box.attr("placeholder", settings.placeholder)
        }

        if(index < tokenSelected_index) {
            tokenSelected_index--;
        }

        // Update the hidden input
        update_inputHidden(saved_tokens, inputHidden);

        token_count -= 1;

        if(Settings.tokenLimit !== null) {
            input_box
                .show()
                .val("");
            onFocusWithTimeout(input_box);
        }

        // Execute the onDelete callback if defined
        if($.isFunction(callback)) {
            callback.call(inputHidden,token_data);
        }
    }

    // Update the hidden input box value
    function update_inputHidden(saved_tokens, inputHidden) {
        var token_values = $.map(saved_tokens, function (el) {
            if (typeof Settings.tokenValue == 'function') {
                return Settings.tokenValue.call(this, el);
            }

            return el[Settings.tokenValue];
        });

        inputHidden.val(token_values.join(Settings.tokenDelimiter));
    }

    // Hide and clear the results dropdown
    function onHideDropdown () {
        dropdown.hide().empty();
        selected_dropdownItem = null;
    }

    function onDropdownShow() {
        dropdown.css({
            position: "absolute",
            top: tokenList.offset().top + tokenList.outerHeight(),
            left: tokenList.offset().left,
            width: tokenList.width(),
            'z-index': Settings.zindex
        }).show();
    }

    function onSearchShowDropdown () {
        if(Settings.searchingText) {
            dropdown.html("<p>" + escapeHTML(Settings.searchingText) + "</p>");
            onDropdownShow();
        }
    }

    function onDropdownShow_hint () {
        if(Settings.hintText) {
            dropdown.html("<p>" + escapeHTML(Settings.hintText) + "</p>");
            onDropdownShow();
        }
    }

    var regexp_special_chars = new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g');
    function regexp_escape(term) {
        return term.replace(regexp_special_chars, '\\$&');
    }

    // Highlight the query part of the search term
    function highlight_term(value, term) {
        return value.replace(
            new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + regexp_escape(term) + ")(?![^<>]*>)(?![^&;]+;)", "gi"),
            function(match, p1) {
                return "<b>" + escapeHTML(p1) + "</b>";
            }
        );
    }

    function find_value_and_highlight_term(template, value, term) {
        return template.replace(
            new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + regexp_escape(value) + ")(?![^<>]*>)(?![^&;]+;)", "g"),
            highlight_term(value, term)
        );
    }

    // Populate the results dropdown with some results
    function onPopulateDropdown (query, results) {
        if(results && results.length) {
            dropdown.empty();

            var dropdown_ul = $("<ul/>").appendTo(dropdown);

            dropdown_ul.on("mouseover", function (event) {
                onDropdownItem($(event.target).closest("li"));
            });

            dropdown_ul.on("mousedown", function (event) {
                onTokenAdd($(event.target).closest("li").data("tokeninput"));
                inputHidden.change();
                return false;
            });

            dropdown_ul.hide();

            if (Settings.resultsLimit && results.length > Settings.resultsLimit) {
                results = results.slice(0, Settings.resultsLimit);
            }

            $.each(results, function(index, value) {
                var this_li = Settings.resultsFormatter(value);
                    this_li = find_value_and_highlight_term(this_li ,value[Settings.propertyToSearch], query);
                    this_li = $(this_li).appendTo(dropdown_ul);

                if(index % 2) {
                    this_li.addClass(Settings.classes.dropdownItem);
                } else {
                    this_li.addClass(Settings.classes.dropdownItem2);
                }

                if(index === 0) {
                    onDropdownItem(this_li);
                }

                $.data(this_li.get(0), "tokeninput", value);
            });

            onDropdownShow();

            if(Settings.animateDropdown) {
                dropdown_ul.slideDown("fast");
            } else {
                dropdown_ul.show();
            }

        } else {
            if(Settings.noResultsText) {
                dropdown.html("<p>" + escapeHTML(Settings.noResultsText) + "</p>");
                onDropdownShow();
            }
        }
    }

    // Highlight an item in the results dropdown
    function onDropdownItem (item) {
        if(item) {
            if(selected_dropdownItem) {
                deonDropdownItem($(selected_dropdownItem));
            }

            item.addClass(Settings.classes.selectedDropdownItem);
            selected_dropdownItem = item.get(0);
        }
    }

    // Remove highlighting from an item in the results dropdown
    function deonDropdownItem (item) {
        item.removeClass(Settings.classes.selectedDropdownItem);
        selected_dropdownItem = null;
    }

    // Do a search and show the "searching" dropdown if the input is longer
    // than Settings.minChars
    function onSearch() {
        var query = input_box.val();

        if(query && query.length) {
            if(tokenSelected) {
                deonTokenSelect($(tokenSelected), POSITION.AFTER);
            }

            if(query.length >= Settings.minChars) {
                onSearchShowDropdown();
                clearTimeout(timeout);

                timeout = setTimeout(function(){
                    onSearchRun(query);
                }, Settings.searchDelay);
            } else {
                onHideDropdown();
            }
        }
    }

    // Do the actual search
    function onSearchRun(query) {
        var cacheKey = query + computeURL(),
            cached   = cache.get(cacheKey);

        if(cached) {
            if (typeof Settings.onCachedResult === "function") {
                cached = Settings.onCachedResult.call(inputHidden, cached);
            }

            onPopulateDropdown(query, cached);
        } else {

            // Are we doing an ajax search or local data search?
            if(Settings.url) {
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
                ajax_params.data[Settings.queryParam] = query;
                ajax_params.type = Settings.method;
                ajax_params.dataType = Settings.contentType;

                if(Settings.crossDomain) {
                    ajax_params.dataType = "jsonp";
                }

                // Attach the success callback
                ajax_params.success = function(results) {
                    cache.add(cacheKey, Settings.jsonContainer ? results[Settings.jsonContainer] : results);

                    if($.isFunction(Settings.onResult)) {
                        results = Settings.onResult.call(inputHidden, results);
                    }

                    // only populate the dropdown if the results are associated with the active search query
                    if(input_box.val() === query) {
                        onPopulateDropdown(query, Settings.jsonContainer ? results[Settings.jsonContainer] : results);
                    }
                };

                // Provide a beforeSend callback
                if (settings.onSend) {
                    settings.onSend(ajax_params);
                }

                // Make the request
                $.ajax(ajax_params);

            } else if(Settings.local_data) {
                // Do the search through local data
                var results = $.grep(Settings.local_data, function (row) {
                    return row[Settings.propertyToSearch].toLowerCase().indexOf(query.toLowerCase()) > -1;
                });

                cache.add(cacheKey, results);

                if(typeof Settings.onResult === "function") {
                    results = Settings.onResult.call(inputHidden, results);
                }

                onPopulateDropdown(query, results);
            }
        }
    }

    // compute the dynamic URL
    function computeURL() {
        var url = Settings.url;

        if(typeof Settings.url === "function") {
            url = Settings.url.call(Settings);
        }

        return url;
    }

    // Bring browser focus to the specified object.
    // Use of setTimeout is to get around an IE bug.
    // (See, e.g., http://stackoverflow.com/questions/2600186/focus-doesnt-work-in-ie)
    //
    // obj: a jQuery object to focus()
    function onFocusWithTimeout(object) {
        setTimeout(function() {
            object.focus();
        }, 50);
    }

};

    // Really basic cache for the results
    $.TokenList.Cache = function (options) {
        var settings = $.extend({ max_size: 500 }, options),
            data  = {},
            size  = 0,
            flush = function () {
                data  = {};
                size  = 0;
            }
        ;

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

