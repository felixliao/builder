import React, { useCallback } from 'react'
import { Upload as UploadIcon } from 'lucide-react'
import RcUpload from 'rc-upload'
import type { UploadProps as RcUploadProps } from 'rc-upload'
// @ts-ignore
import useMergedState from 'rc-util/lib/hooks/useMergedState'
import { flushSync } from 'react-dom'

import { Toggle } from '../ui/toggle'
import { ImageFile, PDFFile } from './component'
import { RcFile, UploadChangeParam, UploadFile, UploadProps } from './type'
import {
  checkType,
  file2Obj,
  getFileItem,
  removeFileItem,
  updateFileList,
} from './utils'

export const LIST_IGNORE = `__LIST_IGNORE_${Date.now()}__`

const Upload = (props: UploadProps) => {
  const {
    fileList,
    defaultFileList,
    maxCount,
    onChange,
    onRemove,
    onDrop,
    accept,
    action = '',
    multiple = true,
    type = 'select',
    listType = 'pdf',
    showUploadList = true,
    data,
    disabled: mergedDisabled,
    customRequest,
  } = props
  const [mergedFileList, setMergedFileList] = useMergedState(
    defaultFileList || [],
    {
      value: fileList,
      postState: (list: UploadFile[]) => list ?? [],
    }
  )

  const [dragState, setDragState] = React.useState<string>('drop')
  const upload = React.useRef<RcUpload>(null)

  React.useMemo(() => {
    const timestamp = Date.now()

    ;(fileList || []).forEach((file: UploadFile, index: number) => {
      if (!file.uid && !Object.isFrozen(file)) {
        file.uid = `__AUTO__${timestamp}_${index}__`
      }
    })
  }, [fileList])

  const onInternalChange = useCallback(
    (
      file: UploadFile,
      changedFileList: UploadFile[],
      event?: { percent: number }
    ) => {
      let cloneList = [...changedFileList]

      // Cut to match count
      if (maxCount === 1) {
        cloneList = cloneList.slice(-1)
      } else if (maxCount) {
        cloneList = cloneList.slice(0, maxCount)
      }

      // Prevent React18 auto batch since input[upload] trigger process at same time
      // which makes fileList closure problem
      flushSync(() => {
        setMergedFileList(cloneList)
      })

      const changeInfo: UploadChangeParam<UploadFile> = {
        file: file as UploadFile,
        fileList: cloneList,
      }

      if (event) {
        changeInfo.event = event
      }

      flushSync(() => {
        onChange?.(changeInfo)
      })
    },
    [maxCount, onChange, setMergedFileList]
  )

  const mergedBeforeUpload = async (file: RcFile, fileListArgs: RcFile[]) => {
    const { beforeUpload } = props

    let parsedFile: File | Blob | string = file
    if (beforeUpload) {
      const result = await beforeUpload(file, fileListArgs)

      if (result === false) {
        return false
      }

      // Hack for LIST_IGNORE, we add additional info to remove from the list
      delete (file as any)[LIST_IGNORE]
      if ((result as any) === LIST_IGNORE) {
        Object.defineProperty(file, LIST_IGNORE, {
          value: true,
          configurable: true,
        })
        return false
      }

      if (typeof result === 'object' && result) {
        parsedFile = result as File
      }
    }

    // if (transformFile) {
    //   parsedFile = await transformFile(parsedFile as any)
    // }

    return parsedFile as RcFile
  }

  const onBatchStart: RcUploadProps['onBatchStart'] = (batchFileInfoList) => {
    // Skip file which marked as `LIST_IGNORE`, these file will not add to file list
    const filteredFileInfoList = batchFileInfoList.filter(
      (info) => !(info.file as any)[LIST_IGNORE]
    )

    // Nothing to do since no file need upload
    if (!filteredFileInfoList.length) {
      return
    }

    const objectFileList = filteredFileInfoList.map((info) =>
      file2Obj(info.file as RcFile)
    )

    // Concat new files with prev files
    let newFileList = [...mergedFileList]

    objectFileList.forEach((fileObj) => {
      // Replace file if exist
      newFileList = updateFileList(fileObj, newFileList)
    })

    objectFileList.forEach((fileObj, index) => {
      // Repeat trigger `onChange` event for compatible
      let triggerFileObj: UploadFile = fileObj

      if (!filteredFileInfoList[index].parsedFile) {
        // `beforeUpload` return false
        const { originFileObj } = fileObj
        let clone

        try {
          clone = new File([originFileObj], originFileObj.name, {
            type: originFileObj.type,
          }) as any as UploadFile
        } catch (e) {
          clone = new Blob([originFileObj], {
            type: originFileObj.type,
          }) as any as UploadFile
          clone.name = originFileObj.name
          clone.lastModifiedDate = new Date()
          clone.lastModified = new Date().getTime()
        }

        clone.uid = fileObj.uid
        triggerFileObj = clone
      } else {
        // Inject `uploading` status
        fileObj.status = 'uploading'
      }

      onInternalChange(triggerFileObj, newFileList)
    })
  }

  const onSuccess = (response: any, file: RcFile, xhr: any) => {
    try {
      if (typeof response === 'string') {
        response = JSON.parse(response)
      }
    } catch (e) {
      /* do nothing */
    }

    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.status = 'done'
    targetItem.percent = 100
    targetItem.response = response
    targetItem.xhr = xhr

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList)
  }

  const onError = (error: Error, response: any, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.error = error
    targetItem.response = response
    targetItem.status = 'error'

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList)
  }

  const onProgress = (e: { percent: number }, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.status = 'uploading'
    targetItem.percent = e.percent

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList, e)
  }

  const handleRemove = useCallback(
    (file: UploadFile) => {
      let currentFile: UploadFile
      Promise.resolve(
        typeof onRemove === 'function' ? onRemove(file) : onRemove
      ).then((ret) => {
        // Prevent removing file
        if (ret === false) {
          return
        }

        const removedFileList = removeFileItem(file, mergedFileList)

        if (removedFileList) {
          currentFile = { ...file, status: 'removed' }
          mergedFileList?.forEach((item: UploadFile) => {
            const matchKey = currentFile.uid !== undefined ? 'uid' : 'name'
            if (
              item[matchKey] === currentFile[matchKey] &&
              !Object.isFrozen(item)
            ) {
              item.status = 'removed'
            }
          })
          upload.current?.abort(currentFile as RcFile)
          onInternalChange(currentFile, removedFileList)
        }
      })
    },
    [mergedFileList, onInternalChange, onRemove]
  )

  const onFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDragState(e.type)

    if (e.type === 'drop') {
      onDrop?.(e)
    }
  }

  const donwload = (file: UploadFile) => {
    if (props?.onDownload) {
      props?.onDownload(file)
    } else {
      fetch(`${file?.url}`, {
        method: 'GET',
      })
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const fileLink = document.createElement('a')
          fileLink.href = url
          fileLink.download = `${name}`
          document.body.appendChild(fileLink)
          fileLink.click()
          fileLink.remove()
        })
        .catch(console.error)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rcUploadProps = {
    onBatchStart,
    onError,
    onProgress,
    onSuccess,
    ...props,
    data,
    multiple,
    action,
    accept,
    disabled: mergedDisabled,
    onChange: undefined,
    customRequest,
    beforeUpload: mergedBeforeUpload,
  } as RcUploadProps

  delete rcUploadProps.className
  delete rcUploadProps.style

  // Remove id to avoid open by label when trigger is hidden
  // !children: https://github.com/ant-design/ant-design/issues/14298
  // disabled: https://github.com/ant-design/ant-design/issues/16478
  //           https://github.com/ant-design/ant-design/issues/24197
  if (!props?.children || mergedDisabled) {
    delete rcUploadProps.id
  }

  const selectDefaultButton = useCallback(() => {
    if (listType === 'pdf') {
      return (
        <Toggle className="flex cursor-pointer flex-row rounded-md bg-[#0F172A] px-4 py-2 text-sm text-white">
          <UploadIcon size={16} strokeWidth={3} />
          <span className="pl-2">Upload File</span>
        </Toggle>
      )
    } else {
      return (
        <Toggle className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <UploadIcon size={28} strokeWidth={2} />
        </Toggle>
      )
    }
  }, [listType])
  const defaultButton = useCallback(() => {
    // 上传按钮的默认样式
    if (type === 'drag') {
      return (
        <div
          className="
          borer-[#919eab] opcity-[0.32] rounded-md bg-[#f4f6f8] p-10 transition delay-150 ease-in-out hover:bg-slate-50 hover:p-12"
        >
          Upload Files
          <div>
            Drag and drop your PDF here or <span>Browse.</span>
          </div>
        </div>
      )
    }
    return selectDefaultButton()
  }, [selectDefaultButton, type])

  const showUploadIcon = useCallback(() => {
    const notShow = listType === 'image' && mergedFileList?.length !== 0
    const file = mergedFileList?.[0]
    return notShow ? (
      <ImageFile
        file={file}
        // @ts-ignore
        onRemove={handleRemove}
        className="h-16 w-16"
        showUploadList={showUploadList}
      />
    ) : (
      <RcUpload {...rcUploadProps} ref={upload}>
        {props?.children || defaultButton()}
      </RcUpload>
    )
  }, [
    listType,
    mergedFileList,
    handleRemove,
    props,
    rcUploadProps,
    defaultButton,
    showUploadList,
  ])

  return (
    <div className="upload-wraper p-8">
      <div className={` flex flex-col gap-4`} onClick={onFileDrop}>
        {showUploadIcon()}
        <div
          className={`
          flex gap-2 ${
            listType === 'images-list'
              ? ' w-full flex-row flex-wrap'
              : 'flex-col'
          }`}
        >
          {listType !== 'image' &&
            mergedFileList?.map((file: UploadFile) => {
              const type = checkType(file)
              return type === 'isPDF' ? (
                <PDFFile
                  file={file}
                  onDownload={donwload}
                  //@ts-ignore
                  onRemove={handleRemove}
                  showUploadList={showUploadList}
                  {...props}
                  key={file?.uid || file?.url}
                />
              ) : (
                <ImageFile
                  file={file}
                  {...props}
                  showUploadList={showUploadList}
                  key={file?.uid || file?.url}
                  onRemove={handleRemove}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default Upload
