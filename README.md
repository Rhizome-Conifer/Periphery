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

### pywb example

The boundary sidebar can be injected into replayed pages by importing the module and using your tool of choice (this example uses Webpack) to transpile into a bundled JS file that can be injected into the frontend. 

While pywb doesn't have built-in support for object boundaries, it does allow you to define a `metadata.yaml` for each collection, which we can inject into the frontend using the templating available in pywb.

**\<coll>/metadata.yaml**
```yaml
boundaries:
  - 
    selector: 
      type: <type>
      query: <query>
    type: on-load
    action:  
      type: disable
    resource: all
    description: removed links to outside pages.
```

Now, we can set up Node/Webpack:

**webpack.config.js**
```
const path = require('path');

module.exports = {
    context: __dirname,
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'static'),
    },
};
```

**package.json**

```
{
  "name": "object-boundaries",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "warc-boundaries": "latest",
  }
}
```

Then, we create the entry file that applies the boundaries:

**src/index.js**
```javascript
import { BoundarySidebar } from 'warc-boundaries';


customElements.define('boundary-sidebar', BoundarySidebar);
// Once DOM content is loaded, apply boundaries
document.addEventListener("DOMContentLoaded", () => {
    let sidebar = document.querySelector('boundary-sidebar');
    sidebar.boundaries = meta;
});
```

Notice that this script refers to `meta`, which is a variable that doesn't exist. In our banner HTML template file, we need to define `meta` by injecting the metadata variable we defined in the YAML, include the bundled JS we produce with Webpack, and actually include the `boundary-sidebar` custom element in the page, in that order. We can do that like so:

**/templates/banner.html**
```html
<script>
    {% if metadata.boundaries != undefined %}
      var meta = {{ metadata.boundaries }};
    {% endif %}
</script>
<script type="module" src="{{ host_prefix }}/static/index.js" ></script>
<boundary-sidebar
  host-prefix={{host_prefix}}/{{coll}}
></boundary-sidebar>
```
Here, the `host-prefix` attribute, which specifies the host to query for backend CDX requests (see `Attributes`), is set to a value that is set on the backend and injected when the template is rendered.

Now, run:
```
$ npx run webpack
$ wayback
```
and visit `localhost:8080`. If you visit a page for the collection you included the `metadata.yaml` in, you should see the boundary sidebar and the boundaries functioning correctly.

## UI Controls

By default, the sidebar UI can be toggled through different "views" using the keyboard shortcut (Ctrl-Shift-I): hidden, sidebar viewable, and sidebar "editable" (i.e. the properties of the boundary can be changed from the sidebar, see below in the `Attributes` section).

## Attributes

**hidden:** hides the sidebar UI. Boundaries will still be applied and the DOM of the replayed
resource will still be modified. Defaults to `false`.

**editable:** Determines whether the boundary properties (overlay visibility, etc.) can be modified from the sidebar panel. Defaults to `false`.

**toggle:** Enables toggling of editablility with keyboard shortcuts. Defaults to `true`.

**post-message-origin:** Specifies the origin from which to accept postMessage messages (see the postMessage section below for more information). 
By default, the sidebar only accepts `postMessage`s from the same origin, so if the replayed page is contained in an `iframe` with a different origin,
`post-message-origin` must be set in order for the component to accept messages. Defaults to `window.origin` (i.e. only accepting same-origin messages).

**host-prefix:** The hostname to query on the backend for CDX queries.

**cdx-endpoint:** The specific endpoint to hit for backend queries. Defaults to `/cdx`.



## Boundary Spec

Boundaries must be valid YAML/JSON objects. The specification for boundaries is as follows (YAML is the default format, but should be converted to JSON):
```
- 
  resource: all | <resource URL> | <resource URL prefix with wildcard>
  selector:
    type: css-selector | link-query
    query (optional): <CSS selector>
    options (optional):
      worker: true | false
      lazy-loading: true | false
  type: on-load | mutation-observer
  action:
    type: none | disable | style
    styles (optional): 
      <CSS property>: <value>
      ...
  overlay (optional):
    box: 
      display: none | visible
      styles (optional):
        <CSS property>: <value>
        ...
    tooltip: 
      display: none | visible
      styles (optional):
        <CSS property>: <value>
        ... 
  description: <boundary description>
```

## Boundary Expression Properties

### resource 

The `resource` property of a boundary can be used to specify specific pages to which a boundary should be applied. The `all` option will apply the boundary to all pages; alternatively, you can specify a particular URL to match, optionally using a wildcard character (`*`) to match a range of pages. For instance, `resource: http://test.site/user` will match only that exact URL, but `resource: http://test.site/*` will match all pages on that domain. Wildcards are also useful for resources that include `GET` request parameters in the URL, so, `http://test.site/user*` will match `http://test.site/user?id=1234`, etc.

### selector

`selector` determines how elements on a page should be chosen to be modified. A `type` of `link-query` will collect all elements with an `href` attribute, and query the backend CDX API (location specified by the `cdx-endpoint` attribute) to determine which `href`s point to in-boundary resources. `css-selector` will simply perform a query on the page (specifically, `document.body`) using the CSS selector defined by `query`.

The options, `worker` and `lazy-loading`, are primarily for improving the performance of `link-query` selectors. `worker` batches the backend CDX queries with [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), which also limits the number of backend queries that can be made at one time. **It is highly recommended that this option be used for pages that contain many links, in order to avoid performing too many backend queries at once.** The `lazy-loading` option is another performance improvement; enabling it causes elements to only be queried when they enter the viewport, which means (depending on page layout) fewer queries will need to be performed at once.

### type

The `type` property determines when queries and actions will be performed. `on-load`, the default option, will apply boundary expressions only when the DOM initially loads. However, if a page adds relevant elements to the DOM later on, based on user input or something similar, the `mutation-observer` option will query all new nodes as they're added to the DOM and perform boundary expression on them.

### action

`action` determines how elements matched by the `selector` are modified. `none`, obviously, does nothing; `disable` (the default option) will disable link functionality by setting `pointer-events: none` on elements; and `style` allows for the application of arbitrary CSS styling. if `type` is `style`, then the `styles` property can be set to an arbitrary set of CSS styles, e.g.

```
  styles:
    background-color: #ff0000
    width: 50px
    ...
```

### overlay

The `overlay` property determines how elements matched by `selector` are overlaid. The properties `box` and `tooltip` are both optional, and if present will generate an overlay of their respective type. The `display` property determines whether the overlay is visible by default, and `styles`, as with in the `action` property, allows for the application of arbitrary CSS styling to the overlay elements.

### description

`description` is a string describing the particular boundary expression. While technically optional, it is the primary way to provide context behind a particular boundary expression for viewers; additionally, `description` is used as the text for `tooltip` overlays, if present.

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

## Credits

The frontend UI design is based on Lozana Rossenova's sidebar prototype for Webenact, which can be found [here](https://lozanaross.github.io/artbase-prototype/webenact-template.html).

