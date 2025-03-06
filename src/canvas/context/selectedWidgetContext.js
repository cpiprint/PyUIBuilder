import React, { createContext, useContext, useState } from 'react';

const selectedWidgetContext = createContext()

export const useSelectedWidgetContext = () => useContext(selectedWidgetContext)

// NOTE: not in use
export const SelectedWidgetProvider = ({ children }) => {
    const [selectedWidget, setSelectedWidget] = useState(null)

    // const []

    return (
        <selectedWidgetContext.Provider value={{ selectedWidget, setSelectedWidget }}>
            {children}
        </selectedWidgetContext.Provider>
    )
}
