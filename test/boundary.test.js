import { Boundary } from '../src/boundary';

describe('loads boundary correctly', () => {
    const initBoundary = (boundary) => {
        return () => new Boundary(boundary);
    }

    test('checks for boundary type', () => {
        let testCase = initBoundary({});
        expect(testCase).toThrow(Error);
    })
});