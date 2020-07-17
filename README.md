# Object Boundaries for Web Archives

A flexible module for DOM modification and overlaying of replayed web archive content, allowing for specification of interactivity around links to missing resources. 

## Usage

<install instructions>

<import instructions>

If you're using a WARC replay system such as Pywb that allows for arbitrary HTML/JS to be injected into replayed pages, you can consume the sidebar component as so in a template file:

```
<script src="(link to component registering script)"></script>
<boundary-sidebar></boundary-sidebar>
```

In a script, register the boundaries:

```
let sidebar = document.querySelector('boundary-sidebar');
sidebar.boundaries = <boundaries>;
```

if you want to perform boundary DOM modification but you don't want to include the sidebar component, you can apply boundaries like so:

```
import { BoundaryList } from 'warc-boundaries/boundary-list';

let boundaries = new BoundaryList(<boundary data>)'
boundaries.applyBoundaries();
```

## Attributes

**hidden:** hides the sidebar UI. Boundaries will still be applied and the DOM of the replayed
resource will still be modified.

**post-message-origin:** Specifies the origin from which to accept postMessage messages (see the postMessage section below for more information). 
By default, the sidebar only accepts `postMessage`s from the same origin, so if the replayed page is contained in an `iframe` with a different origin,
`post-message-origin` must be set in order for the component to accept messages.

## Boundary Spec

Boundaries must be valid JSON objects. The specification for boundaries is as follows (note that boundaries should be enclosed in an array, even if there is only one):
```
[{
    "resource": "all" | <resource URI> | <URL prefix with wildcard>,
    "selector": {
        "type": "css-selector" | "link-query" | "element-selector",
        "query" (optional): <CSS selector> 
    },
    "type": "on-load" | "mutation-observer",
    "action": {
        "type": "none" | "disable" | "style"
        "styles" (optional): {
            <property>: <value>
        }
    },
    "overlay" (optional): {
        "box": {
            "display": "none" | "visible",
            "styles" (optional): {
                <property>: <value>
            }
        },
        "tooltip": {
            "display": "none" | "visible",
            "styles" (optional): {
                <property>: <value>
            }
        }
    },
    "description": <boundary description>
}]
```

## postMessage Specification

Because this module is embedded into replayed web pages, and replay systems like pywb often use "framed" replay where the page is embedded into the iframe, 
warc-boundaries provides an interface through which to communicate with the boundaries and modify the sidebar/overlay UI. A `postMessage` message takes the 
form of stringified JSON: 
```
"{"type": <type>, "value:" <value> (optional)}"
```

You can send a `postMessage` as follows:
```
let frame = document.querySelector('iframe');
let msg = JSON.stringify({type: "style", value: {"#boundary-sidebar": {"background-color": "red !important"}}});
frame.contentWindow.postMessage(msg, 'http://localhost:8080')
```
### hideSidebar

messages with a `type` of `hideSidebar` do not require a `value`, and will hide the sidebar.
This allows you to still apply boundaries without showing the sidebar and metadata.

### styles

Messages with a `type` of `styles` allow you to apply custom styling and appearance to the sidebar.
The styles should be formatted with the keys as strings representing valid CSS selectors, and the values
as objects with keys representing CSS attributes and values as CSS attribute values, as in the above example.

