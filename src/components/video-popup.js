import { Modal } from "antd"
import { useState } from "react"


const VideoPopUp = ({children, url}) => {

    const [popUpOpen, setPopUpOpen] = useState(false)


    const handleVideoOpen = () => {
        setPopUpOpen(true)
    }

    const handleVideoClose = (event) => {
        event.stopPropagation()

        setPopUpOpen(false)
    }

    return (
        <div onClick={handleVideoOpen} >
            {children}

            <Modal title={"demo"}  
                style={{ zIndex: 14000, gap: '5px', placeContent: "center", }}
                className="max-xl:tw-max-w-full max-lg:!tw-max-h-[450px]"
                styles={{body: {height: "80vh", width: "100%"}, content: {width: "100%",}}}
                onCancel={handleVideoClose}
                centered
                onOk={handleVideoClose}
                footer={null}
                width={'90%'}
                height={1000}
                open={popUpOpen}>
                <div className="tw-mt-5 tw-text-lg tw-min-w-[350px] tw-rounded-md tw-overflow-hidden tw-h-full  tw-w-full ">
                    <iframe  src="https://www.youtube.com/embed/Lp2-ToDlqSk?si=dpUpg5ZBdUS8EVOw" 
                        className="tw-w-full tw-h-full"
                        title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                    </iframe>
                </div>
            </Modal>

        </div>
    )
}

export default VideoPopUp