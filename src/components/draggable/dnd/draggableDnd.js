import React, { useEffect, useRef } from "react"
import { useDragDropManager, useDraggable } from "@dnd-kit/react"
import { CSS } from "@dnd-kit/utilities"
import { useDragContext } from "../draggableContext"


function Draggable({dragElementType, dragWidgetClass = null, elementMetaData, ...props}) {

	const draggableRef = useRef(null);

	const { ref, draggable } = useDraggable({
		id: dragElementType,
		feedback: props.draggableType || "default",
		type: dragElementType
		// data: { title: props.children }
	})

	const {onDragStart, onDragEnd, disableStyle=false} = useDragContext()

	const manager = useDragDropManager()

	useEffect(() => {

		manager?.monitor?.addEventListener("dragstart", handleDragStart)
        manager?.monitor?.addEventListener("dragend", handleDragEnd)


        return () => {
            manager?.monitor?.removeEventListener("dragstart", handleDragStart)
            manager?.monitor?.removeEventListener("dragend", handleDragEnd)
        }

	}, [manager])


	// const style = transform ? {
	// 	transform: CSS.Translate.toString(transform),
	// } : undefined

	const handleRef = (node) => {
		draggableRef.current = node
		ref(node)
	}


	const handleDragStart = (event) => {

		const {source} = event.operation
		
        if (!draggable.isDragSource){
            return
        }

		// event.dataTransfer.setData("text/plain", "")
		// onDragStart(draggableRef?.current, dragWidgetClass)
		onDragStart(draggableRef?.current, dragWidgetClass, elementMetaData)
		
	}

	const handleDragEnd = (event) => {
		// console.log("Drag end: ", e, e.target.closest('div'))
		const {source} = event.operation
        
		if (!draggable.isDragSource){
            return
        }

		onDragEnd()
	}


	// TODO: remove element meta data from props
	return (
		<div 
			ref={handleRef}
			className={`${props.className}`}
			// style={!disableStyle ? style : null} //enable this to show like the original item is moving, if commented out the original item will not have css effects
			data-drag-start-within // this attribute indicates that the drag is occurring from within the project and not a outside file drop
			data-draggable-type={dragElementType}
			{...props}

		>
			{props.children}
		</div>
	)
}


export default Draggable