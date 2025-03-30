import { Layouts } from "../../../canvas/constants/layouts"
import Tools from "../../../canvas/constants/tools"
import Widget from "../../../canvas/widgets/base"
import { CustomTkBase } from "./base"


class Frame extends CustomTkBase{

    static widgetType = "frame"
    static displayName = "Frame"

    constructor(props) {
        super(props)

        this.droppableTags = {
            exclude: ["image", "video", "media", "toplevel", "main_window"]
        }

        this.state = {
            ...this.state,
            fitContent: {width: true, height: true},
            widgetName: "Frame",
            attrs: {
                ...this.state.attrs,
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
            }
        }

    }

    componentDidMount(){
        super.componentDidMount()
        this.setAttrValue("styling.backgroundColor", "#EDECEC")
    }

    getConfigCode(){
        const bg = this.getAttrValue("styling.backgroundColor")

        const fitWidth = this.state.fitContent.width
        const fitHeight = this.state.fitContent.height

        const {width, height} = this.getSize()

        const {layout} = this.getParentLayout()

        const config = {
            bg: `"${bg}"` 
        }

        if (layout !== Layouts.PLACE){
            if (!fitWidth){
                config['width'] = width
            }

            if (!fitHeight){
                config['height'] = height
            }
        }

        return config
    }


    generateCode(variableName, parent){

        const bg = this.getAttrValue("styling.backgroundColor")

        return [
                `${variableName} = ctk.CTkFrame(master=${parent})`,
                `${variableName}.configure(fg_color="${bg}")`,
                `${variableName}.${this.getLayoutCode()}`,
                ...this.getGridLayoutConfigurationCode(variableName)
            ]
    }

    getToolbarAttrs(){
        const {layout, gridConfig, gridWeights, ...toolBarAttrs} = super.getToolbarAttrs()

        // places layout at the end
        return ({
            id: this.__id,
            ...toolBarAttrs,
            padding: this.state.attrs.padding,
            margin: this.state.attrs.margin,
            layout,
            gridConfig,
            gridWeights
        })
    }
    
    renderContent(){
        // console.log("bounding rect: ", this.getBoundingRect())

        // console.log("widget styling: ", this.state.widgetInnerStyling)
        return (
            <div className="tw-w-flex tw-flex-col tw-w-full tw-h-full tw-relative tw-rounded-md tw-overflow-hidden">
                <div className="tw-p-2 tw-w-full tw-h-full tw-content-start" 
                        ref={this.styleAreaRef}
                        style={this.getInnerRenderStyling()}>
                    {this.renderTkinterLayout()}
                </div>
            </div>
        )
    }

}


export default Frame