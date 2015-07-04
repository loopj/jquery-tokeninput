

$(document).ready(function() {
    $("input[type=button]").click(function () {
        alert("Would submit: " + $(this).siblings("input[type=text]").val());
    });

    $("#basic-use").tokenInput(exampleList, { });
    $("#demo-input-local").tokenInput(alphabetList);
    $("#demo-input").tokenInput(url, {});
    $("#demo-input-facebook-theme").tokenInput(url, {
        theme: "facebook"
    });
    $("#demo-input-custom-labels").tokenInput(url, {
        hintText: "I can has TV Shows?",
        noResultsText: "O noes",
        searchingText: "Meowing..."
    });
    $("#demo-input-custom-delete").tokenInput(url, {
        deleteText: "&#x2603;"
    });
    $("#demo-input-custom-limits").tokenInput(url, {
        searchDelay: 2000,
        minChars: 4,
        tokenLimit: 3
    });
    $("#demo-input-custom-delimiter").tokenInput(url, {
        tokenDelimiter: "_DELIMITER_"
    });
    $("#demo-input-prevent-duplicates").tokenInput(url, {
        preventDuplicates: true
    });
    $("#demo-input-pre-populated").tokenInput(url, {
        prePopulate: [
            {id: 123, name: "Slurms MacKenzie"},
            {id: 555, name: "Bob Hoskins"},
            {id: 9000, name: "Kriss Akabusi"}
        ]
    });
    $("#demo-input-pre-populated-with-tokenlimit").tokenInput(url, {
        prePopulate: [
            {id: 123, name: "Slurms MacKenzie"},
            {id: 555, name: "Bob Hoskins"},
            {id: 9000, name: "Kriss Akabusi"}
        ],
        tokenLimit: 3
    });
    $("#demo-input-disable-animation").tokenInput(url, {
        animateDropdown: false
    });
    $("#demo-input-onresult").tokenInput(url, {
        onResult: function (results) {
            $.each(results, function (index, value) {
                value.name = "OMG: " + value.name;
            });

            return results;
        }
    });
    $("#demo-input-plugin-methods").tokenInput(url);

    // Add a token programatically
    $("#plugin-methods-add").click(function () {
        $("#demo-input-plugin-methods").tokenInput("add", {id: 999, name: "James was here"});
        return false;
    });
    // Remove a token programatically
    $("#plugin-methods-remove").click(function () {
        $("#demo-input-plugin-methods").tokenInput("remove", {name: "James was here"});
        return false;
    });
    // Clear all tokens
    $("#plugin-methods-clear").click(function () {
        $("#demo-input-plugin-methods").tokenInput("clear");
        return false;
    });
    // Toggle Disable / Enable the widget
    $("#plugin-methods-toggle-disable").click(function () {
        $("#demo-input-plugin-methods").tokenInput("toggleDisabled");
        return false;
    });
    $("#demo-input-onadd-ondelete").tokenInput(url, {
        onAdd: function (item) {
            alert("Added " + item.name);
        },
        onDelete: function (item) {
            alert("Deleted " + item.name);
        }
    });

    $("#demo-input-local-custom-formatters").tokenInput(nameList,
        { propertyToSearch: "first_name",
          resultsFormatter: function(item){ return "<li>" + "<img src='" + item.url + "' title='" + item.first_name + " " + item.last_name + "' height='25px' width='25px' />" + "<div style='display: inline-block; padding-left: 10px;'><div class='full_name'>" + item.first_name + " " + item.last_name + "</div><div class='email'>" + item.email + "</div></div></li>" },
          tokenFormatter: function(item) { return "<li><p>" + item.first_name + " " + item.last_name + "</p></li>" 
        }
     });
    $('input[name="search_key"]').click(function() {
        $("#demo-input-change-propertytosearch-anytime").tokenInput("setOptions", {propertyToSearch: $(this).val(), hintText: "Type "+$(this).val()+" here to search"});
    });

    $("#demo-input-change-propertytosearch-anytime").tokenInput(nameList,
        { propertyToSearch: "first_name",
          resultsFormatter: function(item){ return "<li>" + "<img src='" + item.url + "' title='" + item.first_name + " " + item.last_name + "' height='25px' width='25px' />" + "<div style='display: inline-block; padding-left: 10px;'><div class='first_name'>" + item.first_name + " " + item.last_name + "</div><div class='email'>" + item.email + "</div><div class='url'>" + item.url + "</div></div></li>" },
          tokenFormatter: function(item) { return "<li><p>" + item.first_name + " " + item.last_name + "</p></li>" }
        }
    );

    $("#demo-input-disabled").tokenInput(exampleList,
      { disabled: true,
        prePopulate: [
            {id: 123, name: "Slurms MacKenzie"},
            {id: 555, name: "Bob Hoskins"},
            {id: 9000, name: "Kriss Akabusi"}
        ]
    });

    $("#demo-input-free-tagging").tokenInput(url, { allowFreeTagging: true });
    $("#demo-input-local-exclude").tokenInput(exampleList, { excludeCurrent: true });
});

    var url = "http://jquery-tokeninput-demo.herokuapp.com";
    var exampleList = [
        {id: 7, name: "Ruby"},
        {id: 11, name: "Python"},
        {id: 13, name: "JavaScript"},
        {id: 17, name: "ActionScript"},
        {id: 19, name: "Scheme"},
        {id: 23, name: "Lisp"},
        {id: 29, name: "C#"},
        {id: 31, name: "Fortran"},
        {id: 37, name: "Visual Basic"},
        {id: 41, name: "C"},
        {id: 43, name: "C++"},
        {id: 47, name: "Java"}
    ];
    var alphabetList = [
        {id: 1, name: "item a"},
        {id: 2, name: "item b"},
        {id: 3, name: "item c"},
        {id: 4, name: "item d"},
        {id: 4, name: "item e"},
        {id: 4, name: "item f"},
        {id: 4, name: "item g"},
        {id: 4, name: "item h"},
        {id: 4, name: "item i"},
        {id: 4, name: "item j"},
        {id: 4, name: "item k"},
        {id: 4, name: "item l"},
        {id: 4, name: "item m"},
        {id: 4, name: "item n"},
        {id: 4, name: "item o"},
        {id: 4, name: "item p"},
        {id: 4, name: "item q"},
        {id: 4, name: "item r"},
        {id: 4, name: "item s"},
        {id: 4, name: "item t"},
        {id: 4, name: "item u"},
        {id: 4, name: "item v"},
        {id: 4, name: "item w"},
        {id: 4, name: "item x"},
        {id: 4, name: "item y"},
        {id: 4, name: "item z"},
    ];
    var nameList = [{
            "first_name": "Arthur",
            "last_name": "Godfrey",
            "email": "arthur_godfrey@nccu.edu",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Adam",
            "last_name": "Johnson",
            "email": "wravo@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Jeff",
            "last_name": "Johnson",
            "email": "bballnine@hotmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Adriana",
            "last_name": "Jameson",
            "email": "adriana.jameson@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Adriano",
            "last_name": "Pooley",
            "email": "adrianolpooley@lautau.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alcir",
            "last_name": "Reis",
            "email": "alcirreis@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Jack",
            "last_name": "Cunningham",
            "email": "jcunningham@hotmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alejandro",
            "last_name": "Forbes",
            "email": "alejandforbes@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alessandra",
            "last_name": "Mineiro",
            "email": "alc_mineiro@aol.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alex",
            "last_name": "Frazo",
            "email": "alex.frazo@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alexandre",
            "last_name": "Crawford",
            "email": "xandycrawford@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alexandre",
            "last_name": "Lalwani",
            "email": "alexandrelalwani@globo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alexandre",
            "last_name": "Jokos",
            "email": "alex.jokos@gmail.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alexandre",
            "last_name": "Paro",
            "email": "alexandre.paro@uol.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Niemeyer",
            "email": "a.niemeyer@globo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Alyssa",
            "last_name": "Fortes",
            "email": "afort287@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Amit",
            "last_name": "Alvarenga",
            "email": "amit.alva@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Ana Bia",
            "last_name": "Borges",
            "email": "abborges@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Ana",
            "last_name": "Akamine",
            "email": "ana.akamine@uol.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Anderson",
            "last_name": "Tovoros",
            "email": "alvarenga.tovoros@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Borges",
            "email": "andreborges@hotmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Wexler",
            "email": "andre.wexler@aol.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Williams",
            "email": "awilly@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Sanford",
            "email": "andre.sanford@gmail.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Wayne",
            "email": "andrewayne@uol.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Jackson",
            "email": "andre.jackson@yahoo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Jolly",
            "email": "andre.jolly@uol.com.br",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        },
        {
            "first_name": "Andre",
            "last_name": "Henderson",
            "email": "andre.henderson@globo.com",
            "url": "https://si0.twimg.com/sticky/default_profile_images/default_profile_2_normal.png"
        }];
