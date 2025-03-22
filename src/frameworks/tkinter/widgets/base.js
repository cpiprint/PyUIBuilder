import { Layouts, PosType } from "../../../canvas/constants/layouts"
import Tools from "../../../canvas/constants/tools"
import Widget from "../../../canvas/widgets/base"
import { convertObjectToKeyValueString, isNumeric, removeKeyFromObject } from "../../../utils/common"
import { randomArrayChoice } from "../../../utils/random"
import { Tkinter_TO_WEB_CURSOR_MAPPING } from "../constants/cursor"
import { Tkinter_To_GFonts } from "../constants/fontFamily"
import { JUSTIFY, RELIEF } from "../constants/styling"



export class TkinterBase extends Widget {

    static requiredImports = ['import tkinter as tk']

    constructor(props) {
        super(props)

        this.getLayoutCode = this.getLayoutCode.bind(this)
        
        this.state = {
            ...this.state,
            packAttrs: {
                side: "top",
                anchor: "nw"
            }
        }

        this.getPackSide = this.getPackSide.bind(this)
        this.renderTkinterLayout = this.renderTkinterLayout.bind(this)
    }

 
    getLayoutCode(){
        const {layout: parentLayout, direction, gap, align="start"} = this.getParentLayout()

        const absolutePositioning = this.getAttrValue("positioning")  

        let layoutManager = `pack()`

        if (parentLayout === Layouts.PLACE || absolutePositioning){

            const config = {
                x: Math.trunc(this.state.pos.x),
                y: Math.trunc(this.state.pos.y),
            }

            config["width"] = Math.trunc(this.state.size.width)
            config["height"] = Math.trunc(this.state.size.height)

            // if (!this.state.fitContent.width){
            //     config["width"] = this.state.size.width
            // }
            // if (!this.state.fitContent.height){
            //     config["height"] = this.state.size.height
            // }

            const configStr = convertObjectToKeyValueString(config)

            layoutManager = `place(${configStr})`

        }else if (parentLayout === Layouts.FLEX){

            const packSide = this.getAttrValue("flexManager.side")

            const config = {}

            if (packSide === "" || packSide === "top"){
                
                config['side'] = `tk.TOP`
            
            }else if (packSide === "left"){
                
                config['side'] = `tk.LEFT`
    
            }else if (packSide === "right"){

                config['side'] = `tk.RIGHT`

            }else{
                config['side'] = `tk.BOTTOM`
            }

            if (gap > 0){
                config["padx"] = gap
                config["pady"] = gap
            }

            // if (align === "start"){
            //     config["anchor"] = "'nw'"
            // }else if (align === "center"){
            //     config["anchor"] = "'center'"
            // }else if (align === "end"){
            //     config["anchor"] = "'se'"
            // }

            const fillX = this.getAttrValue("flexManager.fillX")
            const fillY = this.getAttrValue("flexManager.fillY")
            const expand = this.getAttrValue("flexManager.expand")

            if (fillX){
                config['fill'] = `"x"`
            }

            if (fillY){
                config['fill'] = `"y"`
            }

            if (fillX && fillY){
                config['fill'] = `"both"`
            }

            if (expand){
                config['expand'] = "True"
            }

            layoutManager = `pack(${convertObjectToKeyValueString(config)})`

        }else if (parentLayout === Layouts.GRID){
            const row = this.getAttrValue("gridManager.row")
            const col = this.getAttrValue("gridManager.column")
            layoutManager = `grid(row=${row}, column=${col})`
        }

        return layoutManager
    }

    getPackAttrs = () => {
        // NOTE: tis returns (creates) a new object everytime causing unncessary renders
        return ({
            side: this.state.packAttrs.side,
            anchor: this.state.packAttrs.anchor,
        })
    }

    getPackSide(){
        return this.state.packAttrs.side
    }

    setParentLayout(layout){

        if (!layout){
            return {}
        } 
        let updates = super.setParentLayout(layout)

        const {layout: parentLayout, direction, gap} = layout

        // show attributes related to the layout manager
        // remove gridManager, flexManager positioning 
        const {gridManager, flexManager, positioning, ...restAttrs} =  this.state.attrs

        if (parentLayout === Layouts.FLEX || parentLayout === Layouts.GRID) {

            updates = {
                ...updates,
                // pos: pos,
                positionType: PosType.NONE,
            }
            // Allow optional absolute positioning if the parent layout is flex or grid
            const updateAttrs = {
                ...restAttrs,
                positioning: {
                    label: "Absolute positioning",
                    tool: Tools.CHECK_BUTTON,
                    value: false,
                    onChange: (value) => {
                        this.setAttrValue("positioning", value)
                        
                        this.updateState({
                            positionType: value ? PosType.ABSOLUTE : PosType.NONE,
                        })
                        
                    }
                }
            }

            if (parentLayout === Layouts.FLEX){
                updates = {
                    ...updates,
                    attrs: {
                        ...updateAttrs,
                        flexManager: {
                            label: "Pack Manager",
                            display: "horizontal",
                           
                            // anchor: {
                            //     label: "Anchor",
                            //     tool: Tools.SELECT_DROPDOWN,
                            //     options: ["nw", "ne", "sw", "se", "center"].map(val => ({value: val, label: val})),
                            //     value: this.state.packAttrs.anchor,
                            //     onChange: (value) => {
                            //         this.setAttrValue("flexManager.anchor", value, () => {
                            //             console.log("anchor updated")
                            //             this.updateState((prevState) => ({packAttrs: {...prevState.packAttrs, anchor: value}}), () => {
                                          
                            //                 this.props.requestWidgetDataUpdate(this.props.parentWidgetRef.current.__id)
                                            
                            //                 // this.props.requestWidgetDataUpdate(this.__id)
                            //                 this.stateChangeSubscriberCallback() // call this to notify the toolbar that the widget has changed state
                            //                 // this.props.parentWidgetRef.current.forceRerender()
                            //             })
                            //             // this.props.parentWidgetRef.current.forceRerender()
                            //         })   
                            //     }
                            // },
                            fillX: {
                                label: "Fill X",
                                tool: Tools.CHECK_BUTTON,
                                value: false,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.fillX", value)

                                    this.updateState((prevState) => ({
                                        widgetOuterStyling: {
                                            ...prevState.widgetOuterStyling,
                                            width: "100%"
                                        }
                                    }))
                                    
                                }
                            },
                            fillY: {
                                label: "Fill Y",
                                tool: Tools.CHECK_BUTTON,
                                value: false,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.fillY", value)
                                    
                                    this.updateState((prevState) => ({
                                        widgetOuterStyling: {
                                            ...prevState.widgetOuterStyling,
                                            height: "100%"
                                        }
                                    }))
                                }
                            },
                            side: {
                                label: "Align Side",
                                tool: Tools.SELECT_DROPDOWN,
                                options: ["left", "right", "top", "bottom", ""].map(val => ({value: val, label: val})),
                                value: this.state.packAttrs.side,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.side", value, () => {
                                        this.updateState((prevState) => ({packAttrs: {...prevState.packAttrs, side: value}}), () => {
                                            this.props.requestWidgetDataUpdate(this.props.parentWidgetRef.current.__id)
                                            this.stateChangeSubscriberCallback() // call this to notify the toolbar that the widget has changed state
                                            // this.props.parentWidgetRef.current.forceRerender()
                                        })
                                    })

                                    
                                    // console.log("updateing state: ", value, this.props.parentWidgetRef.current)
                                }
                            },
                            // expand: {
                            //     label: "Expand",
                            //     tool: Tools.CHECK_BUTTON,
                            //     value: false,
                            //     onChange: (value) => {
                            //         this.setAttrValue("flexManager.expand", value)
                                    
                            //         const widgetStyle = {
                            //             ...this.state.widgetOuterStyling,
                            //             flexGrow: value ? 1 : 0,
                            //         }
                            //         this.updateState({
                            //             widgetOuterStyling: widgetStyle,
                            //         })
                            //     }
                            // },
                            
                        }
                    }
                }
            }

            else if (parentLayout === Layouts.GRID) {
                // Set attributes related to grid layout manager
                updates = {
                    ...updates,
                    attrs: {
                        ...updateAttrs,
                        gridManager: {
                            label: "Grid manager",
                            display: "horizontal",
                            row: {
                                label: "Row",
                                tool: Tools.NUMBER_INPUT, 
                                toolProps: { placeholder: "width", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridRow") || "1/1"
                                    let [_row=1, rowSpan=1] = previousRow.replace(/\s+/g, '').split("/").map(Number)
                                    
                                    if (value > rowSpan){
                                        // rowSpan should always be greater than or eq to row
                                        rowSpan = value
                                        this.setAttrValue("gridManager.rowSpan", rowSpan)
                                    }
                                    this.setAttrValue("gridManager.row", value)
                                    this.setWidgetOuterStyle("gridRow", `${value+' / '+rowSpan}`)
                                }
                            },
                            rowSpan: {
                                label: "Row span",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "height", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridRow") || "1/1"
                                    
                                    const [row=1, _rowSpan=1] = previousRow.replace(/\s+/g, '').split("/").map(Number)
                                    
                                    if (value < row){
                                        value = row + 1
                                    }
                                    
                                    this.setAttrValue("gridManager.rowSpan", value)
                                    this.setWidgetOuterStyle("gridRow", `${row + ' / ' +value}`)
                                }
                            },
                            column: {
                                label: "Column",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "height", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridColumn") || "1/1"

                                    let [_col=1, colSpan=1] = previousRow.replace(/\s+/g, '').split("/").map(Number)

                                    if (value > colSpan){
                                        // The colSpan has always be equal or greater than col
                                        colSpan = value
                                        this.setAttrValue("gridManager.columnSpan", colSpan)
                                    }

                                    this.setAttrValue("gridManager.column", value)
                                    this.setWidgetOuterStyle("gridColumn", `${value +' / ' + colSpan}`)
                                }
                            },
                            columnSpan: {
                                label: "Column span",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "height", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                            
                                    const previousCol = this.getWidgetOuterStyle("gridColumn") || "1/1"

                                    const [col=1, _colSpan=1] = previousCol.replace(/\s+/g, '').split("/").map(Number)

                                    if (value < col){
                                        value = col + 1
                                    }
                                    
                                    this.setAttrValue("gridManager.columnSpan", value)
                                    this.setWidgetOuterStyle("gridColumn", `${col + ' / ' + value}`)
                                }
                            },
                        }
                    }
                }

            }

        } else if (parentLayout === Layouts.PLACE) {
            updates = {
                ...updates,
                positionType: PosType.ABSOLUTE
            }
        }


        this.updateState((prevState) => ({...prevState, ...updates}))


        return updates
    }

    getFlexLayoutStyle = (side, anchor) => {
        // NOTE: may no longer be required
        // let baseStyle = { display: "flex", width: "100%", height: "100%", ...this.getPackAnchorStyle(anchor) }
        let baseStyle = { }

        const rowStyle = {
            display: "flex",
            gap: "10px",
          }

        const columnStyle = {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
        }

        switch (side) {
            case "top":
                return { gridColumn: "1 / -1", alignSelf: "stretch", ...baseStyle, ...columnStyle };
            case "bottom":
                return { gridColumn: "1 / -1", alignSelf: "stretch", ...baseStyle, ...columnStyle };
            case "left":
                return { gridRow: "2", gridColumn: "1", justifySelf: "stretch", ...baseStyle, ...rowStyle };
            case "right":
                return { gridRow: "2", gridColumn: "3", justifySelf: "stretch", ...baseStyle, ...rowStyle };
            case "center":
                return { gridRow: "2", gridColumn: "2", alignSelf: "center", justifySelf: "center", ...baseStyle, };
            default:
                return {};
        }
        
    }

    /**
     * Pack manager has anchor parameter
     * @param {*} anchor 
     */
    getPackAnchorStyle = (anchor, isColumn) => {
        // NOTE: may no longer be required
        const styleMap = {
          nw: { justifyContent: "flex-start", alignItems: "flex-start" },
          ne: { justifyContent: "flex-end", alignItems: "flex-start" },
          sw: { justifyContent: "flex-start", alignItems: "flex-end" },
          se: { justifyContent: "flex-end", alignItems: "flex-end" },
          center: { justifyContent: "center", alignItems: "center" }
        }
        // return styleMap[anchor] || {}

        const baseStyle = styleMap[anchor] || {};
        const fillX = this.getAttrValue("flexManager.fillX")
        const fillY = this.getAttrValue("flexManager.fillY")
        
        if (fillX) {
            return { ...baseStyle, width: "100%", flexGrow: isColumn ? 0 : 1 }; 
        } 
        if (fillY) {
            return { ...baseStyle, height: "100%", flexGrow: isColumn ? 1 : 0 };
        } 
        if (fillX && fillY) {
            return { ...baseStyle, width: "100%", height: "100%", flexGrow: 1 };
        }

        return {
            ...baseStyle, alignSelf: "stretch",   // Forces stretching in grid rows
            justifySelf: "stretch", // Forces stretching in grid columns
            flexGrow: (fillX || fillY) ? 1 : 0
            };
    }
      

    /**
     * adds the layout to achieve the pack from tkinter refer: https://www.youtube.com/watch?v=rbW1iJO1psk
     * @param {*} widgets 
     * @param {*} index 
     * @returns 
     */
    renderPackWidgetsRecursively = (widgets, index = 0, lastSide="") => {

        if (index >= widgets.length) return null


        const widget = widgets[index]
        const widgetRef = widget.ref?.current
        if (!widgetRef) return null // Ensure ref exists before accessing
        
        const side = widgetRef.getPackAttrs()?.side || "top"
        
        const direction = (s) => {
            return  (s === "bottom"
                        ? "column-reverse"
                        : s === "top"
                        ? "column"
                        : s === "right"
                        ? "row-reverse"
                        : "row")
        }
          
        const currentWidgetDirection = direction(side)


        const isSameSide = lastSide === side
        lastSide = side; // Update last side for next recursion

        // console.log("current widget direction: ", isSameSide, currentWidgetDirection)

        if (isSameSide) {
            return (
                <>
                    {/* <div style={{
                            display: "flex",
                            flexDirection: direction,
                            width: "100%"
                    }}>{widget}</div> */}
                    <div className="tw-flex tw-justify-center tw-items-center tw-w-full">
                        {widget}
                    </div>

                    {/* <WidgetOuter key={index}>{widget}</WidgetOuter> */}
                    {this.renderPackWidgetsRecursively(widgets, index + 1, side)}
                </>
            )
          }
        
          // If next widget has a different side, create a new container for it
          return (
                <div data-pack-container={side} style={{
                    display: "flex",
                    flexDirection: currentWidgetDirection,
                    width: "100%",
                    height: "100%"
                }}>

                    <div className={`tw-flex tw-justify-center tw-items-center 
                                        ${(["top", "bottom"].includes(side)) ? "tw-w-full" : "tw-h-full"}`}>
                        {widget}
                    </div>
                    {this.renderPackWidgetsRecursively(widgets, index + 1, side)}
                </div>
               
          );
      
    };
      

    /**
     * 
     * Helps with pack layout manager and grid manager
     */
    renderTkinterLayout(){
        const {layout, direction, gap} = this.getLayout()
        if (layout === Layouts.FLEX){


            return (
                <>
                    {this.renderPackWidgetsRecursively(this.props.children)}
                </>
            )
        }
        return (<>{this.props.children}</>)
    }


    setLayout(value) {
        const { layout, direction, grid = { rows: 1, cols: 1 }, gap = 10, align } = value

        // console.log("layout value: ", value)
        // FIXME: In grid layout the layout doesn't adapt to the size of the child if resized

        let display = "block"

        if (layout !== Layouts.PLACE){
            if (this.droppableTags !== null){
                display = "grid"
            }else{
                display = "flex" // this is so that the labels and other elements are centered
            }
        }
        
        let widgetStyle = {
            ...this.state.widgetInnerStyling,
            display: layout !== Layouts.PLACE ? layout : "block",
            flexDirection: "column",
            // flexDirection: direction,
            gap: `${gap}px`,
            // flexWrap: "wrap",

            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gridTemplateRows: "repeat(auto-fill, minmax(100px, 1fr))",  
            // gridAutoRows: 'minmax(100px, auto)',  // Rows with minimum height of 100px, and grow to fit content
            // gridAutoCols: 'minmax(100px, auto)',  // Cols with minimum height of 100px, and grow to fit content
        }

        this.updateState({
            widgetInnerStyling: widgetStyle
        })

        this.setAttrValue("layout", value)
        this.props.onLayoutUpdate({parentId: this.__id, parentLayout: value})// inform children about the layout update

    }

    getInnerRenderStyling(){
        let {width, height, minWidth, minHeight} = this.getRenderSize()
        
        const {layout: parentLayout, direction, gap} = this.getParentLayout() || {}

        // if (parentLayout === Layouts.FLEX){
        //     const fillX = this.getAttrValue("flexManager.fillX")
        //     const fillY = this.getAttrValue("flexManager.fillY")

        //     // This is needed if fillX or fillY is true, as the parent is applied flex-grow

        //     if (fillX || fillY){
        //         width = "100%"
        //         height = "100%"
        //     }

        // }
        
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

        let {width, height, minWidth, minHeight} = super.getRenderSize()

        let fillX = this.getAttrValue("flexManager.fillX") || false
        let fillY = this.getAttrValue("flexManager.fillY") || false

        if (fillX){
            width = "100%"
        }

        if (fillY){
            height = "100%"
        }
        
        return {width, height, minWidth, minHeight}

    }


    serialize(){
        return ({
            ...super.serialize(),
            attrs: this.serializeAttrsValues(), // makes sure that functions are not serialized
            packAttrs: this.state.packAttrs,
        })
    }

    /**
     * loads the data 
     * @param {object} data 
     */
    load(data, callback=null){

        // TODO: call the base widget

        if (Object.keys(data).length === 0) return // no data to load

        data = {...data} // create a shallow copy

        const {attrs={}, selected, pos={x: 0, y: 0},  ...restData} = data

        const parentLayout = this.props.parentWidgetRef?.current?.getLayout()


        let layoutUpdates = {
            parentLayout: parentLayout
        }
        
        if (parentLayout){
            if (parentLayout.layout === Layouts.FLEX || parentLayout.layout === Layouts.GRID){

                layoutUpdates = {
                    ...layoutUpdates,
                    positionType: PosType.NONE
                }

            }else if (parentLayout.layout === Layouts.PLACE){
                layoutUpdates = {
                    ...layoutUpdates,
                    positionType: PosType.ABSOLUTE
                }
            }
        }

        const newData = {
            ...restData,
            ...layoutUpdates,
            pos
        }
        

        this.setState(newData,  () => {
            let layoutAttrs = this.setParentLayout(parentLayout).attrs || {}
            
            // UPdates attrs
            let newAttrs = { ...this.state.attrs, ...layoutAttrs }
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
                if (nestedObject[lastKey])
                    nestedObject[lastKey].value = value
            })

            
            if (newAttrs?.styling?.backgroundColor){
                // TODO: find a better way to apply innerStyles
                this.setWidgetInnerStyle("backgroundColor", newAttrs.styling.backgroundColor.value)
            }
            this.updateState({ attrs: newAttrs }, callback)

            if (selected){
                this.select()
            } 
        })  



    }


}


// base for widgets that have common base properties such as bg, fg, cursor etc
export class TkinterWidgetBase extends TkinterBase{

    constructor(props) {
        super(props)

        this.droppableTags = null // disables drops

        const newAttrs = removeKeyFromObject("layout", this.state.attrs)

        this.state = {
            ...this.state,
            attrs: {
                ...newAttrs,
                styling: {
                    ...newAttrs.styling,
                    foregroundColor: {
                        label: "Foreground Color",
                        tool: Tools.COLOR_PICKER, 
                        value: "#000",
                        onChange: (value) => {
                            this.setWidgetInnerStyle("color", value)
                            this.setAttrValue("styling.foregroundColor", value)
                        }
                    },
                    borderWidth: {
                        label: "Border thickness",
                        tool: Tools.NUMBER_INPUT, 
                        toolProps: {min: 0, max: 10},
                        value: 0,
                        onChange: (value) => {
                            this.setWidgetInnerStyle("border", `${value}px solid black`)
                            this.setAttrValue("styling.borderWidth", value)
                        }
                    },
                    relief: {
                        label: "Relief",
                        tool: Tools.SELECT_DROPDOWN,
                        options: RELIEF.map((val) => ({value: val, label: val})),
                        value: "",
                        onChange: (value) => {
                            // this.setWidgetInnerStyle("fontFamily", Tkinter_To_GFonts[value])
                            this.setAttrValue("styling.relief", value)
                        }
                    },
                    // justify: {
                    //     label: "Justify",
                    //     tool: Tools.SELECT_DROPDOWN,
                    //     options: JUSTIFY.map((val) => ({value: val, label: val})),
                    //     value: "",
                    //     onChange: (value) => {
                    //         this.setWidgetInnerStyle("text-align", value)
                    //         this.setAttrValue("styling.justify", value)
                    //     }
                    // }
                },
                padding: {
                    label: "padding",
                    padX: {
                        label: "Pad X",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: null,
                        onChange: (value) => {
                            // this.setWidgetInnerStyle("paddingLeft", `${value}px`)
                            // this.setWidgetInnerStyle("paddingRight", `${value}px`)

                            // const widgetStyle = {
                               
                            // }
                            this.setState((prevState) => ({

                                widgetInnerStyling: {
                                    ...prevState.widgetInnerStyling,
                                    paddingLeft: `${value}px`,
                                    paddingRight: `${value}px`
                                }
                            }))


                            this.setAttrValue("padding.padX", value)
                        }
                    },
                    padY: {
                        label: "Pad Y",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: null,
                        onChange: (value) => {

                            this.setState((prevState) => ({

                                widgetInnerStyling: {
                                    ...prevState.widgetInnerStyling,
                                    paddingTop: `${value}px`,
                                    paddingBottom: `${value}px`
                                }
                            }))
                            // this.setState({

                            //     widgetInnerStyling: widgetStyle
                            // })
                            this.setAttrValue("padding.padX", value)
                        }
                    },
                },
                margin: {
                    label: "Margin",
                    marginX: {
                        label: "Margin X",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: null,
                        onChange: (value) => {

                            const widgetStyle = {
                                ...this.state.widgetOuterStyling,
                                marginLeft: `${value}px`,
                                marginRight: `${value}px`
                            }

                            this.updateState({
                                widgetOuterStyling: widgetStyle,
                            })
                            this.setAttrValue("margin.marginX", value)
                        }
                    },
                    marginY: {
                        label: "Margin Y",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: null,
                        onChange: (value) => {
                            const widgetStyle = {
                                ...this.state.widgetOuterStyling,
                                marginTop: `${value}px`,
                                marginBottom: `${value}px`
                            }

                            this.updateState({
                                widgetOuterStyling: widgetStyle,
                            })
                            this.setAttrValue("margin.marginY", value)
                        }
                    },
                },       
                font: {
                    label: "font",
                    fontFamily: {
                        label: "font family",
                        tool: Tools.SELECT_DROPDOWN,
                        options: Object.keys(Tkinter_To_GFonts).map((val) => ({value: val, label: val})),
                        value: "",
                        onChange: (value) => {
                            this.setWidgetInnerStyle("fontFamily", Tkinter_To_GFonts[value])
                            this.setAttrValue("font.fontFamily", value)
                        }
                    },
                    fontSize: {
                        label: "font size",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 3, max: 140},
                        value: null,
                        onChange: (value) => {
                            this.setWidgetInnerStyle("fontSize", `${value}px`)
                            this.setAttrValue("font.fontSize", value)
                        }
                    }
                },
                cursor: {
                    label: "Cursor",
                    tool: Tools.SELECT_DROPDOWN, 
                    toolProps: {placeholder: "select cursor"},
                    value: "",
                    options: Object.keys(Tkinter_TO_WEB_CURSOR_MAPPING).map((val) => ({value: val, label: val})),
                    onChange: (value) => {
                        this.setWidgetInnerStyle("cursor", Tkinter_TO_WEB_CURSOR_MAPPING[value])
                        this.setAttrValue("cursor", value)
                    }
                },
            }
        }

        this.getConfigCode = this.getConfigCode.bind(this)
    }

    getConfigCode(){

        const config = {
            bg: `"${this.getAttrValue("styling.backgroundColor")}"`,
            fg: `"${this.getAttrValue("styling.foregroundColor")}"`,
        }

        if (this.getAttrValue("styling.borderWidth"))
            config["bd"] = this.getAttrValue("styling.borderWidth")

        if (this.getAttrValue("styling.relief"))
            config["relief"] = `tk.${this.getAttrValue("styling.relief")}`

        if (this.getAttrValue("font.fontFamily") || this.getAttrValue("font.fontSize")){
            config["font"] = `("${this.getAttrValue("font.fontFamily")}", ${this.getAttrValue("font.fontSize") || 12}, )`
        }

        if (this.getAttrValue("cursor"))
            config["cursor"] = `"${this.getAttrValue("cursor")}"`

        if (this.getAttrValue("padding.padX")){
            // inner padding
            config["ipadx"] = this.getAttrValue("padding.padX")
        }

        if (this.getAttrValue("padding.padY")){
            config["ipady"] = this.getAttrValue("padding.padY")
        }


        if (this.getAttrValue("margin.marginX")){
            config["padx"] = this.getAttrValue("margin.marginX")
        }

        if (this.getAttrValue("margin.marginY")){
            config["pady"] = this.getAttrValue("margin.marginY")
        }

        // FIXME: add width and height, the scales may not be correct as the width and height are based on characters in pack and grid not pixels
        // if (!this.state.fitContent.width){
        //     config["width"] = this.state.size.width
        // }
        // if (!this.state.fitContent.height){
        //     config["height"] = this.state.size.height
        // }

        return config
    }

}