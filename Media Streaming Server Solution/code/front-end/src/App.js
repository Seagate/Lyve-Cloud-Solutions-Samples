import './App.css';
import NavBar from './components/NavBar';
// eslint-disable-next-line
import 'bootstrap/dist/css/bootstrap.css';
import React, { useEffect, useState } from 'react';
import { callApi } from './functions';
import { MdOutlineSlowMotionVideo } from 'react-icons/md';
import PlayVideoModal from './components/PlayVideoModal';
import videoThumb from './images/video-thumb.jpg';

function App() {
  const [showPlayVideoModal, setShowPlayVideoModal] = useState(null);
  const [triggerFetch, toggleTrigger] = useState(false);
  const toggleShowPlayVideoModal = () => {
    setShowPlayVideoModal(null);
  };
  const [_videos, setVideos] = useState([]);
  useEffect(() => {
    fetchVideos();
  }, [triggerFetch]);
  const fetchVideos = async () => {
    const videos = await callApi({
      url: '/videos',
      mehod: 'GET',
      data: {},
      authenticaed: false,
    });
    setVideos(videos);
  };

  return (
    <div className="App">
      <NavBar triggerVideoFetch={() => toggleTrigger(!triggerFetch)} />
      <div className="video-list">
        {_videos &&
          _videos.map((_video, key) => (
            <div
              className="video-item"
              key={key}
              onClick={() => setShowPlayVideoModal(_video.Key)}
            >
              <img src={videoThumb} alt="" />
              <div>
                <MdOutlineSlowMotionVideo className="video-icon" />
                <p className="video-name">{_video.Key}</p>
              </div>
            </div>
          ))}
      </div>

      {showPlayVideoModal && (
        <PlayVideoModal
          toggle={() => toggleShowPlayVideoModal()}
          isOpen={showPlayVideoModal}
          name={showPlayVideoModal}
        />
      )}
    </div>
  );
}

export default App;
