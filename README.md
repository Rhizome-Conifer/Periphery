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
import { BoundaryList } from 'warc-boundaries/boundar-list';

let boundaries = new BoundaryList(<boundary data>)'
boundaries.applyBoundaries();
```

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

