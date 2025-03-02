import React, { useEffect, useRef, useState } from 'react'
import { useDragDropManager, useDroppable } from '@dnd-kit/react'
import { useDragContext } from '../draggableContext'


function Droppable(props) {

    const droppableRef = useRef(null)

    const { isOver, ref, isDropTarget, droppable } = useDroppable({
        id: props.id,

    })

    const style = {
        backgroundColor: isOver ? 'green' : '',
    }

    // const manager = useDragDropManager({
    //     onDragStart: (event) => {
    //         if (event.over?.id === props.id){
    //             handleDragEnter(event)
    //             // setDragPosition({
    //             //     ...dragPosition,
    //             //     startX: event.over.
    //             // })

    //         }
    //         console.log("starting: ", event)
    //     },
    //     onDragMove: (event) => {
    //         console.log("Drag move: ", event.active.rect)
    //         if (event.over?.id === props.id)
    //             handleDragOver(event)
    //     },
    //     onDragEnd: (event) => {

    //         if (event.over?.id === props.id){
    //             if (event.over) {
    //                 handleDropEvent(event) // Item was dropped inside a valid container
    //             } else {
    //                 handleDragLeave(event) // Drag was canceled
    //             }
    //         }
    //     },
    // })

    const manager = useDragDropManager()

    useEffect(() => {

        manager?.monitor?.addEventListener("dragstart", handleDragEnter)
        manager?.monitor?.addEventListener("dragend", handleDragLeave)
        manager?.monitor?.addEventListener("dragover", handleDragOver)


        return () => {
            manager?.monitor?.removeEventListener("dragstart", handleDragEnter)
            manager?.monitor?.removeEventListener("dragend", handleDragLeave)
            manager?.monitor?.removeEventListener("dragover", handleDragOver)
        }
    }, [manager])


    const { droppableTags, onDrop } = props

    const { draggedElement, overElement, setOverElement, widgetClass } = useDragContext()

    // const {}

    const [allowDrop, setAllowDrop] = useState(false) // indicator if the draggable can be dropped on the droppable

    // useEffect(() => {

    //     if (droppableRef.current)
    //         setNodeRef(droppableRef.current)

    // }, [droppableRef.current, setNodeRef])


    // TODO: handle Drop on Canvas
    const handleDragEnter = (e) => {

        
        const {target} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        const dragElementType = draggedElement.getAttribute("data-draggable-type")

        setOverElement(document.getElementById(e.over.id))

        const allowDrop = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
            (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
            (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
        ))

        setAllowDrop(allowDrop)
       
    }

    const handleDragOver = (e) => {

        const {target} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }
        console.log("Over sir1: ", draggedElement)


        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        // console.log("Drag over: ", e.dataTransfer.getData("text/plain"), e.dataTransfer)
        const dragElementType = draggedElement.getAttribute("data-draggable-type")
        
        const allowDrop = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
            (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
            (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
        ))

        console.log("Over sir: ", allowDrop)


        setAllowDrop(allowDrop)
        // if (allowDrop) {
        //     e.preventDefault() // this is necessary to allow drop to take place
        // }

    }

    const handleDropEvent = (e) => {

        const {target} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }

        setAllowDrop(false)

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        // e.stopPropagation()
        console.log("Drag ended: ", e)

        const dragElementType = draggedElement.getAttribute("data-draggable-type")


        const allowDrop = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
            (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
            (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
        ))

        if (onDrop && allowDrop) {
            onDrop(e, draggedElement, widgetClass)
        }
    }


    const handleDragLeave = (e) => {
        
        const {target} = e.operation
        
        console.log("Drag: ", target?.id, props.id)
        if (target && target.id === props.id){
            handleDropEvent(e)
        }else{
            setAllowDrop(false)
        }
        
    }

    return (
        <div ref={ref} style={style} className={props.className || ''}>
            {props.children}
            {/* {
                showDroppable.show && 
                    <div className={`${showDroppable.allow ? "tw-border-green-600" : "tw-border-red-600"} 
                                    tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-z-[2]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                    </div>
            } */}

            {
                isDropTarget &&
                <div className={`${allowDrop ? "tw-bg-[#82ff1c6e]" : "tw-bg-[#eb5d366e]"} 
                                    tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-z-[999]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                </div>
            }
        </div>
    )
}

export default Droppable