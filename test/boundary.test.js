import { Boundary } from '../src/boundary';

describe('loads boundary correctly', () => {
    test('checks for boundary type', () => {
        const t = () => {
            let testBoundary = new Boundary({});
        }
        expect(t).toThrow(Error);
    })
});