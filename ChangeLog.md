jQuery Tokeninput ChangeLog
===========================

Version 1.6.1 ?
--------------------------
- Added the ability to disable deletes on certain items. Json must include a disableDelete boolean property. The actual property name can be set through the disableDeleteProperty setting.
- Added support for webservices. Set isWebService to true if you want to retrieve your json from a web service.
- Added a dropDownWidthAdjustment setting, since the dropdown may be off by a few pixels in some layouts.

Version 1.6.0 (2011-08-07)
--------------------------
- Now possible to pass a function as the URL to search, allowing dynamic endpoints
- Customize which JSON property to send to the server with the `tokenValue` setting
- Fix another `tokenLimit` bug
- Added `get` method to fetch selected tokens programmatically
- Control which JSON property to search inside with the `propertyToSearch` setting
- Customize the token and results html with the `resultsFormatter` and `tokenFormatter` settings.
- Fire a jQuery *change* event on original input whenever the selected tokens change
- Fire the new `onReady` callback when the input has finished initializing
- Fix bug which would focus the input after prepopulation

Version 1.5.0 (2011-06-12)
--------------------------
- Added `add`, `remove` and `clear` methods to programmatically modify tokens
- Support setting of ids on dynamic input (for html label targeting)
- Fix token limit bug when using `prePopulate`
- Various other bug fixes

Version 1.4.2 (2011-03-26)
--------------------------
- Implemented basic local data search to search without an ajax request
- Better support for unicode searches
- Support for pre-population using the data-pre attribute on the original input
- Fix cross-domain auto detection for relative and absolute path urls
- Absolutely position the dropdown so it shows above all elements

Version 1.4.1 (2011-03-21)
--------------------------
- Fix IE 7/8 bug introduced in 1.4
- Clear hidden input value when initially attaching to tokeninput
- Fix bug in tokenLimit setting when deleting last token
- Use mousedown instead of click event in IE when adding tokens

Version 1.4 (2011-03-20)
------------------------
- Automatically detect if we should be making crossdomain requests
- Really fix missing settings object
- Added support for a theme setting which sets the class name suffix
- Update onAdd and onDelete callbacks to return both id and name
- Fix bug where the form would submit ids with a trailing delimiter
- Increase the maximum cache size to speed things up
- Input box token now automatically resizes to take up minimal space

Version 1.3 (2011-03-14)
------------------------
- Fix token clearing bug in facebook theme
- Fixed invalid css value (issue #2)
- Make settings object param optional (issue #29)
- Initialize prePoulate setting
- Duplicate checking through preventDuplicates setting
- Made the delete text configurable through the deleteText setting
- Fixed input style on ios devices
- Only show dropdown hints/text if non-null
- Make the delimiter configurable through tokenDelimiter setting
- Fix bug which allowed old search results to override newer searches
- Make dropdown animation optional with animateDropdown setting

Version 1.2 (2011-03-12)
------------------------
- Support for cross-domain requests using JSONP with crossDomain setting
- Added onAdd and onDelete callbacks, fired when tokens are added or deleted
- Use &times; instead of x for the delete symbol

Version 1.1 (2009-07-11)
------------------------
- Limit the maximum number of tokens using the tokenLimit setting
- Allow the results to be inside a nested json object in the response using the
  jsonContainer setting
- Allow changing of the name of the param containing the search query with the
  queryParam setting
- Added onResult callback, allows you to perform pre-processing on returned
  results before they are displayed in the list
- Pre-populate the tokeninput with results, using the prePopulate setting
- Made the delay before searching configurable with the searchDelay setting
- Only search after X characters have been entered, using the minChars setting
- Change the http method to use when searching, using the method setting

Version 1.0
-----------
- Initial release