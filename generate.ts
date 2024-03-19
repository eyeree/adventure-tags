import * as fs from 'node:fs';
import Anthropic from "@anthropic-ai/sdk";
import { parse } from 'node-html-parser';

const systemPrompt =
`
Here is a chance to exercise your creative writing skills! In the past, you have helped created a way to implement
simple interactive stories in an HTML document. For example, you can create something like the classic text Adventure
game. Be creative! Use colorful and descriptive language. Make a story that is fun and engaging. Push boundaries and
surprise the reader!
`;

const outlinePrompt = 
`
We'll get into implementation details later, but first lets create an outline for a story idea.

Our game engine supports three concepts: locations, items, and states. Only one location can be active at a time.
This is where the player is located. Items exist at a location, but can be picked up and dropped by the player.
While held by the player, they move from location to location with the player. When dropped, they remain at the
location where they were dropped. We'll need HTML format content describing each item and location. This can include
<button> elements that execute JavaScript code when clicked. This code can change the current location, pickup or
drop items, and set or clear state variables. API details will be given after we have created an outline.

The state variables supported by the game engine lets us change what text is shown to the user as part of the
location and item descriptions. Text shown can be conditional on what states are currently active. These conditions
are described using boolean expressions that can use not, and, and or operators along with state variable names. For
example, a "light" item could have the state "light-on" which triggers the display of text describing what is seen
but only while the "light-on" state is active. There are a number of built in states that represent when items are
held, or at a particular location, or at the current location. Details on how to use these states will be provided
later, after we have an outline for the story to be created.

That should give you an idea of what kinds of interactive stories we can support. They can involve multiple locations,
and items that can be picked up and moved around. You could even treat an NPC as an item that is moved around with
the player, or left in a particular location. And you can use state variables to make the story progress as the
player performs certain actions, solves puzzles, etc.

The theme for this story you are going to create is: {{theme}}

For this story, lets aim for {{location-count}} different locations, along with some items and/or NPCs for the the
player to interact with. The outline should include an overview of the story, locations, and items. Goals or
achievements for the player. And a writing style guide for the content to be created, so that the tone and phrasing
are consistent with the flavor of the story and the target audience.
`;

const apiDescription =
`
We use custom html elements to represent locations and items, as well as to render content conditionally based on
states. These tags are prefixed with "at-".

The <at-location> tag represents a location. This tag must have an unique HTML id attribute value. All the content
inside this tag is shown when the player is at that location, and the content for all other <at-location> tags is
hidden. The first <at-location> tag in the document is the player's initial location.

The <at-item> tag represents an item. This tag must have an unique HTML id attribute value. These elements are moved
from one <at-location> container to another when the player is carrying an item, so their content will be rendered
along with the player's current location.

The <at-if> tag can be used to render content conditionally. The "state" attribute must contain an expression that
will be evaluated to determine if the content of the <at-if> tag will be visible. The <at-if> tag can optionally be
followed by <at-else-if> tags and an <at-else> tag. In this case, the first of the <at-if> and <at-else-if> tag's
state expressions that evaluates to true will make that tag's contents visible and all following <at-else-if> and
<at-else> tag's contents will be hidden. Only if no <at-if> or <at-else-if> tag contents are shown the <at-else> tag
contents will be visible.

The expressions put in the "state" attribute can consist of state names and the "not", "and", and "or" boolean
operators in that precedence order. Parentheses can be used to group sub-expressions.

The <button> tag with an "onclick" attribute can be used to execute javascript code in response to player input. The
following APIs are available:

* setLocation(locationID) - changes the current location to the one specified by it's id. All of the items the player
  is carrying are moved to the new location. This causes <at-if> elements in the new location to be re-evaluated.

* enableState(variableName), disableState(variableName) - set or clear the specified state variable, respectively.
  States are either enabled or disabled, arbitrary values cannot be stored as states. This causes <at-if> elements in
  the current location to be re-evaluated. State variable names cannot contain spaces (state expressions use spaces
  as delimiters)

* takeItem(itemID), dropItem(itemID) - causes the player to pick up or put down the item specified by it's id,
  respectively. Carried items are moved from location to location with the player.

* hideItem(itemID), showItem(itemID) - show or hide the content of the <at-item> tag with the specified id. This can
  be used to disable an item that has been used by the player, or enable an item only after a player has performed
  some action. If you use showItem on a given item to make it appear, you can use the attribute style="display:none"
  on the <at-item> tag to make an item initially hidden. Otherwise, don't make items hidden, or they won't ever
  visible to the player.

You can define whatever state variables you need to make the story interactive. There are some state variables
defined by the system, and these will be set and cleared automatically (where ‹location-id› is the id of an
<at-location> tag and ‹item-id› is the id of an <at-item> tag):

* ‹location-id›-seen - Set when the player first leaves the specified location, and never cleared. Can be used to
  show a long description only when a location is first visited.

* location-‹location-id› - Set when the player enters the specified location and cleared when the player leaves that
  locations. Can be used to display content only while the item is at a specific location.

* ‹item-id›-held - Set when the player picks up the specified item and cleared when the player drops the item. Can be
  used to display content only while the item is being carried by the player.

* ‹item-id›-present - Set when the player enters the location where the specified item is located and cleared when
  they leave that location. Is always set for items that are being carried by the player, since this items are always
  at the same location as the player.

* ‹item-id›-‹location-id› - Set when for all items at a location when the player enters the location, including items
  being carried by the player. Cleared for items carried by the player when they leave an location. Can be used to
  display content when an item is at a specific location.

Do not attempt to directly enable or disable any of these built in states. They will be enabled and disabled
automatically by the game engine when the APIs provided are called.
`;

const example = 
`
An example that illustrates what you need to produce is given below.

\`\`\`
<html lang="en">
    <head>
        <title>Example Adventure</title>
        <script src="../adventure-tags.js"></script>
        <link href="../adventure-tags.css" rel="stylesheet" />
    </head>
    <body>

        <at-location id="outside-cabin">

            <h1>Outside Cabin</h1>

            <p>You are outside a cabin in the woods.</p>

            <at-if state="not outside-cabin-seen">
                <p>
                    The cabin is small and rundown. It hasn't been occupied in years. There is one small broken window and a
                    door on one side. The cabin is completely surrounded by dark dense woods.
                </p>
                <p>You do not recall how you got here.</p>
            </at-if>

            <p>There is a <button onclick="setLocation('woods')">trail that leads into the woods</button>.</p>
            <p>You can <button onclick="setLocation('inside-cabin')">enter the cabin</button>.</p>

        </at-location>

        <at-location id="inside-cabin">

            <h1>Inside Cabin</h1>

            <p>You are inside of a dirty old cabin. <at-if state="not lantern-on">It is dark in here.</case></p>

            <p>You can <button onclick="setLocation('outside-cabin')">exit the cabin</button>.</p>

            <at-item id="lantern">
                <p>
                    You are holding a <at-if state='lantern-on'>glowing</at-if><at-else>dark</at-else> lantern. You can 
                    <at-if state="lantern-held">
                        <button onclick="dropItem('lantern')">put the lantern down</button>,
                    </at-if>
                    <at-else>
                        <button onclick="takeItem('lantern')">pick the lantern up</button>,
                    </at-else>
                    or
                    <at-if state="lantern-on">
                        <button onclick="disableState('lantern-on')">turn the lantern off</button>.
                    </at-if>
                    <at-else>
                        <button onclick="enableState('lantern-on')">turn the lantern on</button>.
                    </at-else>
                </p>
            </at-item>
            
        </at-location>

        <at-location id="woods">
            <h1>Woods</h1>
            <p>You have followed a path deep into the woods, but the trail seems to end here. You can <button onclick="setLocation('outside-cabin')">go back the way you came</button>.</p>
            <at-item id="coin">
                <at-if state="coin-held">
                    <p>You are holding a coin, which you could <button onclick="dropItem('coin')">drop</button>.</p>                        
                </at-if>
                <at-else-if state="lantern-on and lantern-present">
                    <p>
                        A gold coin glints in the lantern light 
                        <at-if state="location-inside-cabin">
                            <span>from the dust on the floor.</span>
                        </at-if>
                        <at-else-if state="location-woods">
                            <span>from the leaves on the ground.</span>
                        </at-else-if>
                        <at-else>
                            <span>from where you left it.</span>
                        </at-else>
                        You can <button onclick="takeItem('coin')">pick it up</button>.
                    </p>
                </at-else-if>
            </at-item>
        </at-location>
        
    </body>
</html>
\`\`\`
`;

const generateLocationTagsPrompt =
`
Now that you have created an outline, you can begin to create the content for the story. 

${example}

${apiDescription}

Please start by creating just the top level structure of the HTML document. This document should include the head
element with the title of the story and the script and link tags as shown in the example. The body should
contain an <at-location> tag for each location in the story, each with an unique id attribute value. But do not
include the content in these tags yet. You will be given the opportunity to create the content for each location in
turn next (we want you to be able to create documents that are bigger than your max output token limit, and so will
create them one location at a time). For example, if you were creating the document used as an example above, you
would output the following structure:

\`\`\`
<html lang="en">
    <head>
        <title>Example Adventure</title>
        <script src="../adventure-tags.js"></script>
        <link href="../adventure-tags.css" rel="stylesheet" />
    </head>
    <body>
        <at-location id="outside-cabin"></at-location>
        <at-location id="inside-cabin"></at-location>
        <at-location id="woods"></at-location>
    </body>
</html>
\`\`\`
`;

const generateLocationContentPrompt =
`
Great! Now you can create the content for each location, one location at a time. At each step, you will be shown the
html document with all the content you have created so far. Once you have created content for each location, you'll
be able to make revisions to the document so don't worry about getting it all exactly right the first time. Have fun
and be creative!

The HTML you have created to this point is shown below:

{{document-so-far}}

Now create the complete tag with all of the content for the next location as shown in the example below.

<at-location id="{{location-id}}">
  (location-content-goes-here)
</at-location> 

Your output will replace the empty <at-location id="{{location-id}}"></at-location> tag in the document shown above.
`;


const reviseLocationsContentContext =
`
Now that you created the first draft of the html document, you can make revisions to each location's content one
location at a time. Check the state manipulation code and optional rendering to make sure everything will work as
desired. When working with states, be sure to remember that it may be necessary to disable a state after the player
takes an action, or to drop an item after the player uses it, in order to hide obsolete content. Also be sure to
include the <at-item> tag for any items you want the player to be able to take or drop, and that <at-item> tag is put
inside the <at-location> tag where the item will first be found by the player. And finally, be sure your only using
<at-*> tags that have been described. It is vital for a good player experience that the logic used to make the story
interactive works well. Think through each possible player interaction to be sure the overall experience is what you
expect.

${apiDescription}
`;


const reviseLocationsLogicContext =
`
Now that you created the first draft of the html document, you can make revisions to each location's content one
location at a time. Make any revisions you feel are necessary to improve consistency and to polish the player
experience. Now is your chance to be very creative in your writing. Aim to entertain and surprise the reader with
your prose!

${apiDescription}
`;

const reviseLocationPrompt =
`
Revise the <at-location> tag from the document that is shown below. Output the complete revised tag, or say "no
changes needed" to keep the tag as is.

{{content}}
`;

const generateEverythingPrompt =
`
${example}

${apiDescription}

Now it is time to generate a complete HTML document using these tags and APIs for the story outline you
created previously. Include the following head content in your generated document, so the APIs described are
available and the content is nicely styled.

\`\`\`
    <head>
        <title>(a title for the story)</title>
        <script src="../adventure-tags.js"></script>
        <link href="../adventure-tags.css" rel="stylesheet" />
    </head>
\`\`\`
`;

const reviseContentPrompt = 
`
That's great! Now make any revisions you feel are necessary to improve consistency and to polish the player
experience. Now is your chance to be very creative in your writing. Aim to entertain and surprise the reader with
your prose!
`;

const reviseLogicPrompt =
`
Now create a final revision, after checking the state manipulation code and optional rendering to make sure
everything will work as desired. When working with states, be sure to remember that it may be necessary to disable a
state after the player takes an action, or to drop an item after the player uses it, in order to hide obsolete
content. Also be sure to include the <at-item> tag for any items you want the player to be able to take or drop, and
that <at-item> tag is put inside the <at-location> tag where the item will first be found by the player. And finally,
be sure your only using <at-*> tags that have been described. It is vital for a good player experience that the logic
used to make the story interactive works well. Think through each possible player interaction to be sure the overall
experience is what you expect.

As a reminder, here are the APIs and built in states that are available.

${apiDescription}
`;

const modelHaiku = "claude-3-haiku-20240307";
const modelSonnet = "claude-3-sonnet-20240229";
const modelOpus = "claude-3-opus-20240229"
const defaultModel = modelHaiku;

const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..*$/, '');

const anthropic = new Anthropic({
//   apiKey: "my_api_key", // defaults to process.env["ANTHROPIC_API_KEY"]
});

const messages:Anthropic.MessageParam[] = [];

function truncate(s:string, n:number = 100) {
    return (s.length > n ? s.substring(0, n) + '...' : s).replaceAll(/\n/g, ' ' );
}

function getMessageContent(response:Anthropic.Message) {
    if (response.content.length === 1 && response.content[0].type === 'text') {
        return response.content[0].text;
    } else {
        if (response.content.some(c => c.type !== 'text')) {
            throw new Error(`Unexpected message content type: ${response.content.filter(c => c.type !== 'text').map(c => c.type).join(', ')}`);
        }
        return response.content.map(c => c.text).join('');
    }
}

function context(content:string, role:'user' | 'assistant' = "user") {
    const message:Anthropic.MessageParam = { 
        content: [{ type: "text", text: content }], 
        role: role 
    };
    messages.push(message);
    return message;
}

async function prompt(content:string, model = defaultModel) {
    console.log('prompt:', truncate(content) );
    messages.push({ content: [{ type: "text", text: content }], role: "user" });
    const mergedMessages = mergeMessagesByRole();
    const response = await anthropic.messages.create({
        model: model,
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: mergedMessages
    });
    logPrompt(response, mergedMessages)
    messages.push({ content: response.content, role: "assistant" });
    if (response.stop_reason === "max_tokens") {
        throw new Error('Response too long');
    }
    console.log('  stop_reason:', response.stop_reason);
    console.log('  usage:', response.usage);
    console.log('  response:', truncate(getMessageContent(response)));
    return getMessageContent(response);
}

type Role = "user" | "assistant";
type MessageContent = Anthropic.MessageParam["content"];

function mergeMessagesByRole() {
    const merged:Anthropic.MessageParam[] = [];
    let lastRole:Role|null = null;
    for (const message of messages) {
        if (message.role === lastRole) {
            merged[merged.length - 1] = { 
                content: mergeContent(merged[merged.length - 1].content, message.content), 
                role: message.role 
            };
        } else {
            merged.push(message);
            lastRole = message.role;
        }
    }
    return merged;
}

function mergeContent(a:MessageContent, b:MessageContent):MessageContent {
    if (typeof a === 'string') {
        if (typeof b === 'string') {
            return `${a}\n${b}`;
        } else {
            return [{type: 'text', text: a}, ...b];            
        }
    } else {
        if (typeof b === 'string') {
            return [...a, {type: 'text', text: b}];
        } else {
            return [...a, ...b];
        }
    }
}

let promptNumber = 1;
fs.mkdirSync('logs', { recursive: true });
function logPrompt(response:Anthropic.Message, mergedMessages:Anthropic.MessageParam[]) {
    const fileName = `logs/prompt-${timestamp}-${promptNumber++}.json`;
    fs.writeFileSync(fileName, JSON.stringify({messages: mergedMessages, response}, null, 2));    
}

async function generateLocationByLocation(theme:string, locationCount:number, fileName:string) {
    
    await prompt(
        outlinePrompt
            .replace("{{theme}}", theme)
            .replace("{{location-count}}", locationCount.toString())
    );

    const content = await prompt(generateLocationTagsPrompt);
    const htmlContent = extractHTML(content);
    const root = parse(htmlContent);
    const title = root.querySelector('title');
    if (!title) {
        throw new Error('No title found');
    }
    const locations = root.querySelectorAll('at-location');
    console.log('locations:', locations.length, 'expected:', locationCount);

    if (!locations.every(l => l.getAttribute('id') !== undefined)) {
        throw new Error('Not all locations have an id attribute');
    }

    if (new Set(locations.map(l => l.getAttribute('id'))).size !== locations.length) {
        throw new Error('Duplicate location ids');
    }

    const resetLength = messages.length;

    await generateLocations();
    // await reviseLocations(reviseLocationsContentContext);
    // await reviseLocations(reviseLocationsLogicContext);

    const html = root.outerHTML;
    fs.writeFileSync(fileName, html);

    async function generateLocations() {
        for (const location of locations) {

            const locationId = location.getAttribute('id')!;
            const content = await prompt(
                generateLocationContentPrompt
                    .replace("{{document-so-far}}", root.outerHTML)
                    .replaceAll("{{location-id}}", locationId)
            );

            const htmlContent = extractHTML(content, 'at-location');
            location.replaceWith(htmlContent);

        }
    }

    // async function reviseLocations(revisionContext:string) {
    //     messages.length = resetLength - 1;

    //     context(revisionContext);
        
    //     for (let locationIndex = 0; locationIndex < locationsSoFar.length; ++locationIndex) {

    //         messages.length = resetLength;

    //         let locationContent = locationsSoFar[locationIndex];
    //         locationsSoFar[locationIndex] = "<!-- The <at-location> tag you are revising goes here -->";
    //         context(documentSoFarContext.replace(
    //             "{{content}}",
    //             locationsSoFar.join('\n\n')
    //         ));

    //         const newContent = await prompt(reviseLocationPrompt.replace(
    //             "{{content}}",
    //             locationsSoFar[locationIndex]
    //         ));

    //         if (!newContent.toLowerCase().includes("no changes needed")) {
    //             locationContent = newContent;
    //         }

    //         locationsSoFar[locationIndex] = locationContent;

    //     }
    // }
}

async function generateEverythingAllAtOnce(theme:string, locationCount:number, fileName:string) {

    await prompt(
        outlinePrompt
            .replace("{{theme}}", theme)
            .replace("{{location-count}}", locationCount.toString())
    );

    await prompt(generateEverythingPrompt);

    await prompt(reviseContentPrompt);

    const content = await prompt(reviseLogicPrompt);
    const html = extractHTML(content);
    fs.writeFileSync(fileName, html);

}

function extractHTML(content: string, tag: string = "html") {
    const iStart = content.indexOf(`<${tag}`);
    const iEnd = content.indexOf(`</${tag}>`);
    if (iStart === -1 || iEnd === -1) {
        throw new Error('No HTML content found in response');
    }
    const html = content.substring(iStart, iEnd + tag.length + 3);
    return html;
}

async function main() {

    const theme = process.argv[2] || "a whimsical fairy garden with a hidden entrance and filled will all kinds of magical items and creatures";
    const locationCount = Number.parseInt(process.argv[3] || "5");
    const fileName = `generated/${timestamp}.html`;
    console.log('generating', fileName);

    // await generateEverythingAllAtOnce(theme, locationCount, fileName);
    await generateLocationByLocation(theme, locationCount, fileName);

}

main();