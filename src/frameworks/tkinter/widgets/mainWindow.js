import Widget from "../../../canvas/widgets/base"
import Tools from "../../../canvas/constants/tools"
import { TkinterBase } from "./base"
import { removeKeyFromObject } from "../../../utils/common"


class MainWindow extends TkinterBase{

    static widgetType = "main_window"
    static displayName = "Main Window"

    constructor(props) {
        super(props)

        this.droppableTags = {
            exclude: ["image", "video", "media", "main_window", "toplevel"]
        }

        const newAttrs = removeKeyFromObject("margin", this.state.attrs)

        this.state = {
            ...this.state,
            size: { width: 700, height: 400 },
            widgetName: "main",
            attrs: {
                ...newAttrs,
                title: {
                    label: "Window Title",
                    tool: Tools.INPUT, // the tool to display, can be either HTML ELement or a constant string
                    toolProps: {placeholder: "Window title", maxLength: 40}, 
                    value: "Main Window",
                    onChange: (value) => this.setAttrValue("title", value)
                }

            }
        }

    }

    // componentDidMount(){

    //     super.componentDidMount()

    //     //this.setAttrValue("styling", { backgroundColor: "#E4E2E2" }) refactor to something like this?
    //     this.setAttrValue("styling.backgroundColor", "#E4E2E2")
    //     console.log("mounted: ", this.state)
    // }

    componentDidMount(){
        // this.setAttrValue("styling.backgroundColor", "#E4E2E2")
        super.componentDidMount()
    }

    generateCode(variableName, parent){

        const backgroundColor = this.getAttrValue("styling.backgroundColor")

        return [
                `${variableName} = tk.Tk()`,
                `${variableName}.config(bg="${backgroundColor}")`,
                `${variableName}.title("${this.getAttrValue("title")}")`
            ]
    }

    getToolbarAttrs(){
        const toolBarAttrs = super.getToolbarAttrs()

        return ({
            id: this.__id,
            widgetName: toolBarAttrs.widgetName,
            title: this.state.attrs.title,
            size: toolBarAttrs.size,

            ...this.state.attrs,

        })
    }

    renderContent(){
        console.log("inner style: ", this.getInnerRenderStyling())
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
                        style={{...this.getInnerRenderStyling(), width: "100%", height: "calc(100% - 25px)"}}>
                    {/* {this.props.children} */}
                    {this.renderTkinterLayout()} {/* This is required for pack layouts, so if your widget accepts child widgets, ensure to add this */}
                </div>
            </div>
        )
    }

}


export default MainWindow