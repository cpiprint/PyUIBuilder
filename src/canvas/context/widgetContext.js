import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

export const WidgetContext = createContext()

export const useWidgetContext = () => useContext(WidgetContext)


export const WidgetContextProvider = ({ children }) => {
    
    const [activeWidget, setActiveWidget] = useState(null)
    const [widgets, setWidgets] = useState([]) // stores the mapping to widgetRefs, stores id and WidgetType, later used for rendering [{id: , widgetType: WidgetClass, children: [], parent: "", initialData: {}}]

    // don't useState here because the refs are changing often
    const widgetRefs = useRef({}) // stores the actual refs to the widgets inside the canvas {id: ref, id2, ref2...}


    return (
        <WidgetContext.Provider value={{ widgets, setWidgets, widgetRefs, 
                                            activeWidget, setActiveWidget }}>
            {children}
        </WidgetContext.Provider>
    )
}
