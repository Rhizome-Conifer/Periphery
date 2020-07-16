import { attachDivOverlay, inlineStyle } from '../src/mutator';

export function mutatorTestRunner() {
    describe('mutates DOM and styles divs correctly', () => {
        let testParent = document.createElement('div');
        document.body.appendChild(testParent);
    

        test('attach incorrectly-formatted style', () => {
            let style = {"test": [1, 2, 3]};
            let testStyle = () => inlineStyle(testParent, style, "*");
            expect(testStyle).toThrow(Error);
        })
    });

    describe('overlay div correctly renders', () => {
        const PARENT_ID = 'parent';
        const getShadowRoot = (selector) => {
            return document.querySelector(selector).shadowRoot;
        }
 
        beforeEach(() => {
            let parent = window.document.createElement('div');
            parent.id = PARENT_ID;
            document.body.appendChild(parent);
        });

        afterEach(() => {
            document.body.querySelector('boundary-overlay').remove();
        });

        test('attach overlay with style map', () => {
            let parent = window.document.getElementById(PARENT_ID);
            let overlay = attachDivOverlay(parent, "test", "test", {"color": "red"});
            return overlay.updateComplete.then((overlayElem) => {
                let innerDiv = overlay.shadowRoot.querySelector('div');
                expect(innerDiv.style.color).toEqual('red');
            })
        });

        test('sets description text', () => {
            let parent = window.document.getElementById(PARENT_ID);
            let overlay = attachDivOverlay(parent, "overlay-tooltip", "test");
            return overlay.updateComplete.then((overlayElem) => {
                let innerDiv = overlay.shadowRoot.querySelector('div');
                let content = window.getComputedStyle(innerDiv, ':after').getPropertyValue('content');
                expect(content).toEqual('\"test\"');
            })
        })

    });
}
