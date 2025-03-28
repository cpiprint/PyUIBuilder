import Widget from "../../../canvas/widgets/base"
import Tools from "../../../canvas/constants/tools"
import { CustomTkBase } from "./base"
import { getPythonAssetPath } from "../../utils/pythonFilePath"


class MainWindow extends CustomTkBase{

    static widgetType = "main_window"
    static displayName = "Main Window"


    static initialSize = {
        width: 700,
        height: 400
    }


    constructor(props) {
        super(props)

        this.droppableTags = {
            exclude: ["image", "video", "media", "main_window", "toplevel"]
        }

        this.state = {
            ...this.state,
            size: { width: 700, height: 400 },
            widgetName: "main",
            attrs: {
                ...this.state.attrs,
                title: {
                    label: "Window Title",
                    tool: Tools.INPUT, // the tool to display, can be either HTML ELement or a constant string
                    toolProps: {placeholder: "Window title", maxLength: 40}, 
                    value: "Main Window",
                    onChange: (value) => this.setAttrValue("title", value)
                },
                logo: {
                    label: "Window Logo",
                    tool: Tools.UPLOADED_LIST, 
                    toolProps: {filterOptions: ["image/jpg", "image/jpeg", "image/png"]}, 
                    value: "",
                    onChange: (value) => this.setAttrValue("logo", value)
                }

            }
        }

    }

    componentDidMount(){
        this.setAttrValue("styling.backgroundColor", "#23272D")
        super.componentDidMount()
        // this.setWidgetName("main") // Don't do this as this will cause conflicts while loading names
    }

    generateCode(variableName, parent){

        const backgroundColor = this.getAttrValue("styling.backgroundColor")
        const logo = this.getAttrValue("logo")

        const {width, height} = this.getSize()

        const code = [
            `${variableName} = ctk.CTk()`,
            `${variableName}.configure(fg_color="${backgroundColor}")`,
            `${variableName}.title("${this.getAttrValue("title")}")`, 
            `${variableName}.geometry("${width}x${height}")`,
            ...this.getGridLayoutConfigurationCode(variableName)
        ]

        if (logo?.name){
            
            // code.push(`\n`)
            code.push(`${variableName}_img = Image.open(${getPythonAssetPath(logo.name, "image")})`)
            code.push(`${variableName}_img = ImageTk.PhotoImage(${variableName}_img)`)
            code.push(`${variableName}.iconphoto(False, ${variableName}_img)`)
            // code.push("\n")
        }

        return code
    }

    getImports(){
        const imports = super.getImports()
        
        if (this.getAttrValue("logo"))
            imports.push("import os", "from PIL import Image, ImageTk", )

        return imports
    }


    getRequirements(){
        const requirements = super.getRequirements()

        
        if (this.getAttrValue("logo"))
            requirements.push("pillow")

        return requirements
    }

    getToolbarAttrs(){
        const toolBarAttrs = super.getToolbarAttrs()

        return ({
            id: this.__id,
            widgetName: toolBarAttrs.widgetName,
            title: this.state.attrs.title,
            logo: this.state.attrs.logo,
            size: toolBarAttrs.size,
            ...this.state.attrs,

        })
    }

    renderContent(){
        return (
            <div className="tw-w-flex tw-flex-col tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden">
                <div className="tw-flex tw-w-full tw-h-[25px] tw-bg-[#c7c7c7] tw-p-1
                                tw-overflow-hidden tw-shadow-xl tw-place-items-center">
                    <div className="tw-text-sm">{this.getAttrValue("title")}</div>
                    <div className="tw-ml-auto tw-flex tw-gap-1  tw-place-items-center">
                        <div className="tw-bg-yellow-400 tw-rounded-full tw-w-[15px] tw-h-[15px]">
                        </div>
                        <div className="tw-bg-blue-400 tw-rounded-full tw-w-[15px] tw-h-[15px]">
                        </div>
                        <div className="tw-bg-red-400 tw-rounded-full tw-w-[15px] tw-h-[15px]">
                        </div>
                    </div>
                </div>
                <div className="tw-p-2 tw-w-full tw-relative tw-h-full tw-overflow-hidden tw-content-start" 
                        ref={this.styleAreaRef}
                        style={this.state.widgetInnerStyling}>
                    {this.renderTkinterLayout()}
                </div>
            </div>
        )
    }

}


export default MainWindow