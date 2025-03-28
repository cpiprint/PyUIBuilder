import { Layouts, PosType } from "../../../canvas/constants/layouts"
import Tools from "../../../canvas/constants/tools"
import Widget from "../../../canvas/widgets/base"
import { DynamicGridWeightInput } from "../../../components/inputs"
import { convertObjectToKeyValueString, removeKeyFromObject } from "../../../utils/common"
import { Tkinter_TO_WEB_CURSOR_MAPPING } from "../constants/cursor"
import { Tkinter_To_GFonts } from "../constants/fontFamily"
import { ANCHOR, GRID_STICKY, JUSTIFY, RELIEF } from "../constants/styling"



export class CustomTkBase extends Widget {

    static requiredImports = ['import customtkinter as ctk']

    static requirements = ['customtkinter']

    constructor(props) {
        super(props)

        this.getLayoutCode = this.getLayoutCode.bind(this)
        
        this.state = {
            ...this.state,
            packAttrs: { // This is required as during flex layout change remount happens and the state updates my not function as expected
                side: "top",
                anchor: "n",
            }
        }

        this.renderTkinterLayout = this.renderTkinterLayout.bind(this) // this must be called if droppableTags is not set to null

        const originalRenderContent = this.renderContent.bind(this);
        this.renderContent = () => {
            this._calledRenderTkinterLayout = false

            const content = originalRenderContent()

            if (
                this.droppableTags !== null &&
                this.droppableTags !== undefined &&
                !this._calledRenderTkinterLayout
            ) {
                throw new Error(
                `class ${this.constructor.name}: renderTkinterLayout() must be called inside renderContent() when droppableTags is not null`
                )
            }

            return content
        }
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

            const marginX = this.getAttrValue("margin.marginX")
            const marginY = this.getAttrValue("margin.marginY")

            const paddingX = this.getAttrValue("padding.padX")
            const paddingY = this.getAttrValue("padding.padY")

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

            // if (gap > 0){
            //     config["padx"] = gap
            //     config["pady"] = gap
            // }

            if (marginX){
                config["padx"] = marginX
            }

            if (marginY){
                config["pady"] = marginY
            }

            if (paddingX){
                config["ipadx"] = paddingX
            }

            if (paddingY){
                config["ipady"] = paddingY
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
            const column = this.getAttrValue("gridManager.column")
            const rowSpan = this.getAttrValue("gridManager.rowSpan")
            const columnSpan = this.getAttrValue("gridManager.columnSpan")

            const sticky = this.getAttrValue("gridManager.sticky")

            const config = {
                row: row-1, // unlike css grid tkinter grid starts from 0
                column: column-1, // unlike css grid tkinter grid starts from 0 
            }

            if (rowSpan > 1){
                config['rowspan'] = rowSpan
            }

            if (columnSpan > 1){
                config['columnspan'] = columnSpan
            }

            if (sticky !== ""){
                config['sticky'] = `"${sticky}"`
            }

            layoutManager = `grid(${convertObjectToKeyValueString(config)})` 
        }

        return layoutManager
    }


    getGridLayoutConfigurationCode = (variableName) => {
        const {layout: currentLayout} = this.getLayout()

        let columnConfigure = []
        let rowConfigure = []

        if (currentLayout === Layouts.GRID){

            const rowWeights = this.getAttrValue("gridWeights.rowWeights")
            const colWeights = this.getAttrValue("gridWeights.colWeights")

            if (rowWeights){
                const correctedRowWeight = Object.fromEntries(
                    Object.entries(rowWeights).map(([_, { gridNo, weight }]) => [gridNo-1, weight]) // tkinter grid starts from 0 unlike css grid
                );// converts the format : {index: {gridNo, weight}} to {gridNo: weight}

                const groupByWeight = Object.entries(correctedRowWeight).reduce((acc, [gridNo, weight]) => {
                                                if (!acc[weight]) 
                                                    acc[weight] = []; // Initialize array if it doesn't exist
                                                
                                                acc[weight].push(Number(gridNo)); // Convert key to number and add it to the array
                                                return acc;
                                        }, {})
            
                Object.entries(groupByWeight).forEach(([weight, indices]) => {
                    rowConfigure.push(`${variableName}.grid_rowconfigure(index=[${indices.join(",")}], weight=${weight})`)
                })
            }

            if (colWeights){
                const correctedColWeight = Object.fromEntries(
                    Object.entries(colWeights).map(([_, { gridNo, weight }]) => [gridNo-1, weight]) //  tkinter grid starts from 0, so -1
                ) // converts the format : {index: {gridNo, weight}} to {gridNo: weight}

                const groupByWeight = Object.entries(correctedColWeight).reduce((acc, [gridNo, weight]) => {
                                                if (!acc[weight]) 
                                                    acc[weight] = [] // Initialize array if it doesn't exist
                                                
                                                acc[weight].push(Number(gridNo)) // Convert key to number and add it to the array
                                                return acc
                                        }, {})
            
                Object.entries(groupByWeight).forEach(([weight, indices]) => {
                    columnConfigure.push(`${variableName}.grid_columnconfigure(index=[${indices.join(",")}], weight=${weight})`)
                })
            }
            
        }

        return [...rowConfigure, ...columnConfigure]

    }

    getPackAttrs = () => {
        return ({
            side: this.state.packAttrs.side,
            anchor: this.state.packAttrs.anchor,
            expand: this.getAttrValue("flexManager.expand"),
        })
    }

    /**
     * A simple function that returns a mapping for grid sticky tkinter
     */
    getGridStickyStyling(sticky){

        const styleMapping = {
            [GRID_STICKY.N]: { alignSelf: "start", justifySelf: "center" }, 
            [GRID_STICKY.S]: { alignSelf: "end", justifySelf: "center" },   
            [GRID_STICKY.E]: {  alignSelf: "center", justifySelf: "end" }, 
            [GRID_STICKY.W]: {  alignSelf: "center", justifySelf: "start" },
            [GRID_STICKY.NS]: { alignSelf: "stretch", justifySelf: "center" }, // Stretch vertically
            [GRID_STICKY.EW]: { alignSelf: "center", justifySelf: "stretch"  }, // Stretch horizontally
            [GRID_STICKY.NE]: { alignSelf: "start", justifySelf: "end" }, // Top-right
            [GRID_STICKY.SE]: { alignSelf: "end", justifySelf: "end" },   // Bottom-right
            [GRID_STICKY.NW]: { alignSelf: "start", justifySelf: "start" }, // Top-left
            [GRID_STICKY.SW]: { alignSelf: "end", justifySelf: "start" },  // Bottom-left
            [GRID_STICKY.NEWS]: { placeSelf: "stretch" } // Stretch in all directions
        };

        return styleMapping[sticky]

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
                                           
                                            // this.props.parentWidgetRef.current.forceRerender()
                                            this.props.requestWidgetDataUpdate(this.props.parentWidgetRef.current.__id)
                                            this.stateChangeSubscriberCallback() // call this to notify the toolbar that the widget has changed state
                                        })
                                      

                                    })

                                    
                                    // console.log("updateing state: ", value, this.props.parentWidgetRef.current)
                                }
                            },
                            expand: {
                                label: "Expand",
                                tool: Tools.CHECK_BUTTON,
                                value: false,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.expand", value)
                                  
                                    // this.setWidgetOuterStyle(value ? 1 : 0)
                                }
                            },
                            anchor: {
                                label: "Anchor",
                                tool: Tools.SELECT_DROPDOWN,
                                options: ANCHOR.map(val => ({value: val, label: val})),
                                value: this.state.packAttrs.anchor,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.anchor", value, () => {
                                        // this.props.parentWidgetRef.current.forceRerender()
                                    })   
                                    this.updateState((prevState) => ({packAttrs: {...prevState.packAttrs, anchor: value}}), () => {
                                          
                                        // this.props.requestWidgetDataUpdate(this.props.parentWidgetRef.current.__id)
                                        
                                        // this.props.requestWidgetDataUpdate(this.__id)
                                        // this.stateChangeSubscriberCallback() // call this to notify the toolbar that the widget has changed state
                                        // this.props.parentWidgetRef.current.forceRerender()
                                    })
                                }
                            },
                            
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
                                toolProps: { placeholder: "row", max: 1000, min: 1 },
                                value: 0,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridRow") || "1 / span 1"
                                    let [_row=1, rowSpan=1] = previousRow.replace(/\s+/g, '').split("/span").map(Number)
                                    
                                    this.setAttrValue("gridManager.row", value)
                                    this.setWidgetOuterStyle("gridRow", `${value+' / span '+rowSpan}`)
                                }
                            },
                            rowSpan: {
                                label: "Row span",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "row span", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridRow") || "1 / span 1"
                                    
                                    // const [row=1, _rowSpan=1] = previousRow.replace(/\s+/g, '').split("/").map(Number)
                                    const [row=1, rowSpan=1] = previousRow.replace(/\s+/g, '').split("/span").map(Number)
                                    
                                    // if (value < row){
                                    //     value = row + 1
                                    // }
                                    if (value < 1){
                                        value = 1
                                    }
                                    
                                    this.setAttrValue("gridManager.rowSpan", value)
                                    this.setWidgetOuterStyle("gridRow", `${(row || 1) + ' / span ' +value}`)
                                }
                            },
                            column: {
                                label: "Column",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "column", max: 1000, min: 1 },
                                value: 0,
                                onChange: (value) => {
                                    
                                    const previousRow = this.getWidgetOuterStyle("gridColumn") || "1 / span 1"

                                    let [_col=1, colSpan=1] = previousRow.replace(/\s+/g, '').split("/span").map(Number)

                                    // if (value > colSpan){
                                    //     // The colSpan has always be equal or greater than col
                                    //     colSpan = value
                                    //     this.setAttrValue("gridManager.columnSpan", colSpan)
                                    // }

                                    this.setAttrValue("gridManager.column", value)
                                    this.setWidgetOuterStyle("gridColumn", `${value +' / span ' + colSpan}`)
                                }
                            },
                            columnSpan: {
                                label: "Column span",
                                tool: Tools.NUMBER_INPUT,
                                toolProps: { placeholder: "column span", max: 1000, min: 1 },
                                value: 1,
                                onChange: (value) => {
                            
                                    const previousCol = this.getWidgetOuterStyle("gridColumn") || "1 / span 1"

                                    const [col=1, _colSpan=1] = previousCol.replace(/\s+/g, '').split("/span").map(Number)


                                    if (value < 1){
                                        value = 1
                                    }
                                    
                                    this.setAttrValue("gridManager.columnSpan", value)
                                    this.setWidgetOuterStyle("gridColumn", `${(col || 1) + ' / span ' + value}`)
                                }
                            },
                            sticky: {
                                label: "Sticky",
                                tool: Tools.SELECT_DROPDOWN,
                                toolProps: { placeholder: "Sticky", },
                                options: Object.values(GRID_STICKY).map((val) => ({value: val, label: val})),
                                value: GRID_STICKY.NONE,
                                onChange: (value) => {
                            
                                    this.setAttrValue("gridManager.sticky", value)
                                    
                                    
                                    this.updateState((prev) => {
                                        
                                        const { alignSelf, justifySelf, placeSelf, ...restStates } = prev.widgetOuterStyling; // Remove these properties

                                        return ({
                                                    widgetOuterStyling: {
                                                        ...restStates,   
                                                        ...this.getGridStickyStyling(value)
                                                    }
                                                })
                                    })

                                    // this.setW

                                }
                            }
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

      

    /**
     * adds the layout to achieve the pack from tkinter refer: https://www.youtube.com/watch?v=rbW1iJO1psk
     * @param {*} widgets 
     * @param {*} index 
     * @returns 
     */
    renderPackWidgetsRecursively = (widgets, index = 0, lastSide = "", previousExpandValue = 0) => {
        if (index >= widgets.length) return null;
    
        const widget = widgets[index];
        const widgetRef = widget.ref?.current;
        if (!widgetRef) return null; // Ensure ref exists before accessing
    
        const { side = "top", expand = false, anchor } = widgetRef.getPackAttrs() || {};
    
        // console.log("rerendering:", side, expand);
    
        const directionMap = {
            top: "column",
            bottom: "column-reverse",
            left: "row",
            right: "row-reverse",
        }
    
        const currentWidgetDirection = directionMap[side] || "column"; // Default to "column"
        const isSameSide = lastSide === side;
        const isVertical = ["top", "bottom"].includes(side);
    
        let expandValue = expand ? (isSameSide ? previousExpandValue : widgets.length - index) : 1;
        
        if ((expand && previousExpandValue === 0) || (expand && expandValue === 0)){
            expandValue = 1 // if there is expand it should expand
        }

        if (expand && !isSameSide) previousExpandValue = expandValue;
    
        lastSide = side; // Update last side for recursion
        
        const anchorStyles = {
            n: { alignItems: "flex-start", justifyContent: "center" }, // Top-center
            s: { alignItems: "flex-end", justifyContent: "center" },   // Bottom-center
            e: { alignItems: "center", justifyContent: "flex-end" },   // Right-center
            w: { alignItems: "center", justifyContent: "flex-start" }, // Left-center
            ne: { alignItems: "flex-start", justifyContent: "flex-end" }, // Top-right
            nw: { alignItems: "flex-start", justifyContent: "flex-start" }, // Top-left
            se: { alignItems: "flex-end", justifyContent: "flex-end" }, // Bottom-right
            sw: { alignItems: "flex-end", justifyContent: "flex-start" }, // Bottom-left
            center: { alignItems: "center", justifyContent: "center" }, // Fully centered
        };
        const { justifyContent, alignItems } = anchorStyles[anchor] || anchorStyles["n"]


        const stretchClass = isVertical ? "tw-flex-grow" : "tw-h-full"; // Allow only horizontal growth for top/bottom
    
        if (isSameSide) {
            return (
                <>
                    <div
                        className={`tw-flex tw-justify-center tw-items-center ${stretchClass}`}
                        style={{
                            flexGrow: expand ? expandValue : 0, // Prevent vertical stretching
                            flexShrink: expand ? 0 : 1, // Prevent collapse when expanding
                            flexBasis: "auto",
                            minWidth: isVertical ? "0" : "auto",
                            minHeight: !isVertical ? "0" : "auto",
                            // alignSelf,
                            // justifySelf,
                            alignItems,
                            justifyContent
                        }}
                    >
                        {widget}
                    </div>
    
                    {this.renderPackWidgetsRecursively(widgets, index + 1, side, previousExpandValue)}
                </>
            );
        }
    
        return (
            <div
                data-pack-container={side}
                className={`tw-flex ${isVertical ? "!tw-h-full" : "!tw-w-full"}`} 
                style={{
                    display: "flex",
                    flexDirection: currentWidgetDirection,
                    flexGrow: expand ? expandValue : 1, //((widgets.length - 1) === index) ? 1 : 0, // last index will always have flex-grow 1
                    flexShrink: expand ? 0 : 1,
                    flexBasis: "auto",
                    minWidth: isVertical ? "0" : "auto",
                    minHeight: !isVertical ? "0" : "auto",
                }}
            >
                <div
                    className={`tw-flex ${isVertical ? "tw-flex-grow" : "tw-h-full"}
                                tw-justify-center tw-items-center`}
                    style={{
                        flexGrow: expand ? expandValue : 0,
                        flexShrink: expand ? 0 : 1,
                        flexBasis: "auto",
                        minWidth: isVertical ? "0" : "auto",
                        minHeight: !isVertical ? "0" : "auto",
                        // alignSelf,
                        // justifySelf,
                        alignItems,
                        justifyContent
                    }}
                >
                    {widget}
                </div>
    
                {this.renderPackWidgetsRecursively(widgets, index + 1, side, previousExpandValue)}
            </div>
        );
    }
    
      

    /**
     * 
     * Helps with pack layout manager and grid manager
     */
    renderTkinterLayout(){
        this._calledRenderTkinterLayout = true // NOTE: this is set so subclass are forced to call this method if droppable tags are not null
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


        if (layout === Layouts.GRID){


            const {...restAttrs} =  this.state.attrs

            const updates = {
                attrs: {
                    ...restAttrs,
                    gridConfig: {
                        label: "Grid Configure",
                        display: "horizontal",
                        noOfRows: {
                            label: "No of rows",
                            tool: Tools.NUMBER_INPUT, 
                            toolProps: { placeholder: "no of rows", max: 1000, min: 1 },
                            value: 3,
                            onChange: (value) => {
                                this.setAttrValue("gridConfig.noOfRows", value)

                                const gridWeights = this.getAttrValue("gridConfig.rowWeights") 

                                let gridTemplateRows = `repeat(${value}, max-content)`

                                if (gridWeights){
                                    gridTemplateRows = Array.from({ length: value }, (_, i) =>
                                        `${gridWeights[i + 1]}fr` || "max-content"
                                    ).join(" ") // creates "max-content max-content 1fr 3fr" depending on value
                                }

                                this.updateState((prev) => ({
                                    widgetInnerStyling: {
                                        ...prev.widgetInnerStyling,
                                    gridTemplateRows: gridTemplateRows
                                    }
                                }))
                            }
                        },
                        noOfCols: {
                            label: "No of cols",
                            tool: Tools.NUMBER_INPUT, 
                            toolProps: { placeholder: "no of cols", max: 1000, min: 1 },
                            value: 3,
                            onChange: (value) => {
                                this.setAttrValue("gridConfig.noOfCols", value)

                                this.updateState((prev) => ({
                                    widgetInnerStyling: {
                                        ...prev.widgetInnerStyling,
                                        gridTemplateColumns: `repeat(${value}, max-content)`
                                    }
                                }))
                            }
                        },    
                        
                    },
                    gridWeights: {
                        label: "Grid weights",
                        display: "vertical",
                        rowWeights: {
                            label: "Row weights",
                            tool: Tools.CUSTOM,
                            toolProps: { 
                                        // placeholder: "weight", 
                                        // defaultWeightMapping: this.getAttrValue("gridWeights.rowWeights"),
                                     },
                            value: undefined,
                            Component: DynamicGridWeightInput, 
                            onChange: (value) => {

                                if (!value) return


                                this.setAttrValue("gridWeights.rowWeights", value)
                                
                                const noOfRows = this.getAttrValue("gridConfig.noOfRows")


                                const gridTemplateRows = Array.from({ length: noOfRows }, (_, i) => {
                                    const row = value[i] // Get the row object
                                    return row ? `${row.weight}fr` : "max-content"; // Use weight if available
                                }).join(" ") // creates "max-content max-content 1fr 3fr" depending on value


                                this.setWidgetInnerStyle("gridTemplateRows", gridTemplateRows)
                            }
                        },
                        colWeights: {
                            label: "Column weights",
                            tool: Tools.CUSTOM,
                            toolProps: { 
                                        // placeholder: "weight", 
                                        // defaultWeightMapping: {0: {weight: 0, gridNo: 0}}
                                     },
                            value: undefined,
                            Component: DynamicGridWeightInput, 
                            onChange: (value) => {

                                if (!value) return

                                this.setAttrValue("gridWeights.colWeights", value)
                                
                                const noOfCols = this.getAttrValue("gridConfig.noOfCols")


                                const gridTemplateCol = Array.from({ length: noOfCols }, (_, i) => {
                                    const col = value[i] // Get the row object
                                    return col ? `${col.weight}fr` : "max-content"; // Use weight if available
                                }).join(" ") // creates "max-content max-content 1fr 3fr" depending on value


                                this.setWidgetInnerStyle("gridTemplateColumns", gridTemplateCol)
                                // this.setW

                            }
                        }
                    }
                    
                }
            }
            this.updateState((prevState) => ({...prevState, ...updates}))

        }else if (layout === Layouts.FLEX){
            const {gridConfig, gridWeights, ...restAttrs} =  this.state.attrs
            
            console.log("Flex: ", restAttrs)
         
            this.updateState((prevState) => ({attrs: {...restAttrs}}))
        }

        this.props.onLayoutUpdate({parentId: this.__id, parentLayout: value})// inform children about the layout update
        this.setAttrValue("layout", value)

        this.updateState((prev) => ({
            widgetInnerStyling: {
                ...prev.widgetInnerStyling,
                display: layout !== Layouts.PLACE ? (layout === "grid" ? "grid" : "flex" ) : "block",
                flexDirection: "column",
                // flexDirection: direction,
                gap: `${gap}px`,
                gridTemplateColumns: "repeat(3, max-content)",
                gridTemplateRows: "repeat(3, max-content)",
                // gridTemplateColumns: "repeat(auto-fill, minmax(100px, auto))",
                // gridTemplateRows: "repeat(auto-fill, minmax(100px, auto))",  
            }
        }))

        
    }

    getInnerRenderStyling(){
        let {width, height, minWidth, minHeight} = this.getRenderSize()
        
        const {layout: parentLayout, direction, gap} = this.getParentLayout() || {}

        
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

        const {layout: parentLayout} = (this.getParentLayout() || {})

        if (fillX){
            width = "100%"
        }

        if (fillY){
            height = "100%"
        }

        if (parentLayout && parentLayout === Layouts.GRID){
            const sticky = this.getAttrValue("gridManager.sticky")

            if (sticky === GRID_STICKY.NEWS){
                width = "100%"
                height = "100%"
            }else if (sticky === GRID_STICKY.WE){
                width = "100%"
            }else if (sticky === GRID_STICKY.NS){
                height = "100%"
            }
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

            // FIXME: when changing layouts all the widgets are being selected
            if (selected){
                this.select()
            } 
        })  



    }

}


// base for widgets that have common base properties such as bg, fg, cursor etc
export class CustomTkWidgetBase extends CustomTkBase{

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
                    borderColor: {
                        label: "Border Color",
                        tool: Tools.COLOR_PICKER, 
                        value: "#000",
                        onChange: (value) => {
                            this.setWidgetInnerStyle("borderColor", value)
                            this.setAttrValue("styling.borderColor", value)
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
                    borderRadius: {
                        label: "Border radius",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: 0,
                        onChange: (value) => {
                            this.setWidgetInnerStyle("borderRadius", `${value}px`)
                            this.setAttrValue("styling.borderRadius", value)
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
                        toolProps: {min: 1, max: 140},
                        value: null,
                        onChange: (value) => {
                            // this.setWidgetInnerStyle("paddingLeft", `${value}px`)
                            // this.setWidgetInnerStyle("paddingRight", `${value}px`)

                            const widgetStyle = {
                                ...this.state.widgetInnerStyling,
                                paddingLeft: `${value}px`,
                                paddingRight: `${value}px`
                            }
                            this.setState({

                                widgetInnerStyling: widgetStyle
                            })


                            this.setAttrValue("padding.padX", value)
                        }
                    },
                    padY: {
                        label: "Pad Y",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 1, max: 140},
                        value: null,
                        onChange: (value) => {
                            const widgetStyle = {
                                ...this.state.widgetInnerStyling,
                                paddingTop: `${value}px`,
                                paddingBottom: `${value}px`
                            }
                            this.setState({

                                widgetInnerStyling: widgetStyle
                            })
                            this.setAttrValue("padding.padY", value)
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


                            this.updateState((prev) => ({
                                widgetOuterStyling: {
                                    ...prev.widgetOuterStyling,
                                    marginLeft: `${value}px`,
                                    marginRight: `${value}px`
                                },
                            }))
                            this.setAttrValue("margin.marginX", value)
                        }
                    },
                    marginY: {
                        label: "Margin Y",
                        tool: Tools.NUMBER_INPUT,
                        toolProps: {min: 0, max: 140},
                        value: null,
                        onChange: (value) => {

                            this.updateState((prev) => ({
                                widgetOuterStyling: {
                                    ...prev.widgetOuterStyling,
                                    marginTop: `${value}px`,
                                    marginBottom: `${value}px`
                                },
                            }))

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
            fg_color: `"${this.getAttrValue("styling.backgroundColor")}"`,
        }

        if (this.getAttrValue("styling.foregroundColor")){
            config["text_color"] = `"${this.getAttrValue("styling.foregroundColor")}"`
        }

        if (this.getAttrValue("styling.borderRadius")){
            config["corner_radius"] = this.getAttrValue("styling.borderRadius")
        }

        if (this.getAttrValue("styling.borderColor")){
            config["border_color"] = `"${this.getAttrValue("styling.borderColor")}"`
        }


        if (this.getAttrValue("styling.borderWidth"))
            config["border_width"] = this.getAttrValue("styling.borderWidth")

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