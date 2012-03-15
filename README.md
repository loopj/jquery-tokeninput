jQuery Tokeninput: A Tokenizing Autocomplete Text Entry
=======================================================

Overview
--------
Tokeninput is a jQuery plugin which allows your users to select multiple items from a predefined list, using autocompletion as they type to find each item. You may have seen a similar type of text entry when filling in the recipients field sending messages on facebook.

Features added by TomsLabs
-------------------------

  - Allow custom entry : 
    * when allowCustomEntry setting is true, type comma allows to add a token that isn't suggested in token list
    * when allowCustomEntry setting is true and no token is selected, type enter or tab adds current token

  - Avoid parallel search request in order to optimize performance 
  
  - Make highlight duplicate switchable (with highlightDuplicates, default to true)

Init example
------------
    $('#inputTokenId').tokenInput('/my/url/', {'allowCustomEntry' : true, 'highlightDuplicates' : false});


Demo
-----
http://www.tomsguide.fr/solutions/nouveau_sujet.htm (on tag input)


Documentation, Features and Demos
---------------------------------
Full details and documentation can be found on the project page here:

<http://loopj.com/jquery-tokeninput/>