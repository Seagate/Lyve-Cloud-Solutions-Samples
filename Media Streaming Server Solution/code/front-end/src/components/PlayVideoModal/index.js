import React from 'react';
import { Modal } from 'reactstrap';
import config from '../../configs';
import './styles.scss';

export default function PlayVideoModal(props) {
  const { toggle, isOpen, name } = props;

  return (
    <Modal isOpen={isOpen} toggl={toggle} className="video-play-modal">
      <div>
        <h3>{name}</h3>
        <video
          src={`${config.ROOT_BACKEND_API}/videos/${name}`}
          autoPlay
          controls
        />
      </div>
      <div className="button-wrapper">
        <button className="cancel-button" onClick={toggle}>
          Close
        </button>
      </div>
    </Modal>
  );
}
