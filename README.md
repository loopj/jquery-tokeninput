jQuery Tokeninput: A Tokenizing Autocomplete Text Entry
=======================================================

Overview
--------
Tokeninput is a jQuery plugin which allows your users to select multiple items from a predefined list, using autocompletion as they type to find each item. You may have seen a similar type of text entry when filling in the recipients field sending messages on facebook.

Changes from original jquery-tokeninput
---------------------------------------

This is a forked version of jquery-tokeninput with a couple of different things. I grouped a small list of changes between original loopj's version from mine.

=== Support for server-side diacritical marks and original case ===

In [author]'s version, only a parsed text of what the user types goes to the server-side destination, without accents and all in lowercase. This version will send to server-side the intact version without parsing any character. This particularly allows to the server-side to know how to handle new custom entries and special items.

=== Highlight terms ===

Original jquery-tokeniput used a simple regex expression to highlight the typed characters in the dropdown list. This caused to be a huge problem with accents and other special chars. After doing a major clean-up[1] on this, this updated version of tokeninput will properly highlight terms like “são paulo” when “sao paulo” is provided.

[1] Based on this great article http://www.alistapart.com/articles/accent-folding-for-auto-complete/

### Custom objects as data source

Originally jquery-tokeninput would only accept objects with 'id' and 'name' parameters, and would even ignore any other element in the object. With several hooks on this, I made token accept any kind of object, with options to choose which columns to use when searching and what 

<pre><code>
[
    {id: 1, city: 'Vitória', state: 'ES'},
    {id: 5, name: 'São Paulo', state: 'SP'},
    {id: 2, city: 'Palo Alto', state: 'CA'},
    {id: 3, city: 'San Francisco', state: 'CA'},
]
</code></pre>

### Custom Entries

Besides choosing predefined items from a list 

TODO

### Refactored way for storing elements and send them to the server

Original jquery-tokeninput had some misterious bug that kept deleted elements when form was submited. Besides this, it had a hard-to-maintain way to handle actions to add and remove tokens.

With this new approach, I cleaned up and simplified the code, and added options to choose how to send the output to the server.

Originally output would be a list of numbers imploded with <code>,</code>, like <code>16,742,58,254</code>. With custom entries support, output becomes <code>16,42,'Subway',37,'McDonald\'s',734</code>.

Alternatively, a function can be used to parse the output using tokensFormatter. With this, you can per instance return a json as output.
