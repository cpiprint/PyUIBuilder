import React from "react"

// import { DndContext } from '@dnd-kit/core'

import { DeleteOutlined, EditOutlined, FileImageOutlined, ReloadOutlined } from "@ant-design/icons"
import { Button, Tooltip, Dropdown, message } from "antd"

import domtoimage from "dom-to-image-more"
import { saveAs } from 'file-saver'

// import Droppable from "../components/utils/droppableDnd"
import Widget from "./widgets/base"
import Cursor from "./constants/cursor"

import CanvasToolBar from "./toolbar"

import { UID } from "../utils/uid"
import { removeDuplicateObjects } from "../utils/common"


// import DotsBackground from "../assets/background/dots.svg"
import { ReactComponent as DotsBackground } from "../assets/background/dots.svg"

import DroppableWrapper from "../components/draggable/droppable"

import { Layouts, PosType } from "./constants/layouts"
import WidgetContainer from "./constants/containers"
import { isSubClassOfWidget } from "../utils/widget"
import { ButtonModal } from "../components/modals"
import ResizeWidgetContainer from "./resizeContainer"
import { WidgetContext, WidgetContextProvider } from "./context/widgetContext"

// const DotsBackground = require("../assets/background/dots.svg")

// FIXME: once the items is selected and deleted , the toolbar doesn't disappear
const CanvasModes = {
    DEFAULT: 0,
    PAN: 1,
    MOVE_WIDGET: 2 // when the mode is move widget
}

// TODO: replace this.widgetRefs with this.widgetRefs.current

const IS_PRODUCTION = process.env.NODE_ENV === "production"

class Canvas extends React.Component {

    // static contextType = ActiveWidgetContext

    constructor(props) {
        super(props)

        // const { canvasWidgets, onWidgetListUpdated } = props

        this.canvasRef = React.createRef()
        this.canvasContainerRef = React.createRef()


        this.currentMode = CanvasModes.DEFAULT

        this.minCanvasSize = { width: 500, height: 500 }

        this.mousePressed = false
        this.mousePos = {
            x: 0,
            y: 0
        }

        this.setWidgets = null // a helper variable to help update widgets from widgetProviderContext
        this.widgetRefs = {} // a helper variable to store the widgetRef from widgetProviderContext (doesn't store a copy but just a reference pointer )
        this.widgets = [] // a helper variable to store the widgets from widgetProviderContext (doesn't store a copy but just a reference pointer )

        this.selectedWidget = null // a helper variable that stores the reference to the selected widget fro widgetProvider
        this.setSelectedWidget = null // a helper variable that stores reference to setSelected fro widgetProvider context
        // this._contextMenuItems = []

        this.state = {
            isWidgetDragging: false,
            widgetResizing: "", // set this to "nw", "sw" etc based on the side when widgets resizing handles are selected
            // widgets: [], // stores the mapping to widgetRefs, stores id and WidgetType, later used for rendering [{id: , widgetType: WidgetClass, children: [], parent: "", initialData: {}}]
            zoom: 1,
            isPanning: false,
            currentTranslate: { x: 0, y: 0 },
            canvasSize: { width: 500, height: 500 },

            contextMenuItems: [],
            // selectedWidget: null,

            toolbarOpen: false,
            toolbarAttrs: null
        }

        // this._onWidgetListUpdated = onWidgetListUpdated // a function callback when the widget is added to the canvas

        this.resetTransforms = this.resetTransforms.bind(this)
        this.renderWidget = this.renderWidget.bind(this)

        this.mouseDownEvent = this.mouseDownEvent.bind(this)
        this.mouseMoveEvent = this.mouseMoveEvent.bind(this)
        this.mouseUpEvent = this.mouseUpEvent.bind(this)
        this.keyDownEvent = this.keyDownEvent.bind(this)
        this.wheelZoom = this.wheelZoom.bind(this)

        this.onActiveWidgetUpdate = this.onActiveWidgetUpdate.bind(this)

        this.getWidgets = this.getWidgets.bind(this)
        this.getActiveObjects = this.getActiveObjects.bind(this)
        this.getWidgetFromTarget = this.getWidgetFromTarget.bind(this)

        this.getCanvasObjectsBoundingBox = this.getCanvasObjectsBoundingBox.bind(this)
        this.fitCanvasToBoundingBox = this.fitCanvasToBoundingBox.bind(this)

        this.getCanvasContainerBoundingRect = this.getCanvasContainerBoundingRect.bind(this)
        this.getCanvasBoundingRect = this.getCanvasBoundingRect.bind(this)

        // this.setSelectedWidget = this.setSelectedWidget.bind(this)
        this.deleteSelectedWidgets = this.deleteSelectedWidgets.bind(this)
        this.removeWidget = this.removeWidget.bind(this)
        this.clearSelections = this.clearSelections.bind(this)
        this.clearCanvas = this.clearCanvas.bind(this)

        this.createWidget = this.createWidget.bind(this)

        this.closeToolBar = this.closeToolBar.bind(this)

        // this.updateCanvasDimensions = this.updateCanvasDimensions.bind(this) 
    }

    componentDidMount() {
        this.initEvents()

        // NOTE: adding the transform will make the inner fixed position to be relative
        // NOTE: this is needed to keep the resize widget poition correct in base widget
        this.applyTransform()
    }

    componentWillUnmount() {

        this.canvasContainerRef.current.removeEventListener("mousedown", this.mouseDownEvent)
        this.canvasContainerRef.current.removeEventListener("mouseup", this.mouseUpEvent)
        this.canvasContainerRef.current.removeEventListener("mousemove", this.mouseMoveEvent)
        this.canvasContainerRef.current.removeEventListener("wheel", this.wheelZoom)

        this.canvasContainerRef.current.removeEventListener("keydown", this.keyDownEvent)


        // NOTE: this will clear the canvas
        this.clearCanvas()
    }

    initEvents() {

        this.canvasContainerRef.current.addEventListener("mousedown", this.mouseDownEvent)
        this.canvasContainerRef.current.addEventListener("mouseup", this.mouseUpEvent)
        this.canvasContainerRef.current.addEventListener("mousemove", this.mouseMoveEvent)
        this.canvasContainerRef.current.addEventListener("wheel", this.wheelZoom)


        this.canvasContainerRef.current.addEventListener("keydown", this.keyDownEvent, true)
        // window.addEventListener("keydown", this.keyDownEvent, true)


    }

    applyTransform() {
        const { currentTranslate, zoom } = this.state
        this.canvasRef.current.style.transform = `translate(${currentTranslate.x}px, ${currentTranslate.y}px) scale(${zoom})`
    }

    closeToolBar() {
        this.setState({
            toolbarAttrs: null,
            toolbarOpen: false
        })
    }

    /**
    * 
    * @returns  {import("./widgets/base").Widget[]}
    */
    getWidgets() {

        // return this.widgets
        return this.widgets
    }

    /**
     * returns list of active objects / selected objects on the canvas
     * @returns Widget[]
     */
    getActiveObjects() {
        return Object.values(this.widgetRefs.current).filter((widgetRef) => {
            return widgetRef.current?.isSelected()
        })
    }


    /**
     * returns the widget that contains the target
     * @param {HTMLElement} target 
     * @returns {Widget}
     */
    getWidgetFromTarget(target) {
        // TODO: improve search, currently O(n), but can be improved via this.widgets or something

        let innerWidget = null
        for (let [key, ref] of Object.entries(this.widgetRefs.current)) {

            if (ref.current === target) {
                innerWidget = ref.current
                break
            }

            // console.log("refs: ", ref)
            // TODO: remove the ref.current? if there are bugs it would become hard to debug
            if (ref.current?.getElement().contains(target)) {

                if (!innerWidget) {
                    innerWidget = ref.current
                } else if (innerWidget.getElement().contains(ref.current.getElement())) {
                    // If the current widget is deeper than the existing innermost widget, update innerWidget
                    innerWidget = ref.current
                }
            }
        }

        return innerWidget
    }

    keyDownEvent(event) {

        if (event.key === "Delete") {
            this.deleteSelectedWidgets()
        }

        if (event.key === "+") {
            this.setZoom(this.state.zoom + 0.1)
        }

        if (event.key === "-") {
            this.setZoom(this.state.zoom - 0.1)
        }

    }

    openToolbar = (widget) => {
        this.setState({
            // selectedWidget: selectedWidget,
            toolbarAttrs: widget.getToolbarAttrs(),
            toolbarOpen: true
        })

    }

    mouseDownEvent(event) {

        this.mousePos = { x: event.clientX, y: event.clientY }

        let selectedWidget = this.getWidgetFromTarget(event.target)
        // console.log("selected widget: ", selectedWidget)
        if (event.button === 0) {
            this.mousePressed = true

            if (selectedWidget) {
                // if the widget is selected don't pan, instead move the widget
                if (!selectedWidget._disableSelection) {
                    // console.log("selected widget2: ", selectedWidget.getId(), this.state.selectedWidget?.getId())

                    this.selectedWidget?.deSelect() // deselect the previous widget before adding the new one
                    this.selectedWidget?.setZIndex(0)
                    selectedWidget.setZIndex(1000)
                    selectedWidget.select()
                    // console.log("selected widget", selectedWidget.getToolbarAttrs(), selectedWidget, this.state.selectedWidget)
                    // this.setState({
                    //     // selectedWidget: selectedWidget,
                    //     toolbarAttrs: selectedWidget.getToolbarAttrs(),
                    //     toolbarOpen: true
                    // })
                    // this.openToolbar(selectedWidget)

                    this.setSelectedWidget(selectedWidget)


                    // if (!this.state.selectedWidget || (selectedWidget.getId() !== this.state.selectedWidget?.getId())) {
                    //     this.state.selectedWidget?.deSelect() // deselect the previous widget before adding the new one
                    //     this.state.selectedWidget?.setZIndex(0)
                    //     console.log("working: ", this.state.selectedWidget)
                    //     selectedWidget.setZIndex(1000)
                    //     selectedWidget.select()
                    //     console.log("widget selected")
                    //     this.setState({
                    //         selectedWidget: selectedWidget,
                    //         toolbarAttrs: selectedWidget.getToolbarAttrs()
                    //     })
                    // }
                    this.currentMode = CanvasModes.MOVE_WIDGET
                }

                this.currentMode = CanvasModes.PAN

            } else if (!selectedWidget) {
                // get the canvas ready to pan, if there are widgets on the canvas
                this.clearSelections()
                this.currentMode = CanvasModes.PAN
                this.setCursor(Cursor.GRAB)
                // console.log("clear selection")
            }

            this.setState({
                contextMenuItems: [],
                // toolbarOpen: true
            })
            // this.setState({
            //     showContextMenu: false
            // })
        } else if (event.button === 2) {
            //right click

            if (this.selectedWidget && this.selectedWidget.__id !== selectedWidget.__id) {
                this.clearSelections()
            }

            if (selectedWidget) {
                this.setSelectedWidget(selectedWidget)
                this.setState({
                    // selectedWidget: selectedWidget,
                    contextMenuItems: [
                        {
                            key: "rename",
                            label: (<div onClick={() => selectedWidget.openRenaming()}><EditOutlined /> Rename</div>),
                            icons: <EditOutlined />,
                        },
                        {
                            key: "delete",
                            label: (<div onClick={() => this.deleteSelectedWidgets([selectedWidget])}><DeleteOutlined /> Delete</div>),
                            icons: <DeleteOutlined />,
                            danger: true
                        },
                        {
                            type: 'divider',
                        },
                        {
                            key: "snap",
                            label: (<div onClick={() => {
                                domtoimage.toPng(selectedWidget.getElement(), {
                                    width: selectedWidget.getElement().offsetWidth * 2,   // Multiply element's width by 2
                                    height: selectedWidget.getElement().offsetHeight * 2  // Multiply element's height by 2
                                }).then((dataUrl) => {
                                    saveAs(dataUrl, 'widget.png')
                                }).catch((error) => {
                                    console.error('Error capturing widget as PNg:', error)
                                })
                            }}>
                                <FileImageOutlined /> Save as Image</div>),
                            icons: <FileImageOutlined />,
                        }
                    ]
                })

            }

        }

    }

    mouseMoveEvent(event) {

        if (this.state.widgetResizing !== "") {
            // if resizing is taking place don't do anything else
            this.handleResize(event)
            return
        }

        // console.log("mode: ", this.currentMode, this.getActiveObjects())
        if (this.mousePressed && [CanvasModes.PAN, CanvasModes.MOVE_WIDGET].includes(this.currentMode)) {
            const deltaX = event.clientX - this.mousePos.x
            const deltaY = event.clientY - this.mousePos.y

            if (!this.selectedWidget) {
                // if there aren't any selected widgets, then pan the canvas
                this.setState(prevState => ({
                    currentTranslate: {
                        x: prevState.currentTranslate.x + deltaX,
                        y: prevState.currentTranslate.y + deltaY,
                    }
                }), this.applyTransform)

            } else {
                // update the widgets position
                // this.state.selectedWidgets.forEach(widget => {
                //     const {x, y} = widget.getPos()

                //     const newPosX = x + (deltaX/this.state.zoom) // account for the zoom, since the widget is relative to canvas
                //     const newPosY = y + (deltaY/this.state.zoom) // account for the zoom, since the widget is relative to canvas
                //     widget.setPos(newPosX, newPosY)
                // })
            }


            this.mousePos = { x: event.clientX, y: event.clientY }

            this.setCursor(Cursor.GRAB)
        }
    }

    mouseUpEvent(event) {
        this.mousePressed = false
        this.currentMode = CanvasModes.DEFAULT
        this.setCursor(Cursor.DEFAULT)

        if (this.state.widgetResizing) {
            this.setState({ widgetResizing: "" })
        }

        for (let [key, widget] of Object.entries(this.widgetRefs.current)) {
            // since the mouseUp event is not triggered inside the widget once its outside, 
            // we'll need a global mouse up event to re-enable drag
            widget.current?.enableDrag()
        }
    }

    wheelZoom(event) {
        let delta = event.deltaY
        let zoom = this.state.zoom * 0.999 ** delta

        this.setZoom(zoom, { x: event.offsetX, y: event.offsetY })
    }

    /**
     * handles widgets resizing
     * @param {MouseEvent} event - mouse move event 
     * @returns 
     */
    handleResize = (event) => {
        if (this.state.resizing === "") return

        const widget = this.selectedWidget

        if (!widget) return

        if (widget.state.fitContent?.width && widget.state.fitContent?.height) {
            this.setState({ widgetResizing: "" }) // Disable resizing if this is true, since the user will have to uncheck fit width and height
            message.warning("both width and height are set to fit-content, unset it to start resizing")
            return
        }

        const resizeCorner = this.state.widgetResizing
        const size = widget.getSize()
        const pos = widget.getPos()

        const deltaX = event.movementX
        const deltaY = event.movementY

        let newSize = { ...size }
        let newPos = { ...pos }

        const { width: minWidth, height: minHeight } = widget.minSize
        const { width: maxWidth, height: maxHeight } = widget.maxSize
        // console.log("resizing: ", deltaX, deltaY, event)

        switch (resizeCorner) {
            case "nw":
                newSize.width = Math.max(minWidth, Math.min(maxWidth, newSize.width - deltaX))
                newSize.height = Math.max(minHeight, Math.min(maxHeight, newSize.height - deltaY))
                newPos.x += (newSize.width !== size.width) ? deltaX : 0
                newPos.y += (newSize.height !== size.height) ? deltaY : 0
                break
            case "ne":
                newSize.width = Math.max(minWidth, Math.min(maxWidth, newSize.width + deltaX))
                newSize.height = Math.max(minHeight, Math.min(maxHeight, newSize.height - deltaY))
                newPos.y += (newSize.height !== size.height) ? deltaY : 0
                break
            case "sw":
                newSize.width = Math.max(minWidth, Math.min(maxWidth, newSize.width - deltaX))
                newSize.height = Math.max(minHeight, Math.min(maxHeight, newSize.height + deltaY))
                newPos.x += (newSize.width !== size.width) ? deltaX : 0
                break
            case "se":
                newSize.width = Math.max(minWidth, Math.min(maxWidth, newSize.width + deltaX))
                newSize.height = Math.max(minHeight, Math.min(maxHeight, newSize.height + deltaY))
                break
            default:
                break
        }

        widget.setResize(newPos, newSize)
    }

    getCanvasContainerBoundingRect() {
        return this.canvasContainerRef.current.getBoundingClientRect()
    }

    getCanvasBoundingRect() {
        return this.canvasRef.current.getBoundingClientRect()
    }

    getCanvasTranslation() {
        return this.state.currentTranslate
    }

    /**
     * fits the canvas size to fit the widgets bounding box
     */
    fitCanvasToBoundingBox(padding = 0) {
        const { top, left, right, bottom } = this.getCanvasObjectsBoundingBox()

        const width = right - left
        const height = bottom - top

        const newWidth = Math.max(width + padding, this.minCanvasSize.width)
        const newHeight = Math.max(height + padding, this.minCanvasSize.height)

        const canvasStyle = this.canvasRef.current.style

        // Adjust the canvas dimensions
        canvasStyle.width = `${newWidth}px`
        canvasStyle.height = `${newHeight}px`

        // Adjust the canvas position if needed
        canvasStyle.left = `${left - padding}px`
        canvasStyle.top = `${top - padding}px`
    }

    setCursor(cursor) {
        this.canvasContainerRef.current.style.cursor = cursor
    }

    setZoom(zoom, pos) {

        const { currentTranslate } = this.state

        let newTranslate = currentTranslate

        if (pos) {
            // Calculate the new translation to zoom into the mouse position
            const offsetX = pos.x - (this.canvasContainerRef.current.clientWidth / 2 + currentTranslate.x)
            const offsetY = pos.y - (this.canvasContainerRef.current.clientHeight / 2 + currentTranslate.y)

            const newTranslateX = currentTranslate.x - offsetX * (zoom - this.state.zoom)
            const newTranslateY = currentTranslate.y - offsetY * (zoom - this.state.zoom)
            newTranslate = {
                x: newTranslateX,
                y: newTranslateY
            }
        }

        this.setState({
            zoom: Math.max(0.5, Math.min(zoom, 1.5)), // clamp between 0.5 and 1.5
            currentTranslate: newTranslate
        }, this.applyTransform)


    }

    getZoom() {
        return this.state.zoom
    }

    resetTransforms() {
        this.setState({
            zoom: 1,
            currentTranslate: { x: 0, y: 0 }
        }, this.applyTransform)
    }

    setPan = (x, y) => {
        this.setState({
            currentTranslate: {x, y}
        })
    }

    panToWidget = (widgetId) => {

        const widget = this.getWidgetById(widgetId).current

        const canvasBoundingRect = this.getCanvasBoundingRect(); // Get the canvas dimensions

        // Get widget position
        const widgetRect = widget.getBoundingRect(); // Get widget's bounding box
    
        // Calculate widget center position in canvas space
        const widgetCenter = {
            x: (widgetRect.left - canvasBoundingRect.left + widgetRect.width / 2) / this.state.zoom,
            y: (widgetRect.top - canvasBoundingRect.top + widgetRect.height / 2) / this.state.zoom
        }

        // Calculate new translation to center the widget in the viewport
        const newTranslate = {
            x: (canvasBoundingRect.width / 2) / this.state.zoom - widgetCenter.x,
            y: (canvasBoundingRect.height / 2) / this.state.zoom - widgetCenter.y
        }  

        this.setState({
            currentTranslate: newTranslate
        })

    }

    // setSelectedWidget(selectedWidget) {
    //     this.setState({ selectedWidget: [selectedWidget] })
    // }

    clearSelections() {

        if (!this.selectedWidget)
            return

        this.getActiveObjects().forEach(widget => {
            widget.current?.deSelect()
        })

        // this.context?.updateActiveWidget("")
        // this.context.updateToolAttrs({})

        this.setState({
            // selectedWidget: null,
            toolbarAttrs: null,
            toolbarOpen: false
        })

        this.setSelectedWidget(null)

    }

    /**
     * returns tha combined bounding rect of all the widgets on the canvas
     * 
     */
    getCanvasObjectsBoundingBox() {

        // Initialize coordinates to opposite extremes
        let top = Number.POSITIVE_INFINITY
        let left = Number.POSITIVE_INFINITY
        let right = Number.NEGATIVE_INFINITY
        let bottom = Number.NEGATIVE_INFINITY

        for (let widget of Object.values(this.widgetRefs.current)) {
            const rect = widget.current.getBoundingRect()
            // Update the top, left, right, and bottom coordinates
            if (rect.top < top) top = rect.top
            if (rect.left < left) left = rect.left
            if (rect.right > right) right = rect.right
            if (rect.bottom > bottom) bottom = rect.bottom
        }

        return { top, left, right, bottom }
    }


    /**
     * finds widgets from the list of this.widgets, also checks the children to find the widgets
     * @param {string} widgetId 
     * @returns 
     */
    findWidgetFromListById = (widgetId) => {

        const searchWidgetById = (widgets, widgetId) => {
            for (let widget of widgets) {
                if (widget.id === widgetId) {
                    return widget
                }

                // Recursively search in children
                if (widget.children.length > 0) {
                    const foundInChildren = searchWidgetById(widget.children, widgetId)
                    if (foundInChildren) {
                        return foundInChildren // Found in children
                    }
                }
            }
            return null // Widget not found
        }

        return searchWidgetById(this.widgets, widgetId)
    }

    /**
     * Finds the widget from the list and removes it from its current position, even if the widget is in the child position
     * @param {Array} widgets - The current list of widgets
     * @param {string} widgetId - The ID of the widget to remove
     * @returns {Array} - The updated widgets list
     */
    removeWidgetFromCurrentList = (widgetId) => {

        function recursiveRemove(objects) {
            return objects
                .map(obj => {
                    if (obj.id === widgetId) {
                        return null // Remove the object
                    }
                    // Recursively process children
                    if (obj.children && obj.children.length > 0) {
                        obj.children = recursiveRemove(obj.children).filter(Boolean)
                    }
                    return obj
                })
                .filter(Boolean) // Remove any nulls from the array
        }

        // Start the recursive removal from the top level
        return recursiveRemove(this.widgets)

    }

    // Helper function for recursive update
    updateWidgetRecursively = (widgets, updatedParentWidget, updatedChildWidget) => {
        return widgets.map(widget => {
            if (widget.id === updatedParentWidget.id) {
                return updatedParentWidget // Update the parent widget
            } else if (widget.id === updatedChildWidget.id) {
                return updatedChildWidget // Update the child widget
            } else if (widget.children && widget.children.length > 0) {
                // Recursively update the children if they exist
                return {
                    ...widget,
                    children: this.updateWidgetRecursively(widget.children, updatedParentWidget, updatedChildWidget)
                }
            } else {
                return widget // Leave other widgets unchanged
            }
        })
    }

    /**
   * Handles drop event to canvas from the sidebar and on canvas widget movement (not the drop on child widget)
   * @param {DragEvent} e 
   */
    handleDropEvent = (e, draggedElement, widgetClass = null, posMetaData) => {

        e.preventDefault()
        // console.log("Drop event")

        this.setState({ isWidgetDragging: false })

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")) {
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        const container = draggedElement.getAttribute("data-container")
        const canvasRect = this.canvasRef.current.getBoundingClientRect()

        // const draggedElementRect = draggedElement.getBoundingClientRect()
        // const elementWidth = draggedElementRect.width
        // const elementHeight = draggedElementRect.height

        const { clientX, clientY } = e

        let finalPosition = {
            x: (clientX - canvasRect.left) / this.state.zoom,
            y: (clientY - canvasRect.top) / this.state.zoom,
        }
        // console.log("Final position1: ", finalPosition, container)


        if (container === WidgetContainer.SIDEBAR) {

            if (!widgetClass) {
                throw new Error("WidgetClass has to be passed for widgets dropped from sidebar")
            }

            // if the widget is being dropped from the sidebar, use the info to create the widget first
            this.createWidget(widgetClass, {x: finalPosition.x, y: finalPosition.y},({ id, widgetRef }) => {
                // widgetRef.current.setPos(finalPosition.x, finalPosition.y)
            })

        } else if ([WidgetContainer.CANVAS, WidgetContainer.WIDGET].includes(container)) {

            // snaps to center
            // finalPosition = {
            //     x: (clientX - canvasRect.left) / this.state.zoom - (elementWidth / 2) / this.state.zoom,
            //     y: (clientY - canvasRect.top) / this.state.zoom - (elementHeight / 2) / this.state.zoom,
            // }


            const { dragStartCursorPos, initialPos } = posMetaData
            const canvasBoundingRect = this.getCanvasBoundingRect()

            // calculate the initial offset from the div to the cursor grab

            const initialOffset = {
                x: ((dragStartCursorPos.x - canvasBoundingRect.left) / this.state.zoom) - (initialPos.x / this.state.zoom),
                y: ((dragStartCursorPos.y - canvasBoundingRect.top) / this.state.zoom) - (initialPos.y / this.state.zoom)
            }

            finalPosition = {
                x: finalPosition.x - initialOffset.x,
                y: finalPosition.y - initialOffset.y
            }

            let widgetId = draggedElement.getAttribute("data-widget-id")

            const widgetObj = this.getWidgetById(widgetId)
            // console.log("WidgetObj: ", widgetObj)
            if (container === WidgetContainer.CANVAS) {

                widgetObj.current.setPos(finalPosition.x, finalPosition.y)

            } else if (container === WidgetContainer.WIDGET) {

                // if the widget was inside another widget move it outside 
                let childWidgetObj = this.findWidgetFromListById(widgetObj.current.getId())
                let parentWidgetObj = this.findWidgetFromListById(childWidgetObj.parent)

                const childData = widgetObj.current.serialize() // save the data and pass it the updated child object

                // remove child from current position

                const updatedChildWidget = {
                    ...childWidgetObj,
                    parent: "",
                    initialData: {
                        ...childData,
                        parentWidgetRef: null,
                        pos: { x: finalPosition.x, y: finalPosition.y },
                        positionType: PosType.ABSOLUTE, // makes sure that after dropping the position is set to absolute value
                        parentLayout: null,// reset the parent layout when its put on the canvas
                        zIndex: 0,
                        widgetContainer: WidgetContainer.CANVAS
                    }
                }

                let updatedWidgets = this.removeWidgetFromCurrentList(widgetObj.current.getId())


                // Create a new copy of the parent widget with the child added
                const updatedParentWidget = {
                    ...parentWidgetObj,
                    // children: parentWidgetObj.children.filter(child => child.id !== childWidgetObj.id)
                }


                updatedWidgets = updatedWidgets.map(widget => {
                    if (widget.id === parentWidgetObj.id) {
                        return updatedParentWidget // Update the parent widget with the child removed
                    } else {
                        return widget // Leave other widgets unchanged
                    }
                })

                this.setWidgets([...updatedWidgets, updatedChildWidget])
                // this.setState({
                //     widgets: [...updatedWidgets, updatedChildWidget]
                // })

            }
        }

    }

    /**
     * Checks if the child fell in the swappable area 
     *     
     */
    __checkClosestShiftElement = ({ event, parentWidgetId, dragElementID }) => {
        
        // NOTE: work on this more maybe even check all four corners
        const parentWidget = this.findWidgetFromListById(parentWidgetId)
        if (!parentWidget) return

        const dropX = event.clientX
        const dropY = event.clientY

        let closestChild = null
        let closestIndex = parentWidget.children.length
        let minDistance = Infinity

        // Only check the first level of children
        parentWidget.children.forEach((child, index) => {
            if (child.id !== dragElementID) {
                const childElement = this.widgetRefs.current[child.id]

                if (!childElement) return

                const rect = childElement.current.getBoundingRect()
                const childTopRightX = rect.right
                const childTopRightY = rect.top

                // Compute Euclidean distance from drop position
                const distance = Math.hypot(childTopRightX - dropX, childTopRightY - dropY)
                if (distance < minDistance) {
                    minDistance = distance
                    closestChild = child
                    closestIndex = index + 1
                }
            }
        });

       
        if (closestChild && closestIndex === 1) {
            // by default the new index of the closest first element will be one and it will be zero if rect.left > dropX
            const childElement = this.widgetRefs.current[closestChild.id]
            const rect = childElement.current.getBoundingRect()

            // Closest is first child, check if dropped before or after
            closestIndex = dropX < rect.left ? 0 : 1
        } 

        return {closestChild, closestIndex}
    }

    shiftWidgetPosition = (parentWidgetId, dragElementID, targetIndex) => {

        const parentWidget = this.findWidgetFromListById(parentWidgetId);

        let childrenCopy = [...parentWidget.children];
        const dragIndex = childrenCopy.findIndex(child => child.id === dragElementID)
        

        if (dragIndex !== -1 && dragIndex !== targetIndex) {
            const [draggedItem] = childrenCopy.splice(dragIndex, 1) // Remove dragged item
            childrenCopy.splice(targetIndex, 0, draggedItem) // Insert at the target index
    
            const updatedParent = { ...parentWidget, children: childrenCopy }
            // this.setState(prevState => ({
            //     widgets: this.updateWidgetRecursively(prevState.widgets, updatedParent, {})
            // }))

            this.setWidgets(this.updateWidgetRecursively(this.widgets, updatedParent, {}))
        }
    }


    /**
     * Adds the child into the children attribute inside the this.widgets list of objects
     *  //  widgets data structure { id, widgetType: widgetComponentType, children: [], parent: "" }
     * @param {string} parentWidgetId 
     * @param {object} dragElementId, 
     * @param {object} posMetaData, - meta data about the initial cursor and widget position 
     * @param {boolean} adjustInitialOffset - if set to false, it won't adjust based on initial position, so you'll have the widget drop at top right corner (useful when dropping from sidebar)
     */
    handleAddWidgetChild = ({ event, parentWidgetId, dragElementID, posMetaData, adjustInitialOffset=true }) => {

        // console.log("event: ", event)
        // widgets data structure { id, widgetType: widgetComponentType, children: [], parent: "" }
        const dropWidgetObj = this.findWidgetFromListById(parentWidgetId)
        // Find the dragged widget object
        let dragWidgetObj = this.findWidgetFromListById(dragElementID)

        // console.log("Drag widget obj: ", dragWidgetObj, dropWidgetObj)

        if (dropWidgetObj && dragWidgetObj) {
            const dragWidget = this.widgetRefs.current[dragWidgetObj.id]
            const dragData = dragWidget.current.serialize()


            const parentWidget = this.widgetRefs.current[parentWidgetId].current
            const parentRect = parentWidget.getBoundingRect()
            const { clientX, clientY } = event

            // const childRect = dragWidget.current.getBoundingRect()
            // con

            const { dragStartCursorPos, initialPos } = posMetaData
            const canvasBoundingRect = this.getCanvasBoundingRect()


            let finalPosition = {
                x: (clientX - parentRect.left) / this.state.zoom,
                y: (clientY - parentRect.top) / this.state.zoom,
            }



            if (adjustInitialOffset){
                const initialOffset = {
                    x: ((dragStartCursorPos.x - canvasBoundingRect.left) / this.state.zoom) - (initialPos.x / this.state.zoom),
                    y: ((dragStartCursorPos.y - canvasBoundingRect.top) / this.state.zoom) - (initialPos.y / this.state.zoom)
                }

                
                finalPosition = {
                    x: finalPosition.x - initialOffset.x,
                    y: finalPosition.y - initialOffset.y 
                }
            }

            let updatedWidgets = this.removeWidgetFromCurrentList(dragElementID)
                
            const parentLayout = parentWidget.getLayout()?.layout || null
            dragWidget.current.setPos(finalPosition.x, finalPosition.y)
               
            const updatedDragWidget = {
                ...dragWidgetObj,
                parent: dropWidgetObj.id, // Keep the parent reference

                initialData: {
                    ...dragData,
                    positionType: parentLayout === Layouts.PLACE ? PosType.ABSOLUTE : PosType.NONE,
                    parentLayout: parentWidget.getLayout() || null, // pass everything about the parent layout
                    parentWidgetRef: this.widgetRefs.current[parentWidgetId],
                    zIndex: 0,
                    pos: { x: finalPosition.x, y: finalPosition.y },
                    widgetContainer: WidgetContainer.WIDGET
                }
            }

            const updatedDropWidget = {
                ...dropWidgetObj,
                children: [...dropWidgetObj.children, updatedDragWidget]
            }


            // Recursively update the widget structure
            updatedWidgets = this.updateWidgetRecursively(updatedWidgets, updatedDropWidget, updatedDragWidget)

            this.setWidgets(updatedWidgets)
            
            setTimeout(() => {
                if (parentLayout !== Layouts.PLACE) {
                    // swap only for grid and flex placements
                    const swapClosest = this.__checkClosestShiftElement({
                        event,
                        parentWidgetId,
                        dragElementID,
                    })
            
                    if (swapClosest.closestChild) {
                        this.shiftWidgetPosition(parentWidgetId, dragElementID, swapClosest.closestIndex)
                    }
                }
            }, 1)

            // Update the state with the new widget hierarchy
            // this.setState({
            //     widgets: updatedWidgets
            // }, () => {

            //     if (parentLayout !== Layouts.PLACE){
            //         // swap only for grid and flex placements
            //         const swapClosest = this.__checkClosestShiftElement({ event, parentWidgetId, dragElementID })
        
            //         if (swapClosest.closestChild){
            //             this.shiftWidgetPosition(parentWidgetId, dragElementID, swapClosest.closestIndex)
            //         }
            //     }
            // })
        
        }

    }

    /**
     * 
     * @param {Widget} widgetComponentType - don't pass <Widget /> instead pass Widget object/class
     */
    createWidget(widgetComponentType, initialPos={x: 0, y: 0}, callback,) {

        if (!isSubClassOfWidget(widgetComponentType)) {
            throw new Error("widgetComponentType must be a subclass of Widget class")
        }

        // console.log("componete: ", widgetComponentType)

        const widgetRef = React.createRef()

        const id = `${widgetComponentType.widgetType}_${UID()}`

        // Store the ref in the instance variable
        this.widgetRefs.current[id] = widgetRef

        // this.setWidgetRefs({...this.widgetRefs.current, [id]: widgetRef})

        const newWidget = {
            id,
            widgetType: widgetComponentType,
            children: [],
            parent: "",
            initialData: {pos: initialPos} //  useful for serializing and deserializing (aka, saving and loading)
        }

        const widgets = [...this.widgets, newWidget] // don't add the widget refs in the state
        
        this.setWidgets(widgets)

        setTimeout(() => {
            if (callback)
                callback({ id, widgetRef })

            // if (this._onWidgetListUpdated)
            //     this._onWidgetListUpdated(widgets) // inform the parent container
        }, 1)

        // Update the state to include the new widget's type and ID
        // this.setState({
        //     widgets: widgets
        // }, () => {
        //     if (callback)
        //         callback({ id, widgetRef })

        //     if (this._onWidgetListUpdated)
        //         this._onWidgetListUpdated(widgets) // inform the parent container
        // })

        return { id, widgetRef }
    }

    getWidgetById(id) {
        return this.widgetRefs.current[id]
    }

    /**
     * delete's the selected widgets from the canvas
     * @param {null|Widget} widgets - optional widgets that can be deleted along the selected widgets
     */
    deleteSelectedWidgets(widgets = []) {

        let activeWidgets = removeDuplicateObjects([...widgets, this.selectedWidget], "__id")

        this.setSelectedWidget(null)

        this.setState({
            toolbarAttrs: null,
            toolbarOpen: false,
            // selectedWidget: null
        })

        const widgetIds = activeWidgets.map(widget => widget.__id)

        for (let widgetId of widgetIds) {
            this.removeWidget(widgetId)
        }

    }

    /**
     * removes all the widgets from the canvas
     */
    clearCanvas() {

        // NOTE: Don't remove from it using remove() function since, it already removed from the DOM tree when its removed from widgets

        this.widgetRefs.current = {}
        this.setWidgets([])

        // this.setState({
        //     widgets: []
        // })

        // if (this._onWidgetListUpdated)
        //     this._onWidgetListUpdated([])
    }

    getWidgetByIdFromWidgetList = (widgetId) => {

        function recursiveFind(objects) {
            for (const obj of objects) {
                // Check if the current object has the matching ID
                if (obj.id === widgetId) {
                    return obj // Return the object if found
                }
                // Recursively check children if they exist
                if (obj.children && obj.children.length > 0) {
                    const found = recursiveFind(obj.children)
                    if (found) {
                        return found // Return the found object from children
                    }
                }
            }
            return null // Return null if not found
        }

        return recursiveFind(this.widgets)
    }

    removeWidget(widgetId) {


        delete this.widgetRefs.current[widgetId]

        const widgets = this.removeWidgetFromCurrentList(widgetId)
        // this.setState({
        //     widgets: widgets
        // })
        this.setWidgets(widgets)

        // if (this._onWidgetListUpdated)
        //     this._onWidgetListUpdated(widgets)
    }

    onActiveWidgetUpdate(widgetId) {
        // TODO: remove this as it may no longer be required also remove toolbarAttrs
        if (!this.selectedWidget || widgetId !== this.selectedWidget.__id)
            return

        // console.log("updating...", this.state.toolbarAttrs, this.state.selectedWidget.getToolbarAttrs())

        // console.log("attrs: ", this.state.selectedWidgets.at(0).getToolbarAttrs())

        this.setState({
            toolbarAttrs: this.selectedWidget.getToolbarAttrs()
        })

    }


    /**
     * informs the child about the parent layout
     */
    updateChildLayouts = ({ parentId, parentLayout }) => {

        const parent = this.getWidgetByIdFromWidgetList(parentId)

        if (!parent) return

        for (let child of parent.children) {
            this.widgetRefs.current[child.id].current.setParentLayout(parentLayout)
        }

    }

    /**
     * Update the widget's initial data, else when there is a remount, you'll loose all the state 
     * 
     * TODO: Find a efficient way to call this function
     * 
     * NOTE: this would cause entire widgetList to remount
     * NOTE: this would cause the toolbar to loose active widget
     */
    updateWidgetData = (widgetId, latestData) => {
        
        const widgetObj = this.getWidgetById(widgetId)?.current
        // console.log("Data unmount: ", this.widgets, this.widgetRefs, widgetObj, widgetId, widgetObj?.serialize(), latestData)

        if (!widgetObj){
            return
        }
        

        this.setWidgets(prevWidgets => {
            const updateWidget = (widgets) => {
                return widgets.map(widget => {
                    if (widget.id === widgetId) {
                        return { 
                            ...widget, 
                            initialData: { 
                                ...widget.initialData, 
                                ...widgetObj.serialize() 
                            } 
                        };
                    }
        
                    if (widget.children && widget.children.length > 0) {
                        return { 
                            ...widget, 
                            children: updateWidget(widget.children) // Always return new children
                        };
                    }
        
                    return widget; // Return unchanged widget
                });
            };
        
            return updateWidget(prevWidgets);
        })

    }


    renderWidget = (widget) => {

        const { id, widgetType: ComponentType, children = [], parent, initialData = {} } = widget

        const renderChildren = (childrenData) => {
            // recursively render the child elements
            return childrenData.map((child) => {
                const childWidget = this.findWidgetFromListById(child.id)
                if (childWidget) {
                    return this.renderWidget(childWidget) // Recursively render child widgets
                }
                return null
            })
        }

        const handleWidgetSelect = (widgetId) => {
            
            if (this.selectedWidget && this.selectedWidget.getId() !== widgetId){
                this.selectedWidget?.deSelect() // deselect the previous widget before adding the new one
            }

            const widget = this.getWidgetById(widgetId)?.current
            this.setSelectedWidget(widget)
            this.openToolbar(widget)
        }

        return (

            <ComponentType
                key={id}
                id={id}
                ref={this.widgetRefs.current[id]}
                initialData={initialData}
                parentWidgetRef={initialData.parentWidgetRef || null}
                canvasRef={this.canvasContainerRef}
                canvasInnerContainerRef={this.canvasRef}
                canvasMetaData={{
                    zoom: this.state.zoom,
                    pan: this.state.currentTranslate
                }}


                onSelect={handleWidgetSelect}
                
                onWidgetDeleteRequest={this.removeWidget}

                onPanToWidget={this.panToWidget}
                
                requestWidgetDataUpdate={this.updateWidgetData}
                // onWidgetUpdate={this.onActiveWidgetUpdate}
                // onWidgetUpdate={this.updateWidgetDataOnUnmount}
                // onUnmount={this.updateWidgetDataOnUnmount}

                onAddChildWidget={this.handleAddWidgetChild}
                onCreateWidgetRequest={this.createWidget} // create widget when dropped from sidebar
                onWidgetResizing={(resizeSide) => this.setState({ widgetResizing: resizeSide })}
                // onWidgetDragStart={() => this.setState({isWidgetDragging: true})}
                // onWidgetDragEnd={() => this.setState({isWidgetDragging: false})}
                onLayoutUpdate={this.updateChildLayouts}

            >
                {/* Render children inside the parent with layout applied */}
                {renderChildren(children)}
            </ComponentType>
        )
    }

    render() {

        return (
            <WidgetContext.Consumer>
                {
                    ({ widgets, setWidgets, widgetRefs, activeWidget, setActiveWidget }) => {

                        this.widgets = widgets
                        this.setWidgets = setWidgets
                        // this.setWidgetRefs = setWidgetRefs
                        this.widgetRefs = widgetRefs
                        this.selectedWidget = activeWidget
                        this.setSelectedWidget = setActiveWidget

                        return (<div className="tw-relative tw-overflow-hidden tw-flex tw-w-full tw-h-full tw-max-h-[100vh]">

                                    <div className="tw-absolute tw-p-2 tw-bg-white tw-z-10 tw-min-w-[100px] tw-h-[50px] tw-gap-2 
                                                        tw-top-4 tw-place-items-center tw-left-4 tw-shadow-md tw-rounded-md tw-flex">

                                        <Tooltip title="Reset viewport">
                                            <Button icon={<ReloadOutlined />} onClick={this.resetTransforms} />
                                        </Tooltip>
                                        <ButtonModal
                                            message={"Are you sure you want to clear the canvas? This cannot be undone."}
                                            title={"Clear canvas"}
                                            onOk={this.clearCanvas}
                                            okText="Yes"
                                            okButtonType="danger"
                                        >
                                            <Tooltip title="Clear canvas">
                                                <Button danger icon={<DeleteOutlined />} />
                                            </Tooltip>
                                        </ButtonModal>
                                    </div>

                                    {/* <ActiveWidgetProvider> */}
                                    <DroppableWrapper id="canvas-droppable"
                                        droppableTags={{ exclude: ["image", "video"] }}
                                        className="tw-w-full tw-h-full"
                                        onDrop={this.handleDropEvent}>
                                        {/* <DragWidgetProvider> */}
                                        <Dropdown trigger={['contextMenu']} mouseLeaveDelay={0} menu={{ items: this.state.contextMenuItems, }}>
                                            <div className="tw-w-full tw-h-full tw-outline-none tw-flex tw-relative tw-bg-[#f2f2f2] tw-overflow-hidden"
                                                ref={this.canvasContainerRef}
                                                style={{
                                                    transition: " transform 0.3s ease-in-out",
                                                    backgroundImage: `url(${DotsBackground})`,
                                                    backgroundSize: 'cover', // Ensure proper sizing if needed
                                                    backgroundRepeat: 'no-repeat',
                                                }}
                                                tabIndex={0} // allow focus
                                            >
                                                <DotsBackground
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        backgroundSize: 'cover'
                                                    }}
                                                />
                                                {/* Canvas */}
                                                {/* TODO: add translation in class instead of applyTransform function */}
                                                <div data-canvas className={`tw-w-full tw-h-full tw-absolute ${!IS_PRODUCTION ? "tw-bg-red-300" : "tw-bg-transparent"} tw-bg-transparent
                                                                            tw-top-0 tw-select-none
                                                                            `}

                                                        style={{
                                                            transform: `translate(${this.state.currentTranslate.x}px, ${this.state.currentTranslate.y}px) scale(${this.state.zoom})`
                                                        }}
                                                    ref={this.canvasRef}>
                                                    <div className="tw-relative tw-w-full tw-h-full">
                                                        {
                                                            this.widgets.map(this.renderWidget)
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown>
                                        {/* </DragWidgetProvider> */}
                                    </DroppableWrapper>

                                    <CanvasToolBar isOpen={this.state.toolbarOpen}
                                        widgetType={this.selectedWidget?.getDisplayName() || ""}
                                        attrs={this.state.toolbarAttrs}
                                    />
                                    {/* </ActiveWidgetProvider> */}
                                </div>
                            )
                        }
                    }
            </WidgetContext.Consumer>
        )
    }
}

export default Canvas
