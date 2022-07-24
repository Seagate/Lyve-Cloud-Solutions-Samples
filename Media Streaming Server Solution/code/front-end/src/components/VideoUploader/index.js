/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './styles.scss';
import { BsUpload } from 'react-icons/bs';
import S3BucketUploader from '../../utils/s3BucketUploader';
import { MdDeleteOutline } from 'react-icons/md';
import { Progress } from 'reactstrap';

export default function VideoUploader(props) {
  let { uploadVideoTrigger, toggle, toggleButtonLoading } = props;
  const [newVideo, setNewVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedPrecentage, setPrecentage] = useState(0);
  useEffect(() => {
    uploadVideoTrigger.current = uploadVideo;
  }, [newVideo]);
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles[0]) {
      setNewVideo(acceptedFiles[0]);
    }
  }, []);
  const uploadVideo = useCallback(async () => {
    if (!loading) {
      setLoading(true);
      toggleButtonLoading(true);
      const imageKey = await S3BucketUploader({
        videoFile: newVideo,
        keyPrefix: '',
        callBack: (value) => setPrecentage(value),
      });
      if (imageKey) {
        // setLoading(false);
        toggleButtonLoading(false);
        // toggle();
      }
      return imageKey;
    }
  }, [newVideo]);
  const {
    // acceptedFiles,
    // fileRejections,
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    accept: 'video/mp4',
    multiple: false,
    onDrop,
  });

  return (
    <div className="video_uploader_wrapper">
      {newVideo && !loading && (
        <div className="uploaded-video">
          <button onClick={() => setNewVideo(null)}>
            <MdDeleteOutline />
          </button>
          <video src={URL.createObjectURL(newVideo)} autoPlay controls />
        </div>
      )}
      {!newVideo && !loading && (
        <div className="dropZone" {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Upload</p>
          ) : (
            <div className="upload">
              <BsUpload className="icon" />
              <p>Upload</p>
            </div>
          )}
        </div>
      )}
      {loading && <Progress value={completedPrecentage} />}
      {loading ? (
        completedPrecentage >= 100 ? (
          <p>Successfully Uploaded</p>
        ) : (
          <p>{completedPrecentage}%</p>
        )
      ) : (
        ''
      )}
    </div>
  );
}
