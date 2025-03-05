import React, { createContext, useContext, useState } from 'react'
import { isSubClassOfWidget } from '../../utils/widget'
import { useDndContext } from '@dnd-kit/core'
// import Widget from '../../canvas/widgets/base'

export const DragContext = createContext()

export const useDragContext = () => useContext(DragContext)

// Provider component to wrap around parts of your app that need drag-and-drop functionality
export const DragProvider = ({ children }) => {
    const [draggedElement, setDraggedElement] = useState(null)
    const [overElement, setOverElement] = useState(null) // the element the dragged items is over

    const [initialOffset, setInitialOffset] = useState({x: 0, y: 0})

    const [dragElementMetaData, setDragElementMetaData] = useState({})

    const [widgetClass, setWidgetClass] = useState(null) // helper to help pass the widget type from sidebar to canvas

    const [isDragging, setIsDragging] = useState(false)

    const onDragStart = (element, widgetClass=null, metaData={}) => {
        
        setDraggedElement(element)
        setIsDragging(true)
        setDragElementMetaData(metaData)

        if (widgetClass && !isSubClassOfWidget(widgetClass))
            throw new Error("widgetClass must inherit from the Widget base class")

        setWidgetClass(() => widgetClass) // store the class so later it can be passed to the canvas from sidebar

        
    }

    const onDragEnd = (pos) => {
        setDraggedElement(null)
        setWidgetClass(null)
        setIsDragging(false)

        // setInitialOffset({x: 0, y: 0})
        setDragElementMetaData({})

    }

    return (
        <DragContext.Provider value={{ draggedElement, overElement, setOverElement, 
                                            widgetClass, onDragStart, onDragEnd, isDragging,
                                            dragElementMetaData, setDragElementMetaData, 
                                            initialOffset, setInitialOffset
                                            }}>
            {children}
        </DragContext.Provider>
    )
}
