import { attachDivOverlay, inlineStyle } from '../src/mutator';

export function mutatorTestRunner() {
    describe('mutates DOM and styles divs correctly', () => {
        let testParent = document.createElement('div');
        const attachDiv = (className, description, styling) => {
            return () => attachDivOverlay(testParent, className, description, styling);
        }
    
        test('attach overlay with incorrect property types', () => {
            let expectedTemplate = [
                '\n            <div class=',
                '\n                style=',
                '\n                data-after=',
                '\n            ></div>\n        '
            ];
            let parent = document.createElement('div');
            let overlay = attachDivOverlay(parent, ["Test", "Test"], {"Test": "test"}, "asdf");
            expect(overlay.render().strings).toEqual(expectedTemplate);
        });

        test('attach overlay with style map', () => {
            let expectedTemplate = [
                '\n            <div class=',
                '\n                style=',
                '\n                data-after=',
                '\n            ></div>\n        '
            ];
            let parent = document.createElement('div');
            let overlay = attachDivOverlay(parent, "test", {"color": "red"});
            console.log(overlay.render().strings)
            expect(overlay.render().strings).toEqual(expectedTemplate);
        });


    
    });
}
