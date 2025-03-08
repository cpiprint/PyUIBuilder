import { useEffect, useMemo, useState } from "react"

import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons"

import { SidebarWidgetCard, TreeViewCard } from "../components/cards"

import ButtonWidget from "../assets/widgets/button.png"

import { filterObjectListStartingWith } from "../utils/filter"
import Widget from "../canvas/widgets/base"
import { SearchComponent } from "../components/inputs"
import { Tree } from "antd"
import { TreeNode } from "antd/es/tree-select"


/**
 * 
 * @param {function} onWidgetsUpdate - this is a callback that will be called once the sidebar is populated with widgets
 * @returns 
 */
function TreeviewContainer({ sidebarContent, onWidgetsUpdate }) {


    const [searchValue, setSearchValue] = useState("")
    const [widgetData, setWidgetData] = useState(sidebarContent)


    const treeData = [
        {
            title: 'Parent',
            key: '0-0',
            children: [
                { title: 'Child 1', key: '0-0-1' },
                { title: 'Child 2', key: '0-0-2' },
            ],
        },
    ];

    useEffect(() => {

        setWidgetData(sidebarContent)
        // if (onWidgetsUpdate){
        //     onWidgetsUpdate(widgets)
        // }

    }, [sidebarContent])



    // useEffect(() => {

    //     if (searchValue.length > 0) {
    //         const searchData = filterObjectListStartingWith(sidebarContent, "name", searchValue)
    //         setWidgetData(searchData)
    //     } else {
    //         setWidgetData(sidebarContent)
    //     }

    // }, [searchValue])

    function onSearch(event) {

        setSearchValue(event.target.value)

    }

    return (
        <div className="tw-w-full tw-p-2 tw-gap-4 tw-flex tw-flex-col tw-overflow-x-hidden">

            {/* <SearchComponent onSearch={onSearch} searchValue={searchValue}
                onClear={() => setSearchValue("")} /> */}
            <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-h-full tw-p-1">

                <Tree treeData={treeData}
                        titleRender={(nodeData) => 
                            <TreeViewCard title={nodeData.title}/>
                        }
                        >
                  
                </Tree>

            </div>
        </div>
    )

}


export default TreeviewContainer