import React, { useEffect, useRef, useState } from 'react'
import { useDragDropManager, useDroppable, useDraggable } from '@dnd-kit/react'
import { useDragContext } from '../../components/draggable/draggableContext'


function WidgetDnd({widgetId, droppableTags, onDrop,
                            ...props}) {

    const dndRef = useRef(null)

    const {dragElementType} = props

    const { draggedElement, setOverElement, widgetClass } = useDragContext()

    const { ref: dropRef, isDropTarget, droppable} = useDroppable({
        id: widgetId,
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
		feedback: "default",
		type: dragElementType,
        disabled: props.disabled,

		// data: { title: props.children }
	})

 
    const manager = useDragDropManager()

    // const {}
	const {onDragStart, onDragEnd, disableStyle=false} = useDragContext()
    
    const [allowDrop, setAllowDrop] = useState({show: false, allow: false}) // indicator if the draggable can be dropped on the droppable

    useEffect(() => {

        manager?.monitor?.addEventListener("dragstart", handleDragEnter)
        manager?.monitor?.addEventListener("dragend", handleDropEvent)
        manager?.monitor?.addEventListener("dragmove", handleDragOver)
        // manager?.monitor?.addEventListener("dragover", onDragEndhandleDragOver)


        return () => {
            manager?.monitor?.removeEventListener("dragstart", handleDragEnter)
            manager?.monitor?.removeEventListener("dragend", handleDropEvent)
            manager?.monitor?.removeEventListener("dragmove", handleDragOver)
        }
    }, [manager, draggedElement])


    const handleRef = (node) => {
		dndRef.current = node
		dropRef(node)
		dragRef(node)
	}

    const handleDragEnter = (e) => {

        const {target, source} = e.operation


        if (draggable.isDragSource){
		    // if the current widget is being dragged
            onDragStart(dndRef?.current, widgetClass)

            dndRef.current.style.zIndex = 10

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
    
            console.log("droppable tags: ", dropAllowed)
    
    
            setAllowDrop({allow: dropAllowed, show: true})
          
        }



       
    }

    const handleDragOver = (e) => {
        const {target} = e.operation

        // if (draggable.isDragSource){
		//     onDragStart(dndRef?.current, widgetClass)
            
        //     // TODO
        //     dndRef.current.style.zIndex = 10 
        // }

        
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
    
    
            setAllowDrop({allow: dropAllowed, show: true})

        }
        // console.log("Over sir1: ", draggedElement)



        // if (allowDrop) {
        //     e.preventDefault() // this is necessary to allow drop to take place
        // }

    }

    const handleDropEvent = (e) => {

        const {target} = e.operation
        
        if (draggable.isDragSource){
    		onDragEnd()

        }else if (droppable.isDropTarget){
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

            if (onDrop && dropAllowed && (droppable.isDropTarget && !draggable.isDragSource)) {
                onDrop(e, draggedElement, widgetClass)
            }
        }   

        
    }


    // const handleDragLeave = (e) => {
        
    //     const {target} = e.operation
        
    //     if (target && target.id === props.id){
    //         handleDropEvent(e)
    //     }else{
    //         setAllowDrop({allow: false, show: false})

    //     }
        
    // }

    // const handleDragStart = (event) => {

	// 	const {source} = event.operation
		
    //     if (!source || (source && source.id !== props.dragElementType)){
    //         return
    //     } if (!source || (source && source.id !== props.dragElementType)){
    //         return
    //     }
	// 	// event.dataTransfer.setData("text/plain", "")
	// 	// onDragStart(draggableRef?.current, dragWidgetClass)
	// 	onDragStart(draggableRef?.current, dragWidgetClass, elementMetaData)
		
	// }

	// const handleDragEnd = (event) => {
	// 	// console.log("Drag end: ", e, e.target.closest('div'))
	// 	const {source} = event.operation
        
	// 	if (!source || (source && source.id !== props.dragElementType)){
    //         return
    //     }

	// 	// onDragEnd()
	// }

    return (
        <div ref={handleRef} data-drag-start-within 
                {...props}
                draggable
                data-draggable-type={dragElementType}
                className={`${props.className} tw-relative tw-h-fit tw-w-fit tw-outline-none`}  
                >

            {props.children}

            {
                (droppable.isDropTarget && !draggable.isDragSource) &&
                <div className={`${allowDrop.allow ? "tw-bg-[#82ff1c6e]" : "tw-bg-[#eb5d366e]"} 
                                    tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-z-[3]
                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none
                                    `}>
                </div>
            }
        </div>
    )
}

export default WidgetDnd