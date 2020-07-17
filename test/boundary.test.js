import { Boundary } from '../src/boundary';

export function boundaryTestRunner() {
    describe('loads boundary correctly', () => {
        const initBoundary = (boundary) => {
            return () => new Boundary(boundary);
        }
        const testCase = {"resource": [1,2,3]};
    
        test('checks for boundary resource match', () => {
            let testFunc = initBoundary(testCase);
            expect(testFunc).toThrow(TypeError);
        });
    
        test('checks for boundary type', () => {
            testCase.resource = "all";
            let typeFunc = initBoundary(testCase);
            expect(typeFunc).toThrow(TypeError);
        });
    
        test('checks for boundary selector type', () => {
            testCase.type = "on-load";
            testCase.selector = "asdf";
            let selectorTypeCase = initBoundary(testCase);
            expect(selectorTypeCase).toThrow(TypeError);
        });
    
        test('checks for correct action format', () => {
            testCase.action = ["1234"]
            let actionTypeCase = initBoundary(testCase);
            expect(actionTypeCase).toThrow(TypeError);
        });
    });
}
