function howTo() {
  // DOM 요소들을 한 번만 선택
  const videos = document.querySelectorAll('.how-to-video-bx video');
  const controlBtns = document.querySelectorAll('.how-to-video-control-btn');
  
  // 유틸리티 함수들
  const progressUtils = {
    reset: (progressCircle) => {
      progressCircle.classList.remove('progress-active', 'progress-completed', 'progress-paused');
      progressCircle.classList.add('progress-reset');
    },
    
    start: (progressCircle) => {
      progressCircle.classList.remove('progress-reset', 'progress-paused');
      progressCircle.classList.add('progress-active');
    },
    
    pause: (progressCircle) => {
      progressCircle.classList.remove('progress-active');
      progressCircle.classList.add('progress-paused');
    },
    
    complete: (progressCircle) => {
      progressCircle.classList.remove('progress-active');
      progressCircle.classList.add('progress-completed');
    }
  };

  const buttonUtils = {
    setState: (btn, state, label) => {
      btn.classList.remove('play', 'pause', 'restart');
      btn.classList.add(state);
      btn.setAttribute('aria-label', label);
    }
  };

  const videoUtils = {
    playWithPromise: (video) => {
      const playPromise = video.play();
      return playPromise !== undefined ? playPromise : Promise.resolve();
    },
    
    setupDuration: (video, controlBtn) => {
      if (controlBtn && video.duration) {
        controlBtn.style.setProperty('--progress-duration', `${video.duration}s`);
      }
    }
  };

  // Swiper 초기화
  const howToVideoSlide = new Swiper(".how-to-video-slide", {
    slidesPerView: 1,
    spaceBetween: 16,
    speed: 700,
    slideToClickedSlide: true,
    centeredSlides: true,
    mousewheel: {
      forceToAxis: true,
    },
    pagination: {
      el: ".how-to-video-slide .swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".how-to-video-slide .swiper-button-next",
      prevEl: ".how-to-video-slide .swiper-button-prev",
    },
    breakpoints: {
      1441: {
        slidesPerView: "auto",
        spaceBetween: 24,
      },
      1921: {
        slidesPerView: "auto",
        spaceBetween: 24,
      }
    },
    on: {
      init: function() {
        let loadedCount = 0;
        
        videos.forEach((video, index) => {
          video.addEventListener('loadedmetadata', () => {
            loadedCount++;
            videoUtils.setupDuration(video, controlBtns[index]);
            
            // 모든 비디오가 로드되면 첫 번째 비디오 재생
            if (loadedCount === videos.length) {
              const activeIndex = this.activeIndex || 0;
              const activeVideo = videos[activeIndex];
              const activeProgressCircle = controlBtns[activeIndex]?.querySelector('.progress-circle-fill');
              
              if (activeVideo && activeProgressCircle) {
                videoUtils.playWithPromise(activeVideo)
                  .then(() => progressUtils.start(activeProgressCircle))
                  .catch(error => console.log('Auto-play prevented:', error));
              }
            }
          });
          
          video.addEventListener('error', (e) => console.error(`Video ${index + 1} load error:`, e));
          video.load();
        });
      },
      
      slideChange: function() {
        const activeIndex = this.activeIndex;
        
        // 모든 비디오 정지 및 progress 리셋
        videos.forEach((video, index) => {
          video.pause();
          video.currentTime = 0;
          
          const progressCircle = controlBtns[index]?.querySelector('.progress-circle-fill');
          if (progressCircle) {
            progressUtils.reset(progressCircle);
          }
        });
        
        // 현재 활성 비디오 재생
        const activeVideo = videos[activeIndex];
        const activeProgressCircle = controlBtns[activeIndex]?.querySelector('.progress-circle-fill');
        
        if (activeVideo && activeProgressCircle) {
          videoUtils.playWithPromise(activeVideo)
            .then(() => {
              setTimeout(() => progressUtils.start(activeProgressCircle), 50);
            })
            .catch(error => console.log('Auto-play prevented on slide change:', error));
        }
      }
    }
  });

  // 비디오 컨트롤 버튼 이벤트 설정
  controlBtns.forEach(btn => {
    const video = btn.closest('.how-to-video-bx').querySelector('video');
    const progressCircle = btn.querySelector('.progress-circle-fill');
    
    if (!video || !progressCircle) return;

    // 버튼 클릭 이벤트
    btn.addEventListener('click', () => {
      if (video.ended) {
        // Restart
        video.currentTime = 0;
        buttonUtils.setState(btn, 'pause', 'pause');
        progressUtils.reset(progressCircle);
        
        setTimeout(() => {
          progressUtils.start(progressCircle);
          video.play();
        }, 50);
        
      } else if (video.paused) {
        // Play
        video.play();
        buttonUtils.setState(btn, 'pause', 'pause');
        progressUtils.start(progressCircle);
        
      } else {
        // Pause
        video.pause();
        buttonUtils.setState(btn, 'play', 'play');
        progressUtils.pause(progressCircle);
      }
    });
    
    // 비디오 이벤트 리스너
    video.addEventListener('play', () => {
      buttonUtils.setState(btn, 'pause', 'pause');
    });
    
    video.addEventListener('pause', () => {
      if (!video.ended) {
        buttonUtils.setState(btn, 'play', 'play');
      }
    });
    
    video.addEventListener('ended', () => {
      buttonUtils.setState(btn, 'restart', 'restart');
      progressUtils.complete(progressCircle);
    });
  });
}

howTo();