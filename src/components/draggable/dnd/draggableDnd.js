import React, { useEffect, useRef } from "react"
import { useDndMonitor, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useDragContext } from "../draggableContext"


function Draggable(props) {

	const draggableRef = useRef(null) 

	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: props.id,
		data: { title: props.children }
	})

	const {onDragStart, onDragEnd, disableStyle=false} = useDragContext()

	useDndMonitor({
        onDragStart(event){
			if (event.active.id === props.id) {  // Ensure only this element triggers it
				handleDragStart()
			}
		}, 
        onDragEnd(event){
			if (event.active.id === props.id) {  // Ensure only this element triggers it
				handleDragEnd()
			}
		}, 
    })

	useEffect(() => {
		
		if (draggableRef.current)
			setNodeRef(draggableRef.current)
	
	}, [draggableRef.current, setNodeRef])

	const { dragElementType, dragWidgetClass = null, elementMetaData } = props
	const style = transform ? {
		transform: CSS.Translate.toString(transform),
	} : undefined


	const handleDragStart = (event) => {

		console.log("Drag start1: ", elementMetaData)
		// event.dataTransfer.setData("text/plain", "")
		// onDragStart(draggableRef?.current, dragWidgetClass)
		onDragStart(draggableRef?.current, dragWidgetClass, elementMetaData)
		
	}

	const handleDragEnd = (e) => {
		// console.log("Drag end: ", e, e.target.closest('div'))

		onDragEnd()
	}



	return (
		<div className={`${props.className}`}
			ref={draggableRef}
			// style={!disableStyle ? style : null} //enable this to show like the original item is moving, if commented out the original item will not have css effects
			draggable
			data-drag-start-within // this attribute indicates that the drag is occurring from within the project and not a outside file drop
			data-draggable-type={dragElementType}
			{...listeners}
			{...attributes}
			{...props}
		>
			{props.children}
		</div>
	)
}


export default Draggable