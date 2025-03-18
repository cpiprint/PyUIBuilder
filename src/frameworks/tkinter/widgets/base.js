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
        
        console.log("constructor 1: ", this.__id, this.state)

        this.state = {
            ...this.state,
            flexSide: "left"
        }

        this.getPackSide = this.getPackSide.bind(this)
        this.renderTkinterLayout = this.renderTkinterLayout.bind(this)
    }

    componentWillUnmount(){
        console.log("unmounting from child: ", this.state.attrs, this.serialize(), this.__id)
        super.componentWillUnmount()
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

            const config = {
                side: direction === "row" ? "tk.LEFT" : "tk.TOP",
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
            side: this.state.flexSide,
        })
    }

    getPackSide(){
        return this.state.flexSide
    }

    setParentLayout(layout){

        if (!layout){
            return {}
        } 
        super.setParentLayout(layout)

        const {layout: parentLayout, direction, gap} = layout

        // show attributes related to the layout manager
        let updates = {
            parentLayout: layout,
        }
        
        // this.removeAttr("gridManager")
        // this.removeAttr("flexManager")
        // this.removeAttr("positioning")

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
                            expand: {
                                label: "Expand",
                                tool: Tools.CHECK_BUTTON,
                                value: false,
                                onChange: (value) => {
                                    this.setAttrValue("flexManager.expand", value)
                                    
                                    const widgetStyle = {
                                        ...this.state.widgetOuterStyling,
                                        flexGrow: value ? 1 : 0,
                                    }
                                    this.updateState({
                                        widgetOuterStyling: widgetStyle,
                                    })
                                }
                            },

                            side: {
                                label: "Align Side",
                                tool: Tools.SELECT_DROPDOWN,
                                options: ["left", "right", "top", "bottom", ""].map(val => ({value: val, label: val})),
                                value: this.state.flexSide,
                                onChange: (value) => {
                                    console.log("call 0: ", value)
                                    // FIXME: force parent rerender because, here only child get rerendered, if only parent get rerendered the widget would move
                                    this.setAttrValue("flexManager.side", value, () => {
                                        this.updateState({flexSide: value}, () => {
                                            console.log("call")
                                            this.props.requestWidgetDataUpdate(this.__id)
                                            this.stateChangeSubscriberCallback()
                                            // console.log("force rendering: ", this.state.flexSide)
                                            // this.props.parentWidgetRef.current.forceRerender()
                                            // setTimeout(, 1)
                                        })
                                    })
                                    
                                    
                                    
                                    // this.props.parentWidgetRef.current.forceRerender()
                                    // console.log("updateing state: ", value, this.props.parentWidgetRef.current)
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

        console.log("updates: ", updates)
        
        // FIXME: updates are async causing huge problems

        // this.updateState(updates, () => {
        //     console.log("updated atters: ", this.state)
        // })

        console.log('setting paret layiout')
        this.updateState((prevState) => ({...prevState, ...updates}), () => {
            console.log("updated layout state: ", this.state.attrs)
        })


        return updates
    }

    renderTkinterLayout(){
        const {layout, direction, gap} = this.getLayout()
        console.log("rendering: ", layout, this.state)
        if (layout === Layouts.FLEX){
            return (
                <>
                    {(this.props.children.length > 0) && ["top", "bottom", "left", "right", "center"].map((pos) => {
                        
                        const filteredChildren = this.props.children.filter((item) => {
                            const widgetRef = item.ref?.current
                            if (!widgetRef) return false // Ensure ref exists before accessing

                            const packAttrs = widgetRef.getPackSide()// Cache value
                            console.log("pack attrs: ", widgetRef.getPackSide())
                            return packAttrs === pos
                        })
                        console.log("filtered children:", filteredChildren, pos)
                        return (
                            <div key={pos} style={this.getFlexLayoutStyle(pos)}>
                                {filteredChildren}
                            </div>
                        )
                    })}
                </>
            )
        }
        console.log("hell a")
        return (<>{this.props.children}</>)
    }

    getFlexLayoutStyle = (side) => {
        const rowStyle = {
            display: "flex",
            gap: "10px"
          }

        const columnStyle = {
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        }

        switch (side) {
            case "top":
                return { gridColumn: "1 / -1", alignSelf: "stretch", width: "100%", ...columnStyle };
            case "bottom":
                return { gridColumn: "1 / -1", alignSelf: "stretch", width: "100%", ...columnStyle };
            case "left":
                return { gridRow: "2", gridColumn: "1", justifySelf: "stretch", height: "100%", ...rowStyle };
            case "right":
                return { gridRow: "2", gridColumn: "3", justifySelf: "stretch", height: "100%", ...rowStyle };
            case "center":
                return { gridRow: "2", gridColumn: "2", alignSelf: "center", justifySelf: "center" };
            default:
                return {};
        }
        
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
            // display: layout !== Layouts.PLACE ? "grid" : "block",
            display: display,
            // flexDirection: direction,
            gap: `${gap}px`,
            // flexWrap: "wrap",
            gridTemplateColumns: layout === Layouts.FLEX ? "auto 1fr auto" : "repeat(auto-fill, minmax(100px, 1fr))",
            gridTemplateRows: layout === Layouts.FLEX ? "auto 1fr auto" : "repeat(auto-fill, minmax(100px, 1fr))",  
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


    // serialize(){
    //     const serializedValues = super.serialize()
    //     console.log("serialized values: ", serializedValues)
    //     return ({
    //         ...serializedValues,
    //         attrs: this.serializeAttrsValues()
    //     })
    // }


    serialize(){
        console.log("serialzied item: ", this.state.attrs, super.serialize(), this.__id, this.serializeAttrsValues())
        return ({
            ...super.serialize(),
            attrs: this.serializeAttrsValues(), // makes sure that functions are not serialized
            flexSide: this.state.flexSide
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

        console.log("data reloaded: ", data)


        const {attrs={}, selected, pos={x: 0, y: 0}, parentLayout=null, ...restData} = data

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
                console.log("selected again")
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