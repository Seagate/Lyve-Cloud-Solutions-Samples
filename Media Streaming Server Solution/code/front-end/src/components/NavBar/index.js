import React, { useState } from 'react';
import UploadModal from '../UploadModal';
import './styles.scss';

export default function NavBar({ triggerVideoFetch }) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const toggleShowUploadModal = () => {
    triggerVideoFetch();
    setShowUploadModal(!showUploadModal);
  };
  return (
    <div className="nav-bar-wrapper">
      <h1>Water Cooler</h1>
      <button
        onClick={() => {
          setShowUploadModal(true);
        }}
      >
        Upload
      </button>
      <UploadModal isOpen={showUploadModal} toggle={toggleShowUploadModal} />
    </div>
  );
}
