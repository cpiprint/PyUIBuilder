import React, { createContext, useContext, useState } from 'react';

const widgetContext = createContext()

export const useSelectedWidgetContext = () => useContext(widgetContext)


export const WidgetContextProvider = ({ children }) => {
    const [widgets, setWidgets] = useState(null)

    const [widgetRef, setWidgetRef] = useState({})
    // const []

    return (
        <widgetContext.Provider value={{ widgets, setWidgets, widgetRef, setWidgetRef }}>
            {children}
        </widgetContext.Provider>
    )
}
