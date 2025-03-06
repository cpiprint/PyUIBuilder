import { memo, useRef } from "react"
import { useDragContext } from "./draggableContext"


/**
 * 
 * @param {string} - dragElementType - this will set the data-draggable-type which can be accessed on droppable to check if its allowed or not
 * @returns 
 */
const DraggableWrapper = memo(({dragElementType, dragWidgetClass=null, currentPos, className, children, ...props}) => {

    const { onDragStart, onDragEnd, setPosMetaData } = useDragContext()

    const draggableRef = useRef(null)

    const setInitialPos = (e) => {
        const {clientX, clientY} = e

        
        const posMetaData = {
            dragStartCursorPos: {x: clientX, y: clientY},
            initialPos: currentPos
        }

        setPosMetaData(posMetaData)
    }

    /**
     * 
     * @param {DragEvent} event 
     */
    const handleDragStart = (event) => {
        
        // event.dataTransfer.setData("text/plain", "")
        onDragStart(draggableRef?.current, dragWidgetClass)

    }

    const handleDragEnd = (e) => {
        // console.log("Drag end: ", e, e.target.closest('div'))

        onDragEnd()
    }   

    return (
        <div className={`${className}`} 
                draggable 
                data-drag-start-within // this attribute indicates that the drag is occurring from within the project and not a outside file drop
                data-draggable-type={dragElementType}
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
                ref={draggableRef}
                onPointerDown={setInitialPos}
                onMouseDown={setInitialPos}
                {...props}
                >
            {children}
        </div>
    )

})


export default DraggableWrapper