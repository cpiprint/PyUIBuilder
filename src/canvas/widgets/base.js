import { v4 as uuidv4 } from 'uuid';

import React, { useEffect, useLayoutEffect, useRef, useState } from "react"

import lo from 'lodash'

import { NotImplementedError } from "../../utils/errors"

import Tools from "../constants/tools"
import { Layouts, PosType } from "../constants/layouts"
import Cursor from "../constants/cursor"
import { toSnakeCase } from "../utils/utils"
import EditableDiv from "../../components/editableDiv"


import WidgetContainer from "../constants/containers"
import { DragContext } from "../../components/draggable/draggableContext"
import { getGridPosition, isNumeric, removeKeyFromObject } from "../../utils/common"
import { Layout, message } from "antd"


// TODO: make it possible to apply widgetInnerStyle on load

// FIXME: the drag drop indicator is not going invisible if the drop happens on the child

// FIXME: once the width and height is set to fit-content, it can no longer be resized (while resizing it shouldn't be fit-width and height instead it should show the actual width and height)

// FIXME: if the label, buttons are dropped directly on canvas, the background colors don't apply

const ATTRS_KEYS = ['value', 'label', 'tool', 'onChange', 'options', 'toolProps'] // these are attrs keywords, don't use these keywords as keys while defining the attrs property or serializing

// FIXME: the initial data in canvas should be updated so when it remounts the widget doesn't change state
/**
 * Base class to be extended
 */
class Widget extends React.Component {

    static widgetType = "widget"
    static displayName = "Widget"

    static requirements = [] // requirements for the widgets (libraries) eg: tkvideoplayer, tktimepicker
    static requiredImports = [] // import statements

    // static contextType = ActiveWidgetContext

    constructor(props) {
        super(props)

        const { id, widgetName, canvasRef, canvasMetaData } = props
        // console.log("Id: ", id)
        // this id has to be unique inside the canvas, it will be set automatically and should never be changed
        this.__id = id
        this.canvas = canvasRef?.current || null // canvasContainerRef, because some events work properly only if attached to the container

        this.canvasMetaData = canvasMetaData

        // this._selected = false
        this._disableResize = false
        this._disableSelection = false

        this.minSize = { width: 10, height: 10 } // disable resizing below this number
        this.maxSize = { width: 2000, height: 2000 } // disable resizing above this number

        this.cursor = Cursor.POINTER

        this.icon = "" // antd icon name representing this widget

        this.elementRef = React.createRef() // this is the outer ref for draggable area
        this.swappableAreaRef = React.createRef() // helps identify if the users intent is to swap or drop inside the widget
        this.innerAreaRef = React.createRef() // this is the inner area where swap is prevented and only drop is accepted

        this.styleAreaRef = React.createRef() //  use ref this where inner widget style is applied

        this.functions = {
            "load": { "args1": "number", "args2": "string" }
        }

        // This indicates if the draggable can be dropped on this widget, set this to null to disable drops
        this.droppableTags = {} 
        

        this.state = {
            zIndex: 0,
            selected: false,
            isWidgetVisible: true,

            // forceRerenderId: "",

            widgetName: widgetName || 'widget', // this will later be converted to variable name
            enableRename: false, // will open the widgets editable div for renaming

            parentLayout: null, // depending on the parents layout the child will behave

            isDragging: false, //  tells if the widget is currently being dragged
            dragEnabled: true,

            widgetContainer: WidgetContainer.CANVAS, // what is the parent of the widget

            showDroppableStyle: { // shows the droppable indicator
                allow: false,
                show: false,
            },

            pos: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            fitContent: {width: false, height: false},
            positionType: PosType.ABSOLUTE,

            widgetOuterStyling: {
                // responsible for stuff like position, grid placement etc
            },
            widgetInnerStyling: {
                // use for widget's inner styling
                backgroundColor: "#fff",
                // display: "flex",
                // flexDirection: "row",
                gap: 10,
                // flexWrap: "wrap" // NOTE: this has been uncommented
            },

            attrs: {
                styling: {
                    backgroundColor: {
                        label: "Background Color",
                        tool: Tools.COLOR_PICKER, // the tool to display, can be either HTML ELement or a constant string
                        value: "#E4E2E2",
                        onChange: (value) => {
                            this.setWidgetInnerStyle("backgroundColor", value)
                            this.setAttrValue("styling.backgroundColor", value)
                        }
                    },
                    
                    label: "Styling"
                },
                layout: {
                    label: "Layout",
                    tool: Tools.LAYOUT_MANAGER, // the tool to display, can be either HTML ELement or a constant string
                    value: {
                        layout: Layouts.PLACE,
                        direction: "row",
                        // grid: {
                        //     rows: 12,
                        //     cols: 12
                        // },
                        gap: 10,
                    },
                    toolProps: {
                        options: [
                            { value: "flex", label: "Flex" },
                            { value: "grid", label: "Grid" },
                            { value: "place", label: "Place" },
                        ],
                    },
                    onChange: (value) => {
                        // this.setAttrValue("layout", value)
                        this.setLayout(value)
                    }
                },
                // events: {
                //     event1: {
                //         tool: Tools.EVENT_HANDLER,
                //         value: ""
                //     }
                // }
            },
        }

        this.getElement = this.getElement.bind(this)

        this.getId = this.getId.bind(this)

        this.getPos = this.getPos.bind(this)
        this.getSize = this.getSize.bind(this)
        this.getWidgetName = this.getWidgetName.bind(this)
        this.getWidgetType = this.getWidgetType.bind(this)
        this.getBoundingRect = this.getBoundingRect.bind(this)

        this.getLayout = this.getLayout.bind(this)
        this.getParentLayout = this.getParentLayout.bind(this)

        this.getAttrValue = this.getAttrValue.bind(this)
        this.getToolbarAttrs = this.getToolbarAttrs.bind(this)

        this.generateCode = this.generateCode.bind(this)

        this.getImports = this.getImports.bind(this)
        this.getRequirements = this.getRequirements.bind(this)

        // this.openRenaming = this.openRenaming.bind(this)

        // this.isWidgetVisible = true // widget is visible in viewport
        this.isSelected = this.isSelected.bind(this)

        this.setPos = this.setPos.bind(this)
        this.setAttrValue = this.setAttrValue.bind(this)
        this.setWidgetName = this.setWidgetName.bind(this)
        
        this.setWidgetInnerStyle = this.setWidgetInnerStyle.bind(this)
        this.setWidgetOuterStyle = this.setWidgetOuterStyle.bind(this)

        this.setPosType = this.setPosType.bind(this)
        this.setParentLayout = this.setParentLayout.bind(this)

        this.load = this.load.bind(this)
        this.serialize = this.serialize.bind(this)
        this.serializeAttrsValues = this.serializeAttrsValues.bind(this)

        this.hideDroppableIndicator = this.hideDroppableIndicator.bind(this)

        this.getRenderSize = this.getRenderSize.bind(this)
        this.getInnerRenderStyling = this.getInnerRenderStyling.bind(this)

        this.updateState = this.updateState.bind(this)

        this.stateUpdateCallback = null // allowing other components such as toolbar to subscribe to changes in this widget
        this.resizeObserver = null


    }

    componentDidMount() {

        this.setLayout({layout: Layouts.PLACE, gap: 10})

        // if (this.state.attrs.layout){
        //     this.setLayout(this.state.attrs.layout.value)
        //     // console.log("prior layout: ", this.state.attrs.layout.value)
        // }
        
        if (this.state.attrs.styling.backgroundColor)
            this.setWidgetInnerStyle('backgroundColor', this.state.attrs.styling?.backgroundColor.value || "#fff")

        this.load(this.props.initialData || {}) // load the initial data

        // The elementRect is received only after the elemet is added so, it may not be accurate so use resize handler
        // this.resizeObserver = new MutationObserver(this.handleResizeEvents)
        // if (this.elementRef.current) {
        //     // this.resizeObserver.observe(this.elementRef.current,  { attributes: true})
        // }


        
    }

    componentDidUpdate(prevProps, prevState) {
        
        if (prevProps !== this.props) {
            this.canvasMetaData = this.props.canvasMetaData
        }

        const compareAttrs = ['attrs', 'widgetName', 'parentLayout', 'positionType']

        // TODO: maybe find more efficient way to update the canvas about teh child updates???
        if (!lo.isEqual(lo.pick(prevState, compareAttrs), lo.pick(this.state, compareAttrs))){
            // THIS IS inefficeint
            // this.props.requestThisWidgetDataUpdate(this.__id)
            // setTimeout(() => this.props.requestWidgetDataUpdate(this.__id), 1)
            this.props.requestWidgetDataUpdate(this.__id)
        }
        // call update widgets

    }

    componentWillUnmount(){
        // this.resizeObserver.disconnect()
    }

    // componentWillUnmount(){
    //     // TODO: serialize and store the widget data in setWidgets under widget context especially initialData
    //     console.log("unmounting widget: ", this.state.attrs, this.serialize())
        
    //     // this.props.onUnmount(this.__id, this.serialize())
    // }


    stateChangeSubscriberCallback = (callback) => {
        // NOTE: don't subscribe to multiple callbacks, only the last one will work 
        // allowing other components such as toolbar to subscribe to changes in this widget
        this.stateUpdateCallback = callback
    }

    /**
     * This function will notify the canvas of the updates to the widgets
     * 
     * @param {} newState  - this can either be a callback or a new State like (prevState) => ({key: value})
     * @param {*} callback - callback to run after setState
     */
    updateState(newState, callback){
        // console.trace("Callback trace");
        // debugger; 
        
        // FIXME: maximum recursion error when updating size, color etc
        this.setState(newState, () => {
            // console.log("updatinhg./..: ", this.state, newState)

            const { onWidgetUpdate } = this.props

                
            if (this.stateUpdateCallback)
                this.stateUpdateCallback()

            // FIXME: super inefficient
            // if (onWidgetUpdate) {
            //     onWidgetUpdate(this.__id)
            // }

            if (callback) callback()

        })
    }

    _getWidgetMethods = () => {
        return {
            rename: this.setWidgetName,
            resize: this.setWidgetSize,
            setWidgetAttrs: this.setAttrValue,
        }
    }

    getToolbarAttrs() {

        return ({
            id: this.__id,
            widgetName: {
                label: "Widget Name",
                tool: Tools.INPUT, // the tool to display, can be either HTML ELement or a constant string
                toolProps: { placeholder: "Widget name", maxLength: 40 },
                value: this.state.widgetName,
                onChange: (value) => this.setWidgetName(value)
            },
            size: {
                label: "Size",
                display: "horizontal",
                width: {
                    label: "Width",
                    tool: Tools.NUMBER_INPUT, // the tool to display, can be either HTML ELement or a constant string
                    toolProps: { placeholder: "width", max: this.maxSize.width, min: this.minSize.width },
                    value: this.state.size.width || 100,
                    onChange: (value) => this.setWidgetSize(value, null)
                },
                height: {
                    label: "Height",
                    tool: Tools.NUMBER_INPUT,
                    toolProps: { placeholder: "height", max: this.maxSize.height, min: this.minSize.height },
                    value: this.state.size.height || 100,
                    onChange: (value) => this.setWidgetSize(null, value)
                },
                fitWidth: {
                    label: "Fit width",
                    tool: Tools.CHECK_BUTTON,
                    value: this.state.fitContent.width,
                    onChange: (value) => {  
                        this.updateState((prev) => ({
                            fitContent: {...prev.fitContent, width: value}
                        }))
                    }
                },
                fitHeight: {
                    label: "Fit height",
                    tool: Tools.CHECK_BUTTON,
                    value: this.state.fitContent.height,
                    onChange: (value) => {  
                        this.updateState((prev) => ({
                            fitContent: {...prev.fitContent, height: value}
                        }))
                    }
                },
            },

            ...this.state.attrs,

        })
        
    }

    forceRerender = () => {
        // this.forceUpdate() // Don't use forceUpdate widgets will loose their states
        this.setState({forceRerenderId: `${uuidv4()}`})
    }

    // TODO: add context menu items such as delete, add etc
    contextMenu() {

    }

    deleteWidget = () => {
        this.props.onWidgetDeleteRequest(this.__id)
    }

    isWidgetVisible = () => {
        return this.state.isWidgetVisible
    }

    hideFromViewport = () => {
        this.setState({
            isWidgetVisible: false
        })
    }

    unHideFromViewport = () => {
        this.setState({
            isWidgetVisible: true
        })
    }

    getVariableName() {
        return toSnakeCase(this.state.widgetName)
    }

    getWidgetName() {
        return this.state.widgetName
    }

    getWidgetType() {
        return this.constructor.widgetType
    }

    getDisplayName(){
        return this.constructor.displayName
    }

    getRequirements(){
        return this.constructor.requirements
    }

    getImports(){
        return this.constructor.requiredImports
    }

    generateCode(){
        throw new NotImplementedError("generateCode() must be implemented by the subclass")
    }

    getAttributes() {
        return this.state.attrs
    }

    getId() {
        return this.__id
    }

    select() {
        this.setState({
            selected: true
        })

        this.props.onSelect(this.__id)

    }

    deSelect() {
        this.setState({
            selected: false
        })
    }

    isSelected() {
        return this.state.selected
    }

    setPosType(positionType) {

        if (!Object.values(PosType).includes(positionType)) {
            throw Error(`The Position type can only be among: ${Object.values(PosType).join(", ")}`)
        }

        this.setState({
            positionType: positionType
        })

    }

    setPos(x, y) {

        this.setState({
            pos: { x, y }
        })

        // this.updateState({
        //     pos: { x, y }
        // })
    }


    getPos() {
        return this.state.pos
    }

    getProps() {
        return this.attrs
    }

    getBoundingRect() {
        return this.elementRef.current?.getBoundingClientRect()
    }

    getSize() {
        return this.state.size
    }

    getWidgetFunctions() {
        return this.functions
    }

    getElement() {
        return this.elementRef.current
    }

    hideDroppableIndicator(){
        // console.log("hide drop indicator")
        this.setState({
            showDroppableStyle: {
                allow: false, 
                show: false
            }
        }, () => {
            // console.log("hidden the drop indicator")
        })
    }

    /**
     * 
     * @param {string} path - eg: styling.backgroundColor
     * @returns 
     */
    removeAttr = (path) =>{

        const newAttrs = removeKeyFromObject(path, this.state.attrs)

        this.setState({
            attrs: newAttrs
        })

        return newAttrs

    }

    /**
     * Given the key as a path, sets the value for the widget attribute
     * @param {string} path - path to the key, eg: styling.backgroundColor
     * @param {any} value 
     */
    setAttrValue(path, value, callback) {

        this.updateState((prevState) => { // since the  setState is Async only the prevState contains the latest state
            const keys = path.split('.')
            const lastKey = keys.pop()

            // Traverse the state and update the nested value immutably
            let newAttrs = { ...prevState.attrs }
            let nestedObject = newAttrs
            
            keys.forEach(key => {
                nestedObject[key] = { ...nestedObject[key] } // Ensure immutability
                nestedObject = nestedObject[key]
            })
            
            if (nestedObject[lastKey]) {
                nestedObject[lastKey] = { ...nestedObject[lastKey], value }
            } else {
                nestedObject[lastKey] = { value }
            }
            
            return { attrs: newAttrs }

        }, callback)
    }

    /**
     * Given the key as a path, retrieves the value for the widget attribute
     * @param {string} path - path to the key, eg: styling.backgroundColor
     * @returns {any} - the value at the given path
     */
    getAttrValue(path) {
        const keys = path.split('.')

        // Traverse the state and get the nested value
        let nestedObject = this.state.attrs
        for (const key of keys) {
            if (nestedObject[key] !== undefined) {
                nestedObject = nestedObject[key]
            } else {
                return undefined  // Return undefined if the key doesn't exist
            }
        }
        return nestedObject?.value  // Return the value (assuming it has a 'value' field)
    }

    /**
     * returns the path from the serialized attrs values, 
     * this is a helper function to remove any non-serializable data associated with attrs
     * eg: {"styling.backgroundColor": "#ffff", "layout": {layout: "flex", direction: "", grid: }}
     */
    serializeAttrsValues(){

        const serializeValues = (obj, currentPath = "") => {
            const result = {}

            for (let key in obj) {

                if (ATTRS_KEYS.includes(key)) continue // don't serialize these as separate keys

                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    // If the key contains a value property
                    if (obj[key].hasOwnProperty('value')) {
                        const path = currentPath ? `${currentPath}.${key}` : key;

                        // If the value is an object, retain the entire value object
                        if (typeof obj[key].value === 'object' && obj[key].value !== null) {
                            result[path] = obj[key].value
                        } else {
                            result[`${path}`] = obj[key].value
                        }
                    }
                    // Continue recursion for nested objects
                    Object.assign(result, serializeValues(obj[key], currentPath ? `${currentPath}.${key}` : key))
                }
            }

            return result
        }

        return serializeValues(this.state.attrs)
    }

    setZIndex(zIndex) {
        this.setState({
            zIndex: zIndex
        })
    }

    setWidgetName(name) {
        this.updateState({
            widgetName: name.length > 0 ? name : this.state.widgetName
        })
    }

    /**
     * inform the child about the parent layout changes
     * @param {Layouts} parentLayout 
     */
    setParentLayout(parentLayout){
        // FIXME: changing from one layout to another isn't working as expected
        // TODO: add styleAreaRef to every where there is innerWidgetSTyle
        if (!parentLayout){
            // if parent layout is null (i,e the widget is on the canvas)
            return {}
        } 

        const {layout, direction, gap} = parentLayout


        let updates = {
            parentLayout: parentLayout,
        }

        if (layout === Layouts.FLEX || layout === Layouts.GRID){
      
            updates = {
                ...updates,
                positionType: PosType.NONE,
            }

            const elementRect = this.elementRef.current.getBoundingClientRect() 
            // console.log("winner: ", this.props.parentWidgetRef.current.getBoundingRect())
            const parentRect = this.props.parentWidgetRef.current?.getBoundingRect()

            // FIXME: (low priority) once the place is moved and back to flex the position the updated position is not reflected
            let pos = {
                x: (elementRect.left - (parentRect?.left || 0)) / this.canvasMetaData.zoom,
                y: (elementRect.top - (parentRect?.top || 0)) / this.canvasMetaData.zoom
            }

            this.setPos(pos.x, pos.y)
            // console.log("setting pos: ", pos)

            if (layout === Layouts.GRID){
                setTimeout(() => {
                    const gridPos = getGridPosition(this.elementRef.current,  this.props.parentWidgetRef.current.styleAreaRef.current)
                    if (gridPos){
                        this.setAttrValue("gridManager.row", gridPos.row)
                        this.setAttrValue("gridManager.column", gridPos.column)
                        this.setWidgetOuterStyle("gridRow", `${gridPos.row + ' / span ' + 1}`)
                        this.setWidgetOuterStyle("gridColumn", `${gridPos.column + ' / span ' + 1}`)
                    }

                }, 1)
            }
            
        }else if (layout === Layouts.PLACE){
            updates = {
                ...updates,
                positionType: PosType.ABSOLUTE
            }
        }

        this.setState((prevState) => ({...prevState, ...updates}))

        return updates
    }

    getParentLayout(){
        return this.state.parentLayout
    }

    getLayout(){

        return this.getAttrValue("layout") || Layouts.PLACE
    }

    setLayout(value) {
        const { layout, direction, grid = { rows: 1, cols: 1 }, gap = 10, align } = value

        // console.log("layout value: ", value)
        // FIXME: In grid layout the layout doesn't adapt to the size of the child if resized
        let widgetStyle = {
            ...this.state.widgetInnerStyling,
            display: layout !== Layouts.PLACE ? layout : "block",
            flexDirection: direction,
            gap: `${gap}px`,
            // flexWrap: "wrap",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, auto))",
            gridTemplateRows: "repeat(auto-fill, minmax(100px, auto))",  
            // gridAutoRows: 'minmax(100px, auto)',  // Rows with minimum height of 100px, and grow to fit content
            // gridAutoCols: 'minmax(100px, auto)',  // Cols with minimum height of 100px, and grow to fit content
        }

        // if (align === "start"){
        //     widgetStyle["placeContent"] = "flex-start"
        // }else if (align === "center"){
        //     widgetStyle["placeContent"] = "center"
        // }else if (align === "end"){
        //     widgetStyle["placeContent"] = "flex-end"
        // }else{
        //     widgetStyle["placeContent"] = "unset"
        // }

        this.setAttrValue("layout", value, () => {
            this.updateState({
                widgetInnerStyling: widgetStyle
            })
            this.props.onLayoutUpdate({parentId: this.__id, parentLayout: value})// inform children about the layout update
        })

    }

    getWidgetInnerStyle = (key) => {
        return this.state.widgetInnerStyling[key]
    }

    getWidgetOuterStyle = (key) => {
        return this.state.widgetOuterStyling[key]
    }

    /**
     * sets outer styling like grid placement etc, don't use this for background color, foreground color etc
     * @param {string} key - The string in react Style format
     * @param {string} value - Value of the style
     */
    setWidgetOuterStyle(key, value){
        // const widgetStyle = {
        //     ...this.state.widgetOuterStyling,
        //     [key]: value
        // }

        this.setState((prevState) => ({
            widgetOuterStyling: {
                ...prevState.widgetOuterStyling,
                [key]: value
            }
        }))

    }

    /**
     * 
     * @param {string} key - The string in react Style format
     * @param {string} value - Value of the style
     */
    setWidgetInnerStyle(key, value) {

        this.setState((prevState) => ({
            widgetInnerStyling: {
                ...prevState.widgetInnerStyling,
                [key]: value
            }
        }))

    }

    /**
     * 
     * @param {number|null} width 
     * @param {number|null} height 
     */
    setWidgetSize(width, height) {

        const fitWidth = this.state.fitContent?.width
        const fitHeight = this.state.fitContent?.height

        if (fitWidth && fitHeight){
            message.warning("both width and height are set to fit-content, unset it to start resizing")
            return
        }

        const newSize = {
            width: Math.max(this.minSize.width, Math.min(width || this.state.size.width, this.maxSize.width)),
            height: Math.max(this.minSize.height, Math.min(height || this.state.size.height, this.maxSize.height)),
        }
        this.updateState({
            size: newSize
        })
    }

    setResize(pos, size) {
        // useful when resizing the widget relative to the canvas, sets all pos, and size
        this.updateState({
            size: size,
            pos: pos
        })
    }

    openRenaming = () => {
        this.select()
        this.setState({
            enableRename: true
        })
    }

    closeRenaming = () => {
        this.setState({
            enableRename: false
        })
    }

    enableDrag = () => {
        this.setState({
            dragEnabled: true
        })
    }

    disableDrag = () => {
        this.setState({
            dragEnabled: false
        })
    }


    /**
     * 
     * serialize data for saving
     */
    serialize(){
        // NOTE: when serializing make sure, you are only passing serializable objects not functions or other
        
        const elementRect = this.getBoundingRect()
        
        const pos = {
            x: elementRect.x,
            y: elementRect.y
        }
        
        return ({
            zIndex: this.state.zIndex,
            selected: this.state.selected,
            widgetName: this.state.widgetName,
            // pos: this.state.pos,
            pos: pos,
            size: this.state.size,
            widgetContainer: this.state.widgetContainer,
            widgetInnerStyling: this.state.widgetInnerStyling,
            widgetOuterStyling: this.state.widgetOuterStyling,
            parentLayout: this.state.parentLayout,
            positionType: this.state.positionType,
            attrs: this.serializeAttrsValues(), // makes sure that functions are not serialized
        })

    }

    /**
     * loads the data 
     * @param {object} data 
     * @param {() => void | undefined} callback - optional callback that will be called after load 
     */
    load(data, callback){

        if (Object.keys(data).length === 0) return // no data to load

        data = {...data} // create a shallow copy

        const {attrs={}, selected, pos={x: 0, y: 0}, ...restData} = data

        const parentLayout = this.props.parentWidgetRef?.current?.getLayout() // don't get the parentLayout from serialized data as it may have become stale

        
        let layoutUpdates = {
            parentLayout: parentLayout?.layout || null
        }

        if (parentLayout?.layout === Layouts.FLEX || parentLayout?.layout === Layouts.GRID){


            layoutUpdates = {
                ...layoutUpdates,
                positionType: PosType.NONE,
            }

        }else if (parentLayout?.layout === Layouts.PLACE){
            layoutUpdates = {
                ...layoutUpdates,
                positionType: PosType.ABSOLUTE
            }
        }

        const newData = {
            ...restData,
            ...layoutUpdates,
            pos
        }

        this.setState(newData,  () => {
            // Updates attrs
            let newAttrs = { ...this.state.attrs }

            // Iterate over each path in the updates object
            Object.entries(attrs).forEach(([path, value]) => {
                const keys = path.split('.')
                const lastKey = keys.pop()

                // Traverse the nested object within attrs
                let nestedObject = newAttrs

                keys.forEach(key => {
                    nestedObject[key] = { ...nestedObject[key] } // Ensure immutability for each nested level
                    nestedObject = nestedObject[key]
                })

                // Set the value at the last key
                if (nestedObject[lastKey]) // TODO: remove this check, else won't be able to catch buggy data
                    nestedObject[lastKey].value = value
            })

            if (newAttrs?.styling?.backgroundColor){
                // some widgets don't have background color
                this.setWidgetInnerStyle("backgroundColor", newAttrs.styling.backgroundColor)
            }

            this.updateState({ attrs: newAttrs }, callback)

            if (selected){
                this.select()
            } 
        })  

    }

    panToWidget = () => {
        this.props.onPanToWidget(this.__id)
    }

    handleDragStart = (e, callback) => {
        e.stopPropagation()

        callback(this.elementRef?.current || null)

        // this.props.onWidgetDragStart(this.elementRef?.current)

        // Create custom drag image with full opacity, this will ensure the image isn't taken from part of the canvas
        // const dragImage = this.elementRef?.current.cloneNode(true)
        // dragImage.style.opacity = '1' // Ensure full opacity
        // dragImage.style.position = 'absolute'
        // dragImage.style.top = '-9999px' // Move it out of view

        // document.body.appendChild(dragImage)
        // const elementRect = this.elementRef.current.getBoundingClientRect()

        // const canvasRect = this.props.canvasInnerContainerRef.current.getBoundingClientRect()
        // snap to mouse pos
        // const offsetX = e.clientX - elementRect.left
        // const offsetY = e.clientY - elementRect.top

        // console.log("element rect: ", elementRect, e.clientX, e.clientY, "offset: ", offsetX, offsetY)
        // snap to middle
        // const offsetX = rect.width / 2
        // const offsetY = rect.height / 2
        // e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);


        // Remove the custom drag image after some time to avoid leaving it in the DOM
        // setTimeout(() => {
        //     document.body.removeChild(dragImage)
        // }, 0)

        // NOTE: this line will prevent problem's such as self-drop or dropping inside its own children
        setTimeout(this.disablePointerEvents, 1)

        this.setState({ isDragging: true })

    }

    handleDragEnter = (e, draggedElement, setOverElement) => {

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")){
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        const dragEleType = draggedElement.getAttribute("data-draggable-type")

        // console.log("Drag entering...", dragEleType, draggedElement, this.droppableTags)
        // FIXME:  the outer widget shouldn't be swallowed by inner widget
        if (draggedElement === this.elementRef.current) {
            // prevent drop on itself, since the widget is invisible when dragging, if dropped on itself, it may consume itself
            return
        }

        setOverElement(this.elementRef.current) // provide context to the provider

        let showDrop = {
            allow: true,
            show: true
        }

        const allowDrop = (this.droppableTags && this.droppableTags !== null && (Object.keys(this.droppableTags).length === 0 ||
            (this.droppableTags.include?.length > 0 && this.droppableTags.include?.includes(dragEleType)) ||
            (this.droppableTags.exclude?.length > 0 && !this.droppableTags.exclude?.includes(dragEleType))
        ))

        if (allowDrop) {
            showDrop = {
                allow: true,
                show: true
            }

        } else {
            showDrop = {
                allow: false,
                show: true
            }
        }

        this.setState({
            showDroppableStyle: showDrop
        })

    }

    handleDragOver = (e, draggedElement) => {

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")){
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        if (draggedElement === this.elementRef.current) {
            // prevent drop on itself, since the widget is invisible when dragging, if dropped on itself, it may consume itself
            return
        }

        // console.log("Drag over: ", e.dataTransfer.getData("text/plain"), e.dataTransfer)
        const dragEleType = draggedElement.getAttribute("data-draggable-type")

        const allowDrop = (this.droppableTags && this.droppableTags !== null && (Object.keys(this.droppableTags).length === 0 ||
            (this.droppableTags.include?.length > 0 && this.droppableTags.include?.includes(dragEleType)) ||
            (this.droppableTags.exclude?.length > 0 && !this.droppableTags.exclude?.includes(dragEleType))
        ))

        if (allowDrop) {
            e.preventDefault() // NOTE: this is necessary to allow drop to take place
        }

    }

    handleDropEvent = (e, draggedElement, widgetClass = null, posMetaData) => {

        if (!draggedElement || !draggedElement.getAttribute("data-drag-start-within")){
            // if the drag is starting from outside (eg: file drop) or if drag doesn't exist
            return
        }

        e.preventDefault()
        e.stopPropagation()
    
        // FIXME: sometimes the elements showDroppableStyle is not gone, when dropping on the same widget
        this.setState({
            showDroppableStyle: {
                allow: false,
                show: false
            }
        })


        if (draggedElement === this.elementRef.current){
            // prevent drop on itself, since the widget is invisible when dragging, if dropped on itself, it may consume itself
            return 
        }

        let currentElement = e.currentTarget
        while (currentElement) {
            if (currentElement === draggedElement) {
                // if the parent is dropped accidentally into the child don't allow drop
                // console.log("Dropped into a descendant element, ignoring drop")
                return // Exit early to prevent the drop
            }
            currentElement = currentElement.parentElement // Traverse up to check ancestors
        }

        const container = draggedElement.getAttribute("data-container")

        const thisContainer = this.elementRef.current.getAttribute("data-container")
        // console.log("Dropped as swappable: ", e.target, this.swappableAreaRef.current.contains(e.target))
        // If swaparea is true, then it swaps instead of adding it as a child, also make sure that the parent widget(this widget) is on the widget and not on the canvas

        const dragEleType = draggedElement.getAttribute("data-draggable-type")

        const allowDrop = (this.droppableTags && this.droppableTags !== null && (Object.keys(this.droppableTags).length === 0 ||
            (this.droppableTags.include?.length > 0 && this.droppableTags.include?.includes(dragEleType)) ||
            (this.droppableTags.exclude?.length > 0 && !this.droppableTags.exclude?.includes(dragEleType))
        ))

        if (!allowDrop) {
            // only if drop is not allowed return, if swap is allowed continue
            return  
        }
        // TODO: check if the drop is allowed

        // console.log("Meta data: ", posMetaData)
        if ([WidgetContainer.CANVAS, WidgetContainer.WIDGET].includes(container)) {
            // console.log("Dropped on meee: ", swapArea, this.swappableAreaRef.current.contains(e.target), thisContainer)

            this.props.onAddChildWidget({
                event: e,
                parentWidgetId: this.__id,
                dragElementID: draggedElement.getAttribute("data-widget-id"),
                posMetaData
            })

        } else if (container === WidgetContainer.SIDEBAR) {


            const canvasRect = this.props.canvasInnerContainerRef.current.getBoundingClientRect()

            const {zoom, pan} = this.props.canvasMetaData

            let initialPos = {
                x: (e.clientX - canvasRect.left) / zoom,
                y: (e.clientY - canvasRect.top) / zoom,
            }

            this.props.onCreateWidgetRequest(widgetClass, {x: initialPos.x, y: initialPos.y},({ id, widgetRef }) => {
                this.props.onAddChildWidget({
                                            event: e, 
                                            parentWidgetId: this.__id, 
                                            dragElementID: id,
                                            posMetaData,
                                            adjustInitialOffset: false, // don't adjust for initial offset
                                        }) //  if dragged from the sidebar create the widget first
            })

        }

    }


    handleDragLeave = (e, draggedElement, overElement) => {

        e.preventDefault()
        e.stopPropagation()

        const rect = this.getBoundingRect()
        
        const {clientX, clientY} = e
        
        const isInBoundingBox = (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom)
            
        // if (!e.currentTarget.contains(draggedElement)) {
        if (!isInBoundingBox) {
            // FIXME: if the mouse pointer is over this widget's child, then droppable style should be invisible
            // only if the dragging element is not within the rect of this element remove the dragging rect
            this.setState({
                showDroppableStyle: {
                    allow: false,
                    show: false
                }
            }, () => {
                // console.log("Drag left", this.state.showDroppableStyle)
            })

        }
    }

    handleDragEnd = (callback) => {
        callback()
        this.setState({ isDragging: false })
        this.enablePointerEvents()

        // this.props.onWidgetDragEnd(this.elementRef?.current)
    }

    disablePointerEvents = () => {

        if (this.elementRef.current)
            this.elementRef.current.style.pointerEvents = "none"
    }

    enablePointerEvents = () => {
        if (this.elementRef.current)
            this.elementRef.current.style.pointerEvents = "auto"
    }

    getInnerRenderStyling(){
        const {width, height, minWidth, minHeight} = this.getRenderSize()

        const styling = {
            ...this.state.widgetInnerStyling,
            width, 
            height,
            minWidth, 
            minHeight
        }
        return styling
    }

    getRenderSize(){

        let width = isNumeric(this.state.size.width) ? `${this.state.size.width}px` : this.state.size.width
        let height = isNumeric(this.state.size.height) ? `${this.state.size.height}px` : this.state.size.height

        let fitWidth = this.state.fitContent.width
        let fitHeight = this.state.fitContent.height
        
        if (fitWidth){
            // width = "max-content"
            width = "max-content"
        }

        if (fitHeight){
            height = "max-content"
        }

        // if fit width is enabled then the minsize is the resizable size
        let minWidth = fitWidth ? this.state.size.width : this.minSize.width
        let minHeight = fitHeight ? this.state.size.height : this.minSize.height

        // let minWidth = fitWidth ? "max-content" : this.minSize.width
        // let minHeight = fitHeight ? "max-content" : this.minSize.height
        
        // let minWidth = this.minSize.width
        // let minHeight = this.minSize.height
        
        return {width, height, minWidth, minHeight}

    }

    /**
     * Note: you must implement this method in subclass, if you want children make sure to pass
     * {this.props.children}, to modify the style add this.state.widgetInnerStyling
    */
    renderContent() {
        // throw new NotImplementedError("render method has to be implemented")
        return (
            <div className="tw-w-full tw-h-full tw-p-2 tw-content-start tw-rounded-md tw-overflow-hidden" style={this.state.widgetInnerStyling}>
                {this.props.children}
            </div>
        )
    }

    // requestUpdateWidgetPos = () => {
    //     const canvasRectInner = this.props.canvasInnerContainerRef?.current?.getBoundingClientRect();
    //     const elementRect = this.getBoundingRect();
    //     const { zoom } = this.props.canvasMetaData;
    
    //     const left = ((elementRect?.left || 0) - canvasRectInner?.left) / zoom - 10;
    //     const top = ((elementRect?.top || 0) - canvasRectInner?.top) / zoom - 10;
    
    //     this.setState({ pos: {x: left, y: top} });
    // }

    /**
     * 
     * @param {"sw"|"ne"|"se"|"nw"|null} side 
     */
    handleWidgetResize = (side) => {
        if (side){
            this.props.onWidgetResizing(side)
            this.setState({ dragEnabled: false })
        }else{
            this.setState({ dragEnabled: true })
            this.props.onWidgetResizing("")
        }
    }

    /**
     * This is an internal methods don't override
     * @returns {HTMLElement}
     */
    render() {  

        const {width, height, minWidth, minHeight} = this.getRenderSize()
        
        // NOTE: first check tkinter behaviour with the width and height

        let outerStyle = {
            
            ...this.state.widgetOuterStyling,
            width: width,
            height: height,
            cursor: this.cursor,
            zIndex: this.state.zIndex,
            position: this.state.positionType, //  don't change this if it has to be movable on the canvas
            top: `${this.state.pos.y}px`,
            left: `${this.state.pos.x}px`,
            minWidth: minWidth, 
            minHeight: minHeight,
            opacity: this.state.isDragging ? 0.3 : 1,
        }

        const handleSetInitialPosition = (e, setPosMetaData) => {

            e.stopPropagation() // prevent this event from bubbling up to parents

            const {clientX, clientY} = e

            const elementRect = this.elementRef.current.getBoundingClientRect() 
            const canvasInnerRect = this.props.canvasInnerContainerRef.current.getBoundingClientRect()

            // const {zoom, pan} = this.props.canvasMetaData

            
            let initialPos = {
                x: elementRect.left - canvasInnerRect.left,
                y: elementRect.top - canvasInnerRect.top
            }

            const posMetaData = {
                dragStartCursorPos: {x: clientX, y: clientY},
                initialPos: {...initialPos}
            }

            setPosMetaData(posMetaData)

        }

        // const boundingRect = this.getBoundingRect

      
        
        return (

            <DragContext.Consumer>
                {
                    ({ draggedElement, widgetClass, onDragStart, onDragEnd, overElement, setOverElement, posMetaData, setPosMetaData }) => {

                        // const canvasRect = this.canvas.getBoundingClientRect()
                        const canvasRectInner = this.props.canvasInnerContainerRef?.current?.getBoundingClientRect()


                        const {zoom} = this.props.canvasMetaData

                        return ( 

                            <div data-widget-id={this.__id}
                                    ref={this.elementRef}
                                    className={`tw-shadow-xl tw-w-fit tw-h-fit ${!this.state.isWidgetVisible ? "tw-hidden" : ""}`}
                                    style={outerStyle}
                                    data-draggable-type={this.getWidgetType()} // helps with droppable 
                                    data-container={this.state.widgetContainer} // indicates how the canvas should handle dragging, one is sidebar other is canvas

                                    data-drag-start-within // this attribute indicates that the drag is occurring from within the project and not a outside file drop

                                    draggable={this.state.dragEnabled}

                                    onDragOver={(e) => this.handleDragOver(e, draggedElement)}
                                    onDrop={(e) => {this.handleDropEvent(e, draggedElement, widgetClass, posMetaData); onDragEnd()}}

                                    onDragEnter={(e) => this.handleDragEnter(e, draggedElement, setOverElement)}
                                    onDragLeave={(e) => this.handleDragLeave(e, draggedElement, overElement)}

                                    onDragStart={(e) => this.handleDragStart(e, onDragStart)}
                                    onDragEnd={(e) => this.handleDragEnd(onDragEnd)}

                                    // onPointerDown={setInitialPos}
                                    onPointerDown={(e) => handleSetInitialPosition(e, setPosMetaData)}         
                                >
                                    <div className="tw-relative tw-w-full  tw-h-full tw-top-0 tw-left-0"
                                            
                                        >
                                        

                                        <div className="tw-relative tw-top-0 tw-left-0 tw-w-full tw-h-full" ref={this.innerAreaRef}
                                            >
                                            {this.renderContent()}
                                        </div>
                                        {
                                            // show drop style on drag hover
                                            draggedElement && this.state.showDroppableStyle.show &&
                                            <div className={`${this.state.showDroppableStyle.allow ? "tw-border-blue-600" : "tw-border-red-600"} 
                                                                    tw-absolute tw-top-[-5px] tw-left-[-5px] tw-w-full tw-h-full tw-z-[2]
                                                                    tw-border-2 tw-border-dashed  tw-rounded-lg tw-pointer-events-none

                                                                    `}
                                                style={{
                                                    width: "calc(100% + 10px)",
                                                    height: "calc(100% + 10px)",
                                                }}
                                            >
                                            </div>
                                        }

                                        <ResizeHandle 
                                                canvasRect={canvasRectInner}
                                                canvasZoom={zoom}
                                                elementRef={this.elementRef}
                                                show={this.state.selected}
                                                onWidgetResizing={this.handleWidgetResize}
                                                enableRename={this.state.enableRename}
                                                widgetName={this.state.widgetName}
                                                setWidgetName={this.setWidgetName}
                                                />

                                    </div>
                                </div>
                            )
                    }
                }

            </DragContext.Consumer>
        )

    }

}

/**
 * 
 * a component that displays resize handles, don't remove this function and try to add it directly
 * to base widget as with base widget getBoundingClient rect is always stale without useEffect
 * 
 * // TODO: make this smoother
 * 
 */
function ResizeHandle({elementRef, show, canvasRect, 
                        canvasZoom, onWidgetResizing,
                        widgetName, setWidgetName, enableRename
                    }){
    const [rect, setRect] = useState({
        left: 0, 
        top: 0, 
        width: 0, 
        height: 0
    })

    const timeoutRef = useRef(null)
    const isResizingRef = useRef(false)

    useLayoutEffect(() => {
        if (!elementRef.current)
            return

        const updateRect = () => {
                const elementRect = elementRef.current?.getBoundingClientRect()

                if (!elementRect){
                    return
                }

                const left = ((elementRect.left || 0) - canvasRect.left) / canvasZoom - 10;
                const top = ((elementRect.top || 0) - canvasRect.top) / canvasZoom - 10;
                const width = (elementRect.width / canvasZoom) + 20;
                const height = (elementRect.height / canvasZoom) + 20;
                setRect({ left, top, width, height });
        }

        clearTimeout(timeoutRef.current);
       
        if (!isResizingRef.current)
            timeoutRef.current = setTimeout(updateRect, 16); // ~60fps

        else{
            updateRect()
        }

    }, [elementRef, canvasZoom, canvasRect, enableRename])

    const handleResizing = (side) => {

        onWidgetResizing(side)

        if (side){
            isResizingRef.current = true
        }else{
            isResizingRef.current = false
        }

    }

    return (
        <div className={`tw-fixed tw-pointer-events-none tw-bg-transparent tw-opacity-100
            ${show ? 'tw-border-2 tw-border-solid tw-border-blue-500' : 'tw-hidden'}`}
            style={{

                position: "fixed", // transforms are applied on parent so its going to be relative to parent
                left: rect.left,
                top: rect.top,
                width: rect.width, // (elementRect?.width/zoom || this.state.size.width) + 20,
                height: rect.height, //(elementRect?.height/zoom || this.state.size.height) + 20,
                zIndex: 1,
            }}
            >

            <div className={`"tw-relative tw-w-full  tw-h-full"`}> {/* ${this.state.isDragging ? "tw-pointer-events-none" : "tw-pointer-events-auto"} */}
                <EditableDiv value={widgetName} onChange={setWidgetName}
                    maxLength={40}
                    openEdit={enableRename}
                    className="tw-text-sm tw-w-fit tw-max-w-[160px] tw-text-clip tw-min-w-[150px] 
                                            tw-overflow-hidden tw-absolute tw--top-6 tw-h-6"
                />

                <div
                    className="tw-w-2 tw-h-2 tw-rounded-full tw-absolute tw-pointer-events-auto tw--left-1 tw--top-1 tw-bg-blue-500"
                    style={{ cursor: Cursor.NW_RESIZE }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleResizing("nw")
                    }}
                    onMouseUp={() => handleResizing(null)}
                />
                <div
                    className="tw-w-2 tw-h-2 tw-rounded-full tw-absolute tw-pointer-events-auto tw--right-1 tw--top-1 tw-bg-blue-500"
                    style={{ cursor: Cursor.SW_RESIZE }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleResizing("ne")
                    }}
                    onMouseUp={() => handleResizing(null)}
                />
                <div
                    className="tw-w-2 tw-h-2 tw-rounded-full tw-absolute tw-pointer-events-auto tw--left-1 tw--bottom-1 tw-bg-blue-500"
                    style={{ cursor: Cursor.SW_RESIZE }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleResizing("sw")
                    }}
                    onMouseUp={() => handleResizing(null)}
                />
                <div
                    className="tw-w-2 tw-h-2 tw-rounded-full tw-absolute tw-pointer-events-auto tw--right-1 tw--bottom-1 tw-bg-blue-500"
                    style={{ cursor: Cursor.SE_RESIZE }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleResizing("se")
                    }}
                    onMouseUp={() => handleResizing(null)}
                />

            </div>

        </div>

    )
}


export default Widget