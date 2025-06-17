function influence() {
  let currentPlayingVideo = null; // 현재 재생 중인 비디오 추적
  let influenceSlide; // Swiper 인스턴스를 위한 변수를 상단에 선언
  
  // 디바이스별 간격 설정
  let extraPadding = 0;
  
  // 미디어 쿼리 설정
  const mediaQueries = {
    mobile: window.matchMedia("(max-width: 767px)"),
    tablet: window.matchMedia("(min-width: 768px) and (max-width: 1023px)"),
    desktop: window.matchMedia("(min-width: 1024px)")
  };
  
  // 디바이스별 간격 업데이트 함수
  function updateExtraPadding() {
    if (mediaQueries.mobile.matches) {
      extraPadding = 8; // 모바일 추가 간격
    } else if (mediaQueries.tablet.matches) {
      extraPadding = 8; // 태블릿 추가 간격
    } else {
      extraPadding = 16; // 데스크탑 추가 간격
    }
  }
  
  // 초기 간격 설정
  updateExtraPadding();
  
  // 활성화된 슬라이드의 bottom 값 업데이트 함수
  function updateActiveSlideBottom() {
    // influenceSlide가 초기화되지 않았으면 함수 실행 중단
    if (!influenceSlide || influenceSlide.activeIndex === undefined) return;
    
    const activeIndex = influenceSlide.activeIndex;
    
    // 모든 video-bx의 bottom 값 초기화
    document.querySelectorAll('.influence-video-bx').forEach(videoBx => {
      videoBx.style.bottom = '0';
    });
    
    const activeVideoBx = document.querySelectorAll('.influence-video-bx')[activeIndex];
    const activeTxtBx = document.querySelectorAll('.influence-txt-bx')[activeIndex];
    
    if (activeVideoBx && activeTxtBx) {
      // 활성화된 슬라이드의 video-bx에 txt-bx 높이 + 추가 간격만큼 bottom 값 적용
      activeVideoBx.style.bottom = `${(activeTxtBx.clientHeight + extraPadding) / 16}rem`;
    }
  }
  
  // Swiper 초기화
  influenceSlide = new Swiper(".influence-slide", {
    slidesPerView: 1.4,
    spaceBetween: 16,
    speed: 700,
    slideToClickedSlide: true,
    centeredSlides: true,
    initialSlide: 2,
    mousewheel: {
      forceToAxis: true, // 이 옵션이 핵심입니다.
    },
    pagination: {
      el: ".influence-slide .swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".influence-slide .swiper-button-next",
      prevEl: ".influence-slide .swiper-button-prev",
    },
    breakpoints: {
      768: {
        slidesPerView: 3,
        spaceBetween: 23.36,
      },
      1440: {
        slidesPerView: 4.7,
        spaceBetween: 48,
      },
    },
    on: {
      init: function() {
        // 초기 로드 시 활성화된 슬라이드의 비디오 재생
        const activeIndex = this.activeIndex;
        const activeVideo = document.querySelectorAll('.influence-video-bx video')[activeIndex];
        
        // 활성화된 슬라이드의 bottom 값 설정
        updateActiveSlideBottom();

        if (activeVideo) {
          activeVideo.play();
          currentPlayingVideo = activeVideo;
        }
      },
      slideChange: function() {
        // 활성화된 슬라이드 인덱스
        const activeIndex = this.activeIndex;
        const newActiveVideo = document.querySelectorAll('.influence-video-bx video')[activeIndex];
        
        // 활성화된 슬라이드의 bottom 값 업데이트
        updateActiveSlideBottom();
        
        // 현재 재생 중인 비디오가 있으면 정지 및 초기화
        if (currentPlayingVideo && currentPlayingVideo !== newActiveVideo) {
          currentPlayingVideo.pause();
          currentPlayingVideo.currentTime = 0;
        }
        
        // 새로운 활성화 비디오 재생
        if (newActiveVideo) {
          newActiveVideo.play();
          currentPlayingVideo = newActiveVideo;
        }
      },
      resize: function() {
        // 창 크기 변경 시 활성화된 슬라이드의 bottom 값 업데이트
        updateActiveSlideBottom();
      }
    }
  });
  
  // 미디어 쿼리 변경 리스너 등록 - Swiper 초기화 후에 실행
  Object.values(mediaQueries).forEach(query => {
    query.addEventListener('change', () => {
      updateExtraPadding();
      updateActiveSlideBottom();
    });
  });

  function toggleVideo(video) {
    // 반복되는 DOM 요소 선택을 변수로 저장
    const videoBox = video.closest('.influence-video-bx');
    const button = videoBox.querySelector('.influence-video-bx-btn');
    const buttonImg = button.querySelector('img');
    
    if (video.paused) {
      video.play();
      // 버튼 이미지를 일시정지 아이콘으로 변경
      buttonImg.src = './assets/images/influence-slide-pause.svg';
      buttonImg.setAttribute('alt', 'pause video');
      button.setAttribute('aria-label', 'pause video');
    } else {
      video.pause();
      // 버튼 이미지를 재생 아이콘으로 변경
      buttonImg.src = './assets/images/influence-slide-play.svg';
      buttonImg.setAttribute('alt', 'play video');
      button.setAttribute('aria-label', 'play video');
    }
  }

  // 비디오 재생/일시정지 버튼에 이벤트 리스너 추가
  document.querySelectorAll('.influence-video-bx-btn').forEach(button => {
    button.addEventListener('click', function() {
      const video = this.closest('.influence-video-bx').querySelector('video');
      toggleVideo(video);
    });
  });
}

influence()