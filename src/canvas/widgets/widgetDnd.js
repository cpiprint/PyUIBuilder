import React, { useEffect, useRef, useState } from 'react'
import { useDragDropManager, useDroppable, useDraggable } from '@dnd-kit/react'
import { useDragContext } from '../../components/draggable/draggableContext'
import WidgetContainer from '../constants/containers'
import { useSortable } from '@dnd-kit/react/sortable'
import {
    pointerIntersection,
    closestCenter,
    shapeIntersection
  } from '@dnd-kit/collision'


function WidgetDnd({widgetId, canvas, widgetRef, droppableTags,onMousePress, onDrop, onDragStart, 
                        onDragEnd, onDragEnter, onDragOver, currentPos={x: 0, y: 0}, 
                        dragElementType, isSortable=false, sortableIndex=0,
                            ...props}) {

    const dndRef = useRef(null)


    const { draggedElement, setOverElement, widgetClass, setPosMetaData } = useDragContext()

    const [isDropDisabled, setIsDropDisabled] = useState(false);

    const { ref: dropRef, droppable} = useDroppable({
        id: widgetId,
        disabled: isDropDisabled,
        collisionDetector: pointerIntersection,
        // accept: (draggable) => {
            
        //     const allowDrop = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
        //         (droppableTags.include?.length > 0 && droppableTags.include?.includes(draggable.type)) ||
        //         (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(draggable.type))
        //     ))
        
        //     return allowDrop
        // }
    })


    const { ref: dragRef, draggable } = useDraggable({
		id: widgetId,
		feedback: "move",
		type: dragElementType,
        disabled: props.disabled,
        
		// data: { title: props.children }
	})


    // const {ref: sortableRef} = useSortable({
    //     id: widgetId,
    //     index: sortableIndex,
    //     disabled: false && isSortable,
    //     feedback: 'move'
    // })
 
    const manager = useDragDropManager()

    // const {}
	const {onDragStart: onDragContextStart, onDragEnd: onDragContextEnd, disableStyle=false} = useDragContext()
    const [allowDrop, setAllowDrop] = useState(false) // indicator if the draggable can be dropped on the droppable

    useEffect(() => {
        
        if (draggable.isDragging){
            setIsDropDisabled(true)
        }else{
            setIsDropDisabled(false)
        }

    }, [draggable.isDragging])

    useEffect(() => {

        canvas?.addEventListener("pointerdown", handleInitialPosOffset)
        canvas?.addEventListener("mousedown", handleInitialPosOffset)

        manager?.monitor?.addEventListener("dragstart", handleDragEnter)
        manager?.monitor?.addEventListener("dragend", handleDropEvent)
        manager?.monitor?.addEventListener("dragmove", handleDragOver)
        // manager?.monitor?.addEventListener("dragover", onDragEndhandleDragOver)

        return () => {
            manager?.monitor?.removeEventListener("dragstart", handleDragEnter)
            manager?.monitor?.removeEventListener("dragend", handleDropEvent)
            manager?.monitor?.removeEventListener("dragmove", handleDragOver)
            
            canvas?.removeEventListener("mousedown", handleInitialPosOffset)
            canvas?.removeEventListener("pointerdown", handleInitialPosOffset)


        }
    }, [manager, draggedElement, widgetClass, canvas, currentPos])


    const handleRef = (node) => {
		dndRef.current = node
        widgetRef.current = node
		dropRef(node)
		dragRef(node)
        // sortableRef(node)
	}

    const handleInitialPosOffset = (e) => {


        if (!widgetRef?.current.contains(e.target)){
            return
        }

        console.log("canvas bounding rect: ", canvas.getBoundingClientRect(), widgetRef.current)

        const {clientX, clientY} = e

        const canvasBoundingRect = canvas.getBoundingClientRect()

        const posMetaData = {
            dragStartCursorPos: {x: clientX, y: clientY},
            initialPos: currentPos
        }

        setPosMetaData(posMetaData)
        console.log("initial position calc: ", posMetaData, currentPos, (clientX - canvasBoundingRect.left), (clientY - canvasBoundingRect.top), "client: ", clientX, clientY, canvasBoundingRect)

    }

    const handleDragEnter = (e) => {


        if (draggable.isDragSource){
            

		    // if the current widget is being dragged
            onDragContextStart(dndRef?.current, widgetClass, {})

            dndRef.current.style.zIndex = 10

            onDragStart(e)

            return 

        }else if (droppable.isDropTarget){

            if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
                // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
                return
            }
    
            const dragElementType = draggedElement.getAttribute("data-draggable-type")
    
            setOverElement(dndRef.current)
    
            const dropAllowed = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
                (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
                (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
            ))
    
    
            setAllowDrop(dropAllowed)
        }

       
    }

    const handleDragOver = (e) => {
        
        if (droppable.isDropTarget){
            if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
                // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
                return
            }
    
            // console.log("Drag over: ", e.dataTransfer.getData("text/plain"), e.dataTransfer)
            const dragElementType = draggedElement.getAttribute("data-draggable-type")
            
            const dropAllowed = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
                (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
                (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
            ))
    
            console.log("Drop allowed: ", dropAllowed, dragElementType )
            setAllowDrop(dropAllowed)

            onDragOver(e)
        }

    }

    const handleDropEvent = (e) => {

        if (draggable.isDragSource){
    		onDragContextEnd()
            onDragEnd(e)

        }else if (droppable.isDropTarget){
            // setAllowDrop(false)


            if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
                // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
                return
            }

            const dragElementType = draggedElement.getAttribute("data-draggable-type")

            const dropAllowed = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
                (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
                (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
            ))

            if (onDrop && dropAllowed && (droppable.isDropTarget && !draggable.isDragSource)) {
                onDrop(e, draggedElement, widgetClass)
            }

        }   

        
    }

    
    return (
        <div ref={handleRef} data-drag-start-within 
                {...props}
                data-widget-id={widgetId}
                data-draggable-type={dragElementType}
                className={`${props.className || ''} ${draggable.isDragging && "tw-pointer-events-none"} tw-outline
                            tw-border-2 tw-border-solid tw-border-red-400
                            tw-relative tw-outline-none`}  
                >

            {props.children}
            
            {/* <div className={`${allowDrop ? "tw-bg-[#82ff1c55]" : "tw-bg-[#eb5d3662]"} 
                                    tw-absolute tw-top-0 tw-left-[${rect.}] tw-w-full tw-h-full tw-z-[3]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                </div> */}

            {
                (droppable.isDropTarget && !draggable.isDragSource) &&
                <div className={`${allowDrop ? "tw-bg-[#82ff1c55]" : "tw-bg-[#eb5d3662]"} 
                                    tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-z-[3]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                </div>
            }
        </div>
    )
}

export default WidgetDnd