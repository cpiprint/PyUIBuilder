import { useEffect, useMemo, useState } from "react"

import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons"

import { SidebarWidgetCard, TreeViewCard } from "../components/cards"


import { Tree } from "antd"
import { useWidgetContext } from "../canvas/context/widgetContext"



function transformWidgets(widgets, widgetRefs, isTopLevel=true) {
    // console.log("Wdiegts refs: ", widgetRefs)
    return widgets.map(widget => ({
      title: widget.widgetType.name, // Assuming widgetType is a class
      key: widget.id,
      isTopLevel: isTopLevel,
      widgetRef: widgetRefs.current[widget.id],
      children: widget.children.length > 0 ? transformWidgets(widget.children, widgetRefs, false) : []
    }));
  }
  

/**
 * 
 * @param {function} onWidgetsUpdate - this is a callback that will be called once the sidebar is populated with widgets
 * @returns 
 */
function TreeviewContainer() {


    const {widgets, widgetRefs} = useWidgetContext()

    const transformedContent = useMemo(() => {
        return (transformWidgets(widgets, widgetRefs))
    }, [widgets, widgetRefs])

    const topLevelKeys = transformedContent.filter(cont => cont.isTopLevel).map(cont => cont.key)

    const onDeleteRequest = (widgetId) => {
        widgetRefs.current[widgetId].current?.deleteWidget()
    }


    return (
        <div className="tw-w-full tw-p-2 tw-gap-4 tw-flex tw-flex-col tw-overflow-x-hidden">

            {/* <SearchComponent onSearch={onSearch} searchValue={searchValue}
                onClear={() => setSearchValue("")} /> */}
            <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-h-full tw-p-1">

                <Tree treeData={transformedContent}
                        titleRender={(nodeData) => 
                            
                            <TreeViewCard widgetId={nodeData.id} title={nodeData.title} 
                                            widgetRef={nodeData.widgetRef}
                                            isTopLevel={nodeData.isTopLevel}/>
                        }
                        defaultExpandedKeys={topLevelKeys}
                        >
                  
                </Tree>

            </div>
        </div>
    )

}


export default TreeviewContainer