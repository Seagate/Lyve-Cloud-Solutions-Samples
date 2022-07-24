import React, { useRef, useState } from 'react';
import { Modal } from 'reactstrap';
import VideoUploader from '../VideoUploader';
import './styles.scss';

export default function UploadModal(props) {
  const { toggle, isOpen } = props;
  const videoUploader = useRef(() => {});
  const [loading, setLoading] = useState(false);
  return (
    <Modal isOpen={isOpen} toggl={toggle} className="upload-modal">
      <div>
        <h3>Upload Video</h3>
      </div>
      <VideoUploader
        uploadVideoTrigger={videoUploader}
        toggle={() => toggle()}
        toggleButtonLoading={(value) => setLoading(value)}
      />
      <div className="button-wrapper">
        <button className="cancel-button" onClick={toggle} disabled={loading}>
          Cancel
        </button>
        <button
          className="main-button"
          onClick={() => videoUploader.current()}
          disabled={loading}
        >
          Upload
        </button>
      </div>
    </Modal>
  );
}
