import { useEffect, useState } from "react"
import { Layouts } from "../../../canvas/constants/layouts"
import Tools from "../../../canvas/constants/tools"
import { convertObjectToKeyValueString } from "../../../utils/common"
import { getPythonAssetPath } from "../../utils/pythonFilePath"
import { ANCHOR } from "../constants/styling"
import { TkinterWidgetBase } from "./base"


class Label extends TkinterWidgetBase{

    static widgetType = "label"
    static displayName = "Label"

    // static requiredCustomPyFiles = ["imageLabel"]

    constructor(props) {
        super(props)


        this.state = {
            ...this.state,
            widgetName: "Label",
            size: { width: 80, height: 40 },
            attrs: {
                ...this.state.attrs,
                styling: {
                    ...this.state.attrs.styling,
                    anchor: {
                        label: "Text align",
                        tool: Tools.SELECT_DROPDOWN,
                        options: ANCHOR.map((val) => ({value: val, label: val})),
                        value: "",
                        onChange: (value) => {
                            
                            this.setAttrValue("styling.anchor", value)

                            this.setState((prevState) => ({
                                widgetInnerStyle: {
                                    ...prevState,
                                    ...this.getAnchorStyle(value)
                                }
                            }))
                        }
                    }
                },
                labelWidget: {
                    label: "Text",
                    tool: Tools.INPUT, 
                    toolProps: {placeholder: "text", maxLength: 100}, 
                    value: "Label",
                    onChange: (value) => this.setAttrValue("labelWidget", value)
                },
                imageUpload: {
                    label: "Image",
                    tool: Tools.UPLOADED_LIST, 
                    toolProps: {filterOptions: ["image/jpg", "image/jpeg", "image/png"]}, 
                    value: "",
                    onChange: (value) => this.setAttrValue("imageUpload", value)
                },
                imageSize: {
                    label: "Image size",
                    display: "horizontal",
                    // width: {
                    //     label: "Width",
                    //     tool: Tools.NUMBER_INPUT, // the tool to display, can be either HTML ELement or a constant string
                    //     toolProps: { placeholder: "width", max: 3000, min: 1 },
                    //     value: 150,
                    //     onChange: (value) => this.setWidgetSize(value, null)
                    // },
                    // height: {
                    //     label: "Height",
                    //     tool: Tools.NUMBER_INPUT,
                    //     toolProps: { placeholder: "height", max: 3000, min: 1  },
                    //     value: 150,
                    //     onChange: (value) => this.setWidgetSize(null, value)
                    // },
                    mode: {
                        label: "Image mode",
                        tool: Tools.SELECT_DROPDOWN,
                        options: ["fit", "cover"].map((val) => ({value: val, label: val})),
                        value: "cover",
                        onChange: (value) => {
                            
                            this.setAttrValue("imageSize.mode", value)
                        }
                    }
                },
            }
        }
        
    }

    componentDidMount(){
        super.componentDidMount()
        
        
        this.setAttrValue("styling.backgroundColor", "#E4E2E2")
        // this.setWidgetName("label") // Don't do this this causes issues while loading data

    }

    getImports(){
        const imports = super.getImports()
        
        if (this.getAttrValue("imageUpload"))
            imports.push("import os", "from PIL import Image, ImageTk", "from customWidgets.imageLabel import ImageLabel")

        return imports
    }

    getRequiredCustomPyFiles(){
        const requiredCustomFiles = super.getRequiredCustomPyFiles()
        
        if (this.getAttrValue("imageUpload"))
            requiredCustomFiles.push("imageLabel")

        return requiredCustomFiles
    }

    getRequirements(){
        const requirements = super.getRequirements()

        
        if (this.getAttrValue("imageUpload"))
            requirements.push("pillow")

        return requirements
    }

    getConfigCode(){
        const config = super.getConfigCode()

        const anchor = this.getAttrValue("styling.anchor")
        const fitWidth = this.state.fitContent.width
        const fitHeight = this.state.fitContent.height

        const {width, height} = this.getSize()

        const {layout} = this.getParentLayout()

        if (anchor)
            config['anchor'] = `"${anchor}"`

        // LABEL width and height are not pixel based instead its character based
        // if (layout !== Layouts.PLACE){
        //     if (!fitWidth){
        //         config['width'] = width
        //     }

        //     if (!fitHeight){
        //         config['height'] = height
        //     }
        // }


        return config
    }

    generateCode(variableName, parent){


        const labelText = this.getAttrValue("labelWidget")

        const config = convertObjectToKeyValueString(this.getConfigCode())
        const image = this.getAttrValue("imageUpload")

        let labelInitialization = `${variableName} = tk.Label(master=${parent}, text="${labelText}")`

        const code = []

        if (image?.name){
            // code.push(`${variableName}_img = Image.open(${getPythonAssetPath(image.name, "image")})`)
            // code.push(`${variableName}_img = ImageTk.PhotoImage(${variableName}_img)`)
            // code.push("\n")
            labelInitialization = `${variableName} = ImageLabel(master=${parent}, image_path=${getPythonAssetPath(image.name, "image")}, text="${labelText}", compound=tk.TOP, mode="${this.getAttrValue("imageSize.mode")}")`
        }

        // code.push("\n")
        code.push(labelInitialization)
        return [
                ...code,
                `${variableName}.config(${config})`,
                `${variableName}.${this.getLayoutCode()}`
            ]
    }


    getToolbarAttrs(){
        const toolBarAttrs = super.getToolbarAttrs()

        return ({
            id: this.__id,
            widgetName: toolBarAttrs.widgetName,
            labelWidget: this.state.attrs.labelWidget,
            size: toolBarAttrs.size,

            ...this.state.attrs,

        })
    }

    getAnchorStyle = (anchor) => {
        const anchorStyles = {
            n: { justifyContent: 'center', alignItems: 'flex-start' },
            s: { justifyContent: 'center', alignItems: 'flex-end' },
            e: { justifyContent: 'flex-end', alignItems: 'center' },
            w: { justifyContent: 'flex-start', alignItems: 'center' },
            ne: { justifyContent: 'flex-end', alignItems: 'flex-start' },
            se: { justifyContent: 'flex-end', alignItems: 'flex-end' },
            nw: { justifyContent: 'flex-start', alignItems: 'flex-start' },
            sw: { justifyContent: 'flex-start', alignItems: 'flex-end' },
            center: { justifyContent: 'center', alignItems: 'center' }
        }
      
        return anchorStyles[anchor] || anchorStyles["center"];
    }

    renderContent(){
        //FIXME: label image causing issues
        const image = this.getAttrValue("imageUpload")
        const imageMode = this.getAttrValue("imageSize.mode") || "cover"

        const imgClassName = imageMode === "fit" ? "tw-object-contain" : (imageMode === "cover" ? "tw-object-cover" : "")

        return (
            <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-content-start tw-h-full tw-rounded-md tw-overflow-hidden"
                    // style={{
                    //     flexGrow: 1, // Ensure the content grows to fill the parent
                    //     minWidth: '100%', // Force the width to 100% of the parent
                    //     minHeight: '100%', // Force the height to 100% of the parent
                    // }}
                >
                <div className="tw-p-2 tw-w-full tw-h-full tw-overflow-hidden tw-flex tw-place-content-center tw-place-items-center" 
                        ref={this.styleAreaRef}
                        style={this.getInnerRenderStyling()}>
                        {/* {this.props.children} */}
                        {
                            image ? (
                                <div className="tw-relative tw-w-full tw-h-full tw-overflow-hidden">
                                    <img src={image.previewUrl}
                                        className={`${imgClassName}`}
                                        alt={this.getAttrValue("widgetName")}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            position: "absolute",
                                            top: '0px',
                                            left: '0px',
                                          
                                        }}
                                        // className="tw-object-cover"
                                        />
                                </div> 
                            ) : null
                        }
                        <div className={`tw-flex ${!image ? "tw-w-full tw-h-full" : ""}`} style={{
                                color: this.getAttrValue("styling.foregroundColor"),
                                ...this.getAnchorStyle(this.getAttrValue("styling.anchor"))
                            }}>
                            {this.getAttrValue("labelWidget")}
                        </div>
                </div>
            </div>
        )
    }

}


function LabelImage({imageSrc, alt, styleAreaRef}){

    const [size, setSize] = useState({
        width: 0, 
        height: 0
    })

    useEffect(() => {
        if (!styleAreaRef.current) return;

        // Function to update size
        const updateSize = () => {
            const boundingBox = styleAreaRef.current.getBoundingClientRect();
            setSize({ width: boundingBox.width, height: boundingBox.height });
        };

        // Initial size update
        updateSize();

        // Observe size changes
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(styleAreaRef.current);

        return () => resizeObserver.disconnect();
    }, [styleAreaRef])

    return (
        <img src={imageSrc} alt={alt}  className="tw-object-cover"
            style={{
                position: "absolute",
                top: '0px',
                left: '0px',
                width: "100%", // Prevent overflow
                height: "100%", // Prevent overflow
            }}
            />
    )
}


export default Label