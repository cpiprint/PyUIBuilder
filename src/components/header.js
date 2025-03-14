import { useEffect, useState } from "react"

import { Select, Input, Button } from "antd"
import { CrownFilled, DownloadOutlined, DownOutlined, PlayCircleFilled, VideoCameraOutlined } from "@ant-design/icons"
import FrameWorks from "../constants/frameworks"
import Premium from "../sidebar/utils/premium"
import VideoPopUp from "./video-popup"


const items = [
    {
        value: FrameWorks.TKINTER,
        label: 'tkinter',
    },
    {
        value: FrameWorks.CUSTOMTK,
        label: 'customtk',
    },
]


function Header({projectName, onProjectNameChange, framework, onFrameworkChange,
                 onExportClick, className=''}){


    return (
        <div className={`tw-w-full tw-bg-primaryBg tw-p-2 tw-flex tw-place-items-center
                             ${className||''}`}>

            <div className="tw-flex tw-gap-2 tw-place-content-center">
                <Select
                    // defaultValue={framework}
                    value={framework}
                    options={items}
                    // onSelect={(key) => {console.log("value: ", key); onFrameworkChange(key); }}
                    onChange={(key) => {onFrameworkChange(key)}}
                    className="tw-min-w-[150px]"
                />
                <VideoPopUp>
                    <div className="tw-p-1 tw-w-full tw-outline-none tw-bg-transparent tw-border-[1px] 
                                            tw-border-gray-400 tw-rounded-md tw-no-underline tw-border-solid hover:tw-bg-[#9333EA]
                                            hover:tw-text-white tw-duration-200 tw-flex tw-gap-1
                                            tw-text-black tw-text-center tw-px-4 tw-text-sm tw-cursor-pointer">
                        Watch demo
                        <PlayCircleFilled className="tw-text-lg"/>
                    </div>
                </VideoPopUp>
            </div>
            <div className="tw-ml-auto tw-flex tw-gap-2 tw-place-content-center">
                <button data-tally-open="mVDY7N" data-tally-layout="modal" data-tally-emoji-text="👋" 
                    data-tally-emoji-animation="wave" className="tw-p-1 tw-w-full tw-outline-none tw-bg-transparent tw-border-[1px] 
                                    tw-border-gray-400 tw-rounded-md tw-no-underline tw-border-solid hover:tw-bg-[#9333EA]
                                    hover:tw-text-white tw-duration-200
                                    tw-text-black tw-text-center tw-px-4 tw-text-sm tw-cursor-pointer">
                                        Join Waitlist
                </button>
                <Premium className="tw-text-2xl tw-bg-purple-600 tw-text-center 
                                    tw-w-[40px] tw-min-w-[40px] tw-h-[35px] tw-rounded-md 
                                    tw-cursor-pointer tw-text-white 
                                    tw-transition-all
                                    hover:tw-scale-[1.2]">
                        <CrownFilled />
                </Premium>
                <Input value={projectName} onChange={(e) => onProjectNameChange(e.target.value)} placeholder="project name"/>
                <Button icon={<DownloadOutlined />} onClick={onExportClick}>
                    Export code
                </Button>
            </div>

        </div>
    )

} 

export default Header