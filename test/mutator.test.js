import { attachDivOverlay, inlineStyle } from '../src/mutator';

export function mutatorTestRunner() {
    describe('mutates DOM and styles divs correctly', () => {
        let testParent = document.createElement('div');
        document.body.appendChild(testParent);
    
        test('attach overlay with style map', () => {
            let parent = document.createElement('div');
            let overlay = attachDivOverlay(parent, "test", {"color": "red"});
            expect(parent.children.length).toEqual(1);
        });

        test('attach incorrectly-formatted style', () => {
            let style = {"test": [1, 2, 3]};
            let testStyle = () => inlineStyle(testParent, style, "*");
            expect(testStyle).toThrow(Error);
        })
    });
}
