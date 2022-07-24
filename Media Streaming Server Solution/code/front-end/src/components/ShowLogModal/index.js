import React, { useEffect, useState } from 'react';
import { Modal } from 'reactstrap';
import config from '../../configs';
import { callApi } from '../../functions';
import './styles.scss';

export default function ShowLogModal(props) {
  const { toggle, isOpen, name } = props;
  const [log, setLog] = useState(null);
  useEffect(() => {
    fetchLog();
  }, []);
  const fetchLog = async () => {
    console.log(name);
    const log = await callApi({
      url: `/logs/${name}`,
      mehod: 'GET',
      data: { key: name },
      authenticaed: false,
    });
    setLog(log);
  };
  return (
    <Modal isOpen={isOpen} toggl={toggle} className="video-play-modal">
      <div>
        <p>
          Time Stamp : <span>{name}</span>
        </p>
        {log && (
          <>
            <p>
              Type : <span>{log.type}</span>
            </p>
            <p>
              Message : <span>{log.message}</span>
            </p>
          </>
        )}
      </div>

      <div className="button-wrapper">
        <button className="cancel-button" onClick={toggle}>
          Close
        </button>
      </div>
    </Modal>
  );
}
