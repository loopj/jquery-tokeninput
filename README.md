jQuery Tokeninput: A Tokenizing Autocomplete Text Entry
=======================================================

Overview
--------
Tokeninput is a jQuery plugin which allows your users to select multiple items from a predefined list, using autocompletion as they type to find each item. You may have seen a similar type of text entry when filling in the recipients field sending messages on facebook.

Documentation, Features and Demos
---------------------------------
Full details and documentation can be found on the project page here:

<http://loopj.com/jquery-tokeninput/>


Changes in this fork:
---------------------------------

 * User can add custom tags.
 * Fixed preventDuplicates bevahiour after allowing user to create his custom tags
 * More user-friendly (in my opinion) behaviour: when input losses focus, it consider user input that was entered but not added as a tag(by clicking tab/enter/typing comma etc)as a tag. So when the user uses mouse to navigate the form inputs, the data he entered to 'tokeninput'will be submitted when he submitts the form
