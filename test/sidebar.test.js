import { BoundarySidebar } from '../src/boundary-sidebar';

export function sidebarTestRunner() {
    describe('renders boundary sidebar correctly', () => {

        // const { location } = window;
        let windowMock;
        const TEST_ID = 'test-div';
        const testBoundaries = [{
            "resource": "all",
            "selector": {
                "type": "css-selector",
                "query": "#test-div"
            },
            "type": "on-load",
            "action": {
                "type": "disable"
            },
            "description": "test boundary."
        },
        {
            "resource": "all",
            "selector": {
                "type": "css-selector",
                "query": "#test-div-2"
            },
            "type": "on-load",
            "action": {
                "type": "disable"
            },
            "description": "test boundary 2."
        }];
        customElements.define('boundary-sidebar', BoundarySidebar);
        

        beforeEach(() => {
            let elemStyle = 'position: absolute; top: 15px; left: 15px; width: 25px; height: 40px;'
            let testElem = document.createElement('div');
            testElem.id = TEST_ID;
            testElem.style.cssText = elemStyle;
            document.body.appendChild(testElem);
        })

        afterEach(() => {
            document.body.querySelector('#test-div').remove();
            document.body.querySelector('boundary-sidebar').remove();
        })      
    
        test('renders boundary list divs correctly', () => {
            let sidebar = document.createElement('boundary-sidebar');
            document.body.appendChild(sidebar);
            sidebar.boundaries = testBoundaries;
            return sidebar.updateComplete.then((complete) => {
                let boundaryList = sidebar.shadowRoot.querySelector('#boundary-list');
                expect(boundaryList.children.length).toEqual(2);
            });
        });
        
        test('renders default overlay divs correctly', () => {
            let sidebar = document.createElement('boundary-sidebar');
            document.body.appendChild(sidebar);
            sidebar.boundaries = testBoundaries;
            return Promise.all([sidebar.updateComplete, sidebar.boundariesApplied]).then(() => {
                let overlayRoot = sidebar.shadowRoot.querySelector('.overlay-root');
                let overlay = overlayRoot.children[0];
                expect(overlay.shadowRoot.children[0].style.width).toEqual('25px');    
                expect(overlay.shadowRoot.children[0].style.height).toEqual('40px');    
            })
        });

        test('applies boundary and styles matching divs correctly', () => {
            let sidebar = document.createElement('boundary-sidebar');
            document.body.appendChild(sidebar);
            sidebar.boundaries = testBoundaries;
            return Promise.all([sidebar.updateComplete, sidebar.boundariesApplied]).then(() => {
                let testDiv = document.querySelector('#' + TEST_ID);
                expect(testDiv.style.pointerEvents).toEqual('none');    
            })
        });

        test('performs resource matching correctly', () => {
            const resourceBoundary = [{
                "resource": "http://testweb.site/testing",
                "selector": {
                    "type": "css-selector",
                    "query": "#test-div"
                },
                "type": "on-load",
                "action": {
                    "type": "disable"
                },
                "description": "test boundary."
            }];
            let sidebar = document.createElement('boundary-sidebar');
            document.body.appendChild(sidebar);
            sidebar.boundaries = resourceBoundary;
            return Promise.all([sidebar.updateComplete, sidebar.boundariesApplied]).then(() => {
                // Should not perform any boundary application, because window.location.href doesn't match
                let testDiv = document.querySelector('#' + TEST_ID);
                expect(testDiv.style.pointerEvents).toEqual('');    
            })

        })
        
    });


}