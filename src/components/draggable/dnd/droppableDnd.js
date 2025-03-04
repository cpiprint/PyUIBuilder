import React, { useEffect, useRef, useState } from 'react'
import { useDragDropManager, useDroppable } from '@dnd-kit/react'
import { useDragContext } from '../draggableContext'


function Droppable(props) {

    const droppableRef = useRef(null)
    const { droppableTags, onDrop } = props

    const { draggedElement, overElement, setOverElement, widgetClass } = useDragContext()

    const { ref, isDropTarget, droppable} = useDroppable({
        id: props.id,
        accept: (draggable) => {
            
            const allowDrop = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
                (droppableTags.include?.length > 0 && droppableTags.include?.includes(draggable.type)) ||
                (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(draggable.type))
            ))
        
            return allowDrop
        }
    })


    const manager = useDragDropManager()
    // const {}
    
    const [allowDrop, setAllowDrop] = useState({show: false, allow: false}) // indicator if the draggable can be dropped on the droppable

    useEffect(() => {

        manager?.monitor?.addEventListener("dragstart", handleDragEnter)
        manager?.monitor?.addEventListener("dragend", handleDragLeave)
        manager?.monitor?.addEventListener("dragmove", handleDragOver)

        return () => {
            manager?.monitor?.removeEventListener("dragstart", handleDragEnter)
            manager?.monitor?.removeEventListener("dragend", handleDragLeave)
            manager?.monitor?.removeEventListener("dragmove", handleDragOver)
        }
    }, [manager, draggedElement, widgetClass])


    const handleRef = (node) => {
		droppableRef.current = node
		ref(node)
	}

    // TODO: handle Drop on Canvas
    const handleDragEnter = (e) => {

        const {target, source} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }


        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        const dragElementType = draggedElement.getAttribute("data-draggable-type")

        setOverElement(document.getElementById(source.id))

        const dropAllowed = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
            (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
            (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
        ))

        console.log("droppable tags: ", dropAllowed)


        setAllowDrop({allow: dropAllowed, show: true})
       
    }

    const handleDragOver = (e) => {

        const {target} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }
        // console.log("Over sir1: ", draggedElement)


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


        setAllowDrop({allow: dropAllowed, show: true})

        // if (allowDrop) {
        //     e.preventDefault() // this is necessary to allow drop to take place
        // }

    }

    const handleDropEvent = (e) => {

        const {target} = e.operation
        
        if (target && target?.id !== props?.id){
            return
        }

        setAllowDrop({allow: false, show: false})


        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        // e.stopPropagation()

        const dragElementType = draggedElement.getAttribute("data-draggable-type")


        const dropAllowed = (droppableTags && droppableTags !== null && (Object.keys(droppableTags).length === 0 ||
            (droppableTags.include?.length > 0 && droppableTags.include?.includes(dragElementType)) ||
            (droppableTags.exclude?.length > 0 && !droppableTags.exclude?.includes(dragElementType))
        ))

        console.log("Widget class1: ", widgetClass, draggedElement)

        if (onDrop && dropAllowed) {
            onDrop(e, draggedElement, widgetClass)
        }
    }


    const handleDragLeave = (e) => {
        
        const {target} = e.operation
        
        if (target && target.id === props.id){
            handleDropEvent(e)
        }else{
            setAllowDrop({allow: false, show: false})

        }
        
    }

    return (
        <div ref={handleRef} className={props.className || ''}>

            {props.children}

            {
                allowDrop.show &&
                <div className={`${allowDrop.allow ? "tw-bg-[#82ff1c6e]" : "tw-bg-[#eb5d366e]"} 
                                    tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-z-[0]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                </div>
            }
   
        </div>
    )
}

export default Droppable