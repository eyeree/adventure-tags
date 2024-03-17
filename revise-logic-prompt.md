Now create a final revision, after checking the state manipulation code and optional rendering to make sure everything will work as desired. When working with states, be sure to remember that it may be necessary to disable a state after the player takes an action, or to drop an item after the player uses it, in order to hide obsolete content. Also be sure to include the <at-item> tag for any items you want the player to be able to take or drop, and that <at-item> tag is put inside the <at-location> tag where the item will first be found by the player. And finally, be sure your only using <at-*> tags that have been described. It is vital for a good player experience that the logic used to make the story interactive works well. Think through each possible player interaction to be sure the overall experience is what you expect.

As a reminder, here are the APIs and built in states that are available.

We use custom html elements to represent locations and items, as well as to render content conditionally based on states. These tags are prefixed with "at-".

The <at-location> tag represents a location. This tag must have an unique HTML id attribute value. All the content inside this tag is shown when the player is at that location, and the content for all other <at-location> tags is hidden. The first <at-location> tag in the document is the player's initial location.

The <at-item> tag represents an item. This tag must have an unique HTML id attribute value. These elements are moved from one <at-location> container to another when the player is carrying an item, so their content will be rendered along with the player's current location.

The <at-if> tag can be used to render content conditionally. The "state" attribute must contain an expression that will be evaluated to determine if the content of the <at-if> tag will be visible. The <at-if> tag can optionally be followed by <at-else-if> tags and an <at-else> tag. In this case, the first of the <at-if> and <at-else-if> tag's state expressions that evaluates to true will make that tag's contents visible and all other tag's contents will be hidden. Only if no <at-if> or <at-else-if> tag contents are shown the <at-else> tag contents will be visible.

The expressions put in the "state" attribute can consist of state names and the "not", "and", and "or" boolean operators in that precedence order. Parentheses can be used to group sub-expressions.

The <button> tag with an "onclick" attribute can be used to execute javascript code in response to player input. The following APIs are available:

* setLocation(locationID) - changes the current location to the one specified by it's id. All of the items the player is carrying are moved to the new location. This causes <at-if> elements in the new location to be re-evaluated.

* enableState(variableName), disableState(variableName) - set or clear the specified state variable, respectively. States are either enabled or disabled, arbitrary values cannot be stored as states. This causes <at-if> elements in the current location to be re-evaluated. State variable names cannot contain spaces (state expressions use spaces as delimiters)

* takeItem(itemID), dropItem(itemID) - causes the player to pick up or put down the item specified by it's id, respectively. Carried items are moved from location to location with the player.

* hideItem(itemID), showItem(itemID) - show or hide the content of the <at-item> tag with the specified id. This can be used to disable an item that has been used by the player, or enable an item only after a player has performed some action. If you use showItem on a given item to make it appear, you can use the attribute style="display:none" on the <at-item> tag to make an item initially hidden. Otherwise, don't make items hidden, or they won't ever visible to the player.

You can define whatever state variables you need to make the story interactive. There are some state variables defined by the system, and these will be set and cleared automatically (where ‹location-id› is the id of an <at-location> tag and ‹item-id› is the id of an <at-item> tag):

* ‹locationID›-seen - Set when the player first leaves the specified location, and never cleared. Can be used to show a long description only when a location is first visited.

* location-‹locationID› - Set when the player enters the specified location and cleared when the player leaves that locations. Can be used to display item content only while the item is at a specific location.

* ‹item-id›-held - Set when the player picks up the specified item and cleared when the player drops the item. Can be used to display item content only while the item is being carried by the player.

* ‹item-id›-present - Set when the player enters the location where the specified item is located and cleared when they leave that location. Is always set for items that are being carried by the player, since this items are always at the same location as the player.

Do not attempt to directly enable or disable any of these built in states. They will be enabled and disabled automatically by the game engine when the APIs provided are called.