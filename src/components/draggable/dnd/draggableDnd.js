import React, { useEffect, useRef } from "react"
import { useDragDropManager, useDraggable } from "@dnd-kit/react"
import { CSS } from "@dnd-kit/utilities"
import { useDragContext } from "../draggableContext"


function Draggable(props) {

	const draggableRef = useRef(null);

	const { ref } = useDraggable({
		id: props.id,
		feedback: "clone"
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

	// useDndMonitor({
    //     onDragStart(event){
	// 		if (event.active.id === props.id) {  // Ensure only this element triggers it
	// 			handleDragStart()
	// 		}
	// 	}, 
    //     onDragEnd(event){
	// 		if (event.active.id === props.id) {  // Ensure only this element triggers it
	// 			handleDragEnd()
	// 		}
	// 	}, 
    // })


	const { dragElementType, dragWidgetClass = null, elementMetaData } = props
	// const style = transform ? {
	// 	transform: CSS.Translate.toString(transform),
	// } : undefined

	const handleRef = (node) => {
		draggableRef.current = node
		ref(node)
	}


	const handleDragStart = (event) => {

		const {source} = event.operation
        
        if (source && source?.id !== props?.id){
            return
        }
		
		// event.dataTransfer.setData("text/plain", "")
		// onDragStart(draggableRef?.current, dragWidgetClass)
		onDragStart(draggableRef?.current, dragWidgetClass, elementMetaData)
		
	}

	const handleDragEnd = (event) => {
		// console.log("Drag end: ", e, e.target.closest('div'))
		const {source} = event.operation
        
        if (source && source?.id !== props?.id){
            return
        }

		console.log("Drage ended")
		onDragEnd()
	}


	// TODO: remove element meta data from props
	return (
		<div 
			{...props}
			ref={handleRef}
			className={`${props.className}`}
			// style={!disableStyle ? style : null} //enable this to show like the original item is moving, if commented out the original item will not have css effects
			draggable
			data-drag-start-within // this attribute indicates that the drag is occurring from within the project and not a outside file drop
			data-draggable-type={dragElementType}

		>
			{props.children}
		</div>
	)
}


export default Draggable