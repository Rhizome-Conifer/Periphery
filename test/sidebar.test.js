import { BoundarySidebar } from '../src/boundary-sidebar';

export function sidebarTestRunner() {
    describe('renders boundary sidebar correctly', () => {
        customElements.define('boundary-sidebar', BoundarySidebar);

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
                "query": "#test-div"
            },
            "type": "on-load",
            "action": {
                "type": "disable"
            },
            "description": "test boundary 2."
        },
        ]

        beforeEach(() => {
            let elemStyle = '{ position: absolute; top: 15px; left: 15px; width: 25px; height: 40px; }'
            let testElem = document.createElement('div');
            testElem.id = 'test-div';
            testElem.style.cssText = elemStyle;
            document.body.appendChild(testElem);
        })

        afterEach(() => {
            document.body.querySelector('#test-div').remove();
            document.body.querySelector('boundary-sidebar').remove();
        })      
    
        test('renders boundary list divs correctly', () => {
            let sidebar = document.createElement('boundary-sidebar');
            sidebar.boundaries = testBoundaries;
            document.body.appendChild(sidebar);
            return sidebar.updateComplete.then((complete) => {
                let boundaryList = sidebar.shadowRoot.querySelector('#boundary-list');
                expect(boundaryList.children.length).toEqual(2);
            });
        });
        
        test('renders default overlay divs correctly', () => {

        })
        


    });


}