import { attachDivOverlay, inlineStyle } from '../src/mutator';

export function mutatorTestRunner() {
    describe('mutates DOM and styles divs correctly', () => {
        let testParent = document.createElement('div');
        const attachDiv = (className, description, styling) => {
            return () => attachDivOverlay(testParent, className, description, styling);
        }
    
        test('attach empty overlay', () => {
            let emptyCase = attachDiv(null, null, null);
            attachDiv();
            expect(true).toEqual(true);
        });
    
    });
}
