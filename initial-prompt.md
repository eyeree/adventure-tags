I'm an experienced software developer, and I would like you to help me implement some custom HTML elements. These elements can be used to create interactive text based stories or games completely contained single html document. 

An example HTML document using these elements is given below:

<html lang="en">
    <head>
        <title>Prototype</title>    
        <style>
            a { color: blue; text-decoration: underline; cursor: pointer; }
        </style>
    </head>
    <body>

        <location id="outside-cabin">

            <h1>Outside Cabin</h1>

            <p>
                You are outside of a cabin in the woods.
            </p>

            <case state="not outside-cabin-seen">
                <p>
                    The cabin is small and rundown. It hasn't been occupied in years. There is one small broken window and a
                    door on one side. The cabin is completely surrounded by dark dense woods.
                </p>
                <p>
                    You do not recall how you got here.
                </p>
            </case>

            <p>There is a <a onclick="setLocation('woods')">trail that leads into the woods</a>.</p>
            <p>You can <a onclick="setLocation('inside-cabin')">enter the cabin</a>.</p>

        </location>

        <location id="inside-cabin">

            <h1>Inside Cabin</h1>

            <p>
                You are inside of a dirty old cabin. <case state="not lantern-on">It is dark in here.</case>
            </p>

            <item id="lantern">
                <switch>
                    <case state="lantern-held">
                        <p>You are holding a lantern, which you could <a onclick="dropItem('lantern')">put down</a>.</p>
                    </case>
                    <else>
                        <p>There is a lantern here, which you could <a onclick="takeItem('lantern')">pick up</a>.</p>
                    </else>
                </switch>
                <switch>
                    <case state="lantern-on">
                        <p>The lantern is glowing brightly. It can be <a onclick="clearState('lantern-on')">turned off</a>.</p>
        
                    </case>
                    <else>
                        <p>The lantern is dark. It can be <a onclick="setState('lantern-on')">turned on</a>.</p>
                    </else>
                </switch>
            </item>

            <p>You can <a onclick="setLocation('outside-cabin')">exit the cabin</a>.</p>
            
        </location>

        <location class="woods">
            <h1>Woods</h1>
            <p>You have followed a path deep into the woods, but the trail seems to end here.</p>
            <item id="coin">
                <switch>
                    <case state="coin-held">
                        <p>You are holding a coin, which you could <a onclick="dropItem('coin')">drop</a>.</p>                        
                    </case>
                    <case state="not coin-held and lantern-on">
                        <p>
                            A gold coin glints in the lantern light 
                            <switch>
                                <case state="location-inside-cabin">
                                    <span>from the dust on the floor</span>
                                </case>
                                <case state="location-woods">
                                    <span>from the leaves on the ground</span>
                                </case>
                                <else>
                                    <span>from where you left it</span>
                                </else>
                            </switch>.
                            You can <a onclick="takeItem('coin')">pick it up</a>.
                        </p>
                    </case>
                </switch>
            </item>
        </location>
        
    </body>
</html>

There are three fundamental concepts we can support: locations, items, and states.

Locations - Locations are represented using an custom location element. In a given session (an html page loaded into a browser), there is only one location visible at a time. The content for all other locations is hidden, using CSS styles managed by the library we are building. The library provides a setLocation function that changes the current location. Locations are identified by id, which must be a valid HTML element id. The first location in the document is the player's initial location. The location element supports onentry and onexit events, which are triggered when the location becomes the current location and when it stops being the current location, respectively.

Items - Items are represented using a custom item element. Items exist in an location but can be picked up and dropped by the player. While held, items move from location with the player. When dropped, they are left at their current location. The library we are building moves item elements from location to location as needed, so they can be rendered with the rest of that location's content. The library provides takeItem and dropItem functions which, along with setLocation, implement this functionality. The item element supports ontake and ondrop events, which are triggered when the item is picked up and dropped by the player, respectively. It also supports an onmove event which is triggered whenever the item is moved to a new location while it is held by the player.

States - states are identified by name. A state is either "set" or "clear", and are initially clear. The library provides setState and clearState functions for changing states. It also provides a getState function that returns true if a state is set and false if it is clear. There is also an evaluateState function that takes a state expression string and returns true or false as determined by evaluating that expression. Such expression strings are composed of state names and the operators: not, and, and or; and they support parentheses to control evaluation order. 

The "switch", "case", and "else" custom elements shown in the example can be used to render different content depending on the current state. The evaluateState function is used on the value of the case element's state attribute to determine if a case is triggered by the current state. The content in first case in a switch that is triggered is visible, and the content of all other case elements is hidden. If none of the case elements are triggered, and there is an else element, it's content is visible; otherwise, if there is a triggered case element, the else element's content is hidden. The case element can be used outside of a switch element, and will render inline (like span) if the state attribute's value evaluates to true, otherwise it's content will be hidden. The else element cannot be used outside of a switch element.

There are some default states managed by the library:
* <location-id>-seen - this state is set when the location identified by <location-id> is left by the player, and is never cleared by the system.
* <item-id>-held - this state is set when the item identified by <item-id> is picked up by the player and cleared when the item is dropped by the player.
* location-<location-id> - this state is set when the player enters the location identified by <location-id> and is cleared when they leave that location. 