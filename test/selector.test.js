import { linkQuery, 
        queryResource, 
        checkCdxQueryResult, 
        buildHrefListDedup, 
        getIntersectionCallback,
        getLinkQueryCallback
    } from '../src/selector';

export function selectorTestRunner() {
    describe('renders boundary sidebar correctly', () => {
        beforeAll(() => {
            const mockJsonPromise = (text) => Promise.resolve(text);
            const mockFetchPromise = (url) => {
                let responses = {'in-boundary': 'test', 
                                'out-boundary': '', 
                                'http://test.com/cdx?output=json&limit=1&url=http%3A%2F%2Fresult.com': 'test'
                            };
                return Promise.resolve({ 
                    text: () => mockJsonPromise(responses[url] ? responses[url] : ''),
                });
            } 
            jest.spyOn(global, 'fetch').mockImplementation((url) => mockFetchPromise(url));     
        })

        afterEach(() => {
            global.fetch.mockClear();
        });

        afterAll(() => {
            global.fetch.mockReset();
        });          

        test('returns true for in-boundary results', () => {
            return checkCdxQueryResult('in-boundary').then((val) => {
                expect(val).toBe(true);
            })
        });
        
        test('returns true for out-boundary results', () => {
            return checkCdxQueryResult('out-boundary').then((val) => {
                expect(val).toBe(false);
            })
        });
        
        test('returns correctly formatted resource query results', () => {
            return queryResource('javascript:').then((val) => {
                expect(val).toStrictEqual(['javascript:', false]);
            });
        });

        test('performs UR: encoding correctly', () => {
            return queryResource('http://result.com', 'http://test.com', 'cdx').then((val) => {
                expect(val).toStrictEqual(['http://result.com', false]);
            });
        })

        test('dedups hrefs of nodes', () => {
            let node = document.createElement('a');
            node.href = 'testing';
            let nodeList = [node, node, node];
            expect(buildHrefListDedup(nodeList).length).toEqual(1);
        });

        test('calls callback funcs on intersection events', () => {
            let testValue = 'testValue';
            let testData = [{'intersectionRatio': 1, 'target': testValue}];
            let callback = jest.fn();
            getIntersectionCallback(callback, () => {})(testData);
            expect(callback).toBeCalledWith(testValue);
        });

        test('checks for already-queried results on single query', () => {
            let node = document.createElement('a');
            node.href = 'http://testing.com/test';
            let otherCallback = (val) => {
                let nodeVal = val[0];
                expect(nodeVal).toEqual(node);
            }
            let cb = getLinkQueryCallback('test', 'test', undefined, {'http://testing.com/test': Promise.resolve(false)}, otherCallback)
            cb(node);
        })

    });
}