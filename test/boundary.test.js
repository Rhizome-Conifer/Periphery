import { Boundary } from '../src/boundary';

describe('loads boundary correctly', () => {
    const initBoundary = (boundary) => {
        return () => new Boundary(boundary);
    }

    test('checks for boundary resource match', () => {
        let emptyCase = initBoundary({});
        expect(emptyCase).toThrow(Error);
    });

    test('checks for boundary type', () => {
        let emptyCase = initBoundary({"resource": "all"});
        expect(emptyCase).toThrow(Error);
    });

    test('checks for boundary type', () => {
        let emptyCase = initBoundary({"resource": "all"});
        expect(emptyCase).toThrow(Error);
    });

});