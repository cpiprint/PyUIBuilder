import React, { useEffect, useState, useRef } from "react"
import { Input, Button, Space, Radio, InputNumber } from "antd"
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons'


export const SearchComponent = ({ onSearch, searchValue, onClear, ...props }) => {
    const inputRef = useRef(null) 

    const handleOuterDivClick = () => {
        inputRef.current.focus()
    }

    return (
        <div className="tw-flex tw-gap-2 input tw-place-items-center" onClick={handleOuterDivClick}>
            <SearchOutlined />
            <input 
                type="text" 
                placeholder="Search" 
                className="tw-outline-none tw-w-full tw-border-none" 
                id="" 
                onInput={onSearch} 
                value={searchValue} 
                ref={inputRef} // Attach the ref to the input
                {...props}
            />
            <div className="">
                {
                    searchValue.length > 0 && 
                    <div className="tw-cursor-pointer tw-text-gray-500" 
                                onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        
                                        if (onClear)
                                            onClear()
                                    }}>
                        <CloseCircleFilled />
                    </div>
                }
            </div>
        </div>
    )
}





export const DynamicInputList = () => {
    const [inputs, setInputs] = useState([""])  // Initialize with one input

    const addInput = () => {
        setInputs([...inputs, ""])
    }

    const removeInput = (index) => {
        setInputs(inputs.filter((_, i) => i !== index))
    }

    const handleInputChange = (value, index) => {
        const newInputs = [...inputs]
        newInputs[index] = value
        setInputs(newInputs)
    }

    return (
        <div>
            {inputs.map((input, index) => (
                <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Input
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value, index)}
                        placeholder={`Input ${index + 1}`}
                    />
                    {index !== 0 && (  // Do not show delete button for the first input
                        <MinusCircleOutlined onClick={() => removeInput(index)} />
                    )}
                </Space>
            ))}

            <Button type="dashed" onClick={addInput} icon={<PlusOutlined />}>
                Add Input
            </Button>
        </div>
    )
}


export const DynamicRadioInputList = React.memo(({defaultInputs=[""], defaultSelected=null, onChange}) => {
    const [inputs, setInputs] = useState([""])  // Initialize with one input
    const [selectedRadio, setSelectedRadio] = useState(null)  // Tracks selected radio button

    useEffect(() => {

        setInputs(defaultInputs)

    }, [defaultInputs])

    useEffect(() => {

        setSelectedRadio(defaultSelected)
    }, [defaultSelected])

    useEffect(() => {

        if(onChange){
            onChange({inputs, selectedRadio})
        }
        
    }, [selectedRadio, inputs])

    // Add a new input
    const addInput = () => {
        setInputs([...inputs, ""])
    }

    // Remove an input by index, but keep the first one
    const removeInput = (index) => {
        const newInputs = inputs.filter((_, i) => i !== index)
        setInputs(newInputs)

        // Adjust selected radio if necessary
        if (selectedRadio >= newInputs.length) {
            setSelectedRadio(newInputs.length - 1)
        }
    }

    // Update input value
    const handleInputChange = (value, index) => {
        const newInputs = [...inputs]
        newInputs[index] = value
        setInputs(newInputs)
    }

    // Handle radio button selection
    const handleRadioChange = (e) => {
        setSelectedRadio(e.target.value)
    }

    return (
        <div>
            <Radio.Group onChange={handleRadioChange} value={selectedRadio}>
                {inputs.map((input, index) => (
                    <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                        <Radio value={index} defaultChecked={ index === selectedRadio}/>
                        <Input
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value, index)}
                            placeholder={`Input ${index + 1}`}
                        />
                        
                        {index !== 0 && (  // Do not show delete button for the first input
                            <div>
                                <MinusCircleOutlined className="tw-text-xl tw-text-red-500" 
                                    onClick={() => removeInput(index)} />
                            </div>
                        )}
                    </Space>
                ))}
            </Radio.Group>

            <Button type="dashed" onClick={addInput} icon={<PlusOutlined />}>
                Add Input
            </Button>
        </div>
    )
})


/**
 * defaultWeightMapping structure: {0: {gridNo: 0, weight: 0}}
 */
export const DynamicGridWeightInput = React.memo(({value, onChange, gridInputProps, weightInputProps}) => {
    
    const [weightMapping, setWeightMapping] = useState(value)  // Initialize with one input

    useEffect(() => {
        setWeightMapping(value || {})
    }, [value])


    useEffect(() => {

        if(onChange){
            onChange(weightMapping)
        }
        
    }, [weightMapping])

    // Add a new input
    const addInput = () => {

        const newObjectIndex = Object.keys(weightMapping).length
        setWeightMapping({...weightMapping, [newObjectIndex]: {gridNo: 1, weight: 0}})
    }

    // Remove an input by index, but keep the first one
    const removeInput = (index) => {
        const newInputs = { ...weightMapping }; // Create a shallow copy
        delete newInputs[index]; // Remove the entry by key
        setWeightMapping(newInputs); // Update state
    }

    // Update input value
    const handleGridNoChange = (index, gridNo, weight) => {
        const newInputs = {...weightMapping}
        newInputs[index] = {
            weight,
            gridNo
        }
        setWeightMapping(newInputs)
    }


    return (
        <div>
            {weightMapping && Object.entries(weightMapping).map(([idx, {weight, gridNo}], index) => (
                <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="baseline">

                    <div className="tw-flex tw-flex-col tw-gap-2">
                        { index === 0 &&
                            <span>Grid no</span>
                        }
                        <InputNumber
                            value={gridNo}
                            min={1}
                            onChange={(value) => handleGridNoChange(idx, value, weight)}
                            placeholder={`Input ${index + 1}`}
                            {...gridInputProps}
                        />
                    </div>
                    <div className="tw-flex tw-flex-col tw-gap-2">
                        { index === 0 &&
                            <span>Weight</span>
                        }
                        <InputNumber
                            min={0}
                            value={weight}
                            onChange={(value) => handleGridNoChange(idx, gridNo, value)}
                            placeholder={`Input ${index + 1}`}
                            {...weightInputProps}
                        />
                    </div>
                    {/* {index !== 0 && (  // Do not show delete button for the first input */}
                        <div>
                            <MinusCircleOutlined className="tw-text-xl tw-text-red-500" 
                                onClick={() => removeInput(index)} />
                        </div>
                    {/* )} */}
                </Space>
            ))}

            <Button type="dashed" onClick={addInput} icon={<PlusOutlined />}>
                Add Weight
            </Button>
        </div>
    )
})