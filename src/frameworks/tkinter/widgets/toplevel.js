import Widget from "../../../canvas/widgets/base"
import Tools from "../../../canvas/constants/tools"
import { getPythonAssetPath } from "../../utils/pythonFilePath"
import { TkinterBase } from "./base"


class TopLevel extends TkinterBase{

    static widgetType = "toplevel"
    static displayName = "Top Level"


    constructor(props) {
        super(props)

        this.droppableTags = {
            exclude: ["image", "video", "media", "main_window", "toplevel"]
        }
        this.maxSize = { width: 2000, height: 2000 } // disables resizing above this number

        this.state = {
            ...this.state,
            size: { width: 450, height: 200 },
            widgetName: "top level",
            attrs: {
                ...this.state.attrs,
                title: {
                    label: "Window Title",
                    tool: Tools.INPUT, // the tool to display, can be either HTML ELement or a constant string
                    toolProps: {placeholder: "Window title", maxLength: 40}, 
                    value: "Top level",
                    onChange: (value) => this.setAttrValue("title", value)
                },
                logo: {
                    label: "Toplevel Logo",
                    tool: Tools.UPLOADED_LIST, 
                    toolProps: {filterOptions: ["image/jpg", "image/jpeg", "image/png"]}, 
                    value: "",
                    onChange: (value) => this.setAttrValue("logo", value)
                }

            }
        }
    }

    componentDidMount(){
        this.setAttrValue("styling.backgroundColor", "#E4E2E2")
        super.componentDidMount()
    }


    generateCode(variableName, parent){

        const backgroundColor = this.getAttrValue("styling.backgroundColor")

        const logo = this.getAttrValue("logo")

        const {width, height} = this.getSize()

        const code = [
            `${variableName} = tk.Toplevel(master=${parent})`,
            `${variableName}.config(bg="${backgroundColor}")`,
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
            widgetName: toolBarAttrs.widgetName,
            title: this.state.attrs.title,
            logo: this.state.attrs.logo,
            size: toolBarAttrs.size,
            ...this.state.attrs,

        })
    }

    renderContent(){
        const logo = this.getAttrValue("logo")

        return (
            <div className="tw-w-flex tw-flex-col tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden">
                <div className="tw-flex tw-w-full tw-h-[25px] tw-bg-[#c7c7c7] tw-p-1 tw-gap-1
                                tw-overflow-hidden tw-shadow-xl tw-place-items-center">
                    {
                        logo && (
                            <img src={logo.previewUrl} alt={logo.name} 
                                    className="tw-bg-contain tw-w-[15px] tw-h-[15px] tw-rounded-sm" />
                        )
                    }
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
                <div className="tw-p-2 tw-w-full tw-h-full tw-content-start"
                    ref={this.styleAreaRef}
                    style={this.state.widgetInnerStyling}>
                    {this.renderTkinterLayout()}
                </div>
            </div>
        )
    }

}


export default TopLevel