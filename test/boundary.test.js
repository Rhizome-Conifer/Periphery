import { Boundary } from '../src/boundary';

describe('loads boundary correctly', () => {
    const initBoundary = (boundary) => {
        return () => new Boundary(boundary);
    }

    test('checks for boundary resource match', () => {
        let emptyCase = initBoundary({"resource": [1,2,3]});
        expect(emptyCase).toThrow(TypeError);
    });

    test('checks for boundary type', () => {
        let emptyCase = initBoundary({"resource": "all"});
        expect(emptyCase).toThrow(TypeError);
    });

    test('checks for boundary type', () => {
        let emptyCase = initBoundary({"resource": "all"});
        expect(emptyCase).toThrow(TypeError);
    });

});