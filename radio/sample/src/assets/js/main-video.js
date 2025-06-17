gsap.registerPlugin(ScrollTrigger);
const { toArray } = gsap.utils;

// 유튜브 비디오 ID (실제 사용할 비디오 ID로 변경하세요)
const YOUTUBE_VIDEO_ID = '2Af8tC8WgF0'; // 예시 ID

let player;
let isPlayerReady = false;

// YouTube API가 로드되면 호출되는 함수
function onYouTubeIframeAPIReady() {
  init();
}

function init() {
  const mainVideo = document.querySelector('.main-video');
  const mainVideoBx = document.querySelector('.video-bx');
  const playerContainer = document.getElementById('youtube-player');
  const playerWrapper = document.querySelector('.player-wrapper');

  // YouTube 플레이어 생성
  function createYouTubePlayer() {
    if (!playerContainer) return;

    player = new YT.Player('youtube-player', {
      videoId: YOUTUBE_VIDEO_ID,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,        // 자동재생 비활성화 (스크롤 트리거로 제어)
        controls: 1,        // 컨트롤 표시
        mute: 1,           // 음소거 상태로 시작
        loop: 1,           // 반복재생
        playlist: YOUTUBE_VIDEO_ID, // 루프를 위한 플레이리스트
        modestbranding: 1,  // YouTube 브랜딩 최소화
        rel: 0,            // 관련 동영상 표시 안함
        iv_load_policy: 3, // 주석 표시 안함
        fs: 1,             // 전체화면 버튼 표시
        cc_load_policy: 0, // 자막 비활성화
        disablekb: 0,      // 키보드 컨트롤 활성화
        enablejsapi: 1,    // JavaScript API 활성화
        origin: window.location.origin
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
  }

  // 플레이어 준비 완료 시 호출
  function onPlayerReady(event) {
    isPlayerReady = true;
    console.log('YouTube 플레이어 준비 완료');
  }

  // 플레이어 상태 변경 시 호출
  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      // 비디오 종료 시 반복재생
      playVideo();
    }
  }

  // 플레이어 오류 시 호출
  function onPlayerError(event) {
    console.error('YouTube 플레이어 오류:', event.data);
  }

  // 비디오 재생 함수
  function playVideo() {
    if (player && isPlayerReady) {
      try {
        player.playVideo();
      } catch (error) {
        console.log('비디오 재생 오류:', error);
      }
    }
  }

  // 비디오 정지 및 초기화 함수
  function stopAndResetVideo() {
    if (player && isPlayerReady) {
      try {
        player.pauseVideo();
        player.seekTo(0);
      } catch (error) {
        console.log('비디오 정지 오류:', error);
      }
    }
  }

  // YouTube 플레이어 생성
  createYouTubePlayer();

  // GSAP 애니메이션 설정
  const animationProps = { width: '100%', duration: 1, ease: 'power2.out' };
  
  const mainVideoTl = gsap.timeline({
    onComplete: playVideo, 
    onReverseComplete: stopAndResetVideo 
  })
    .to(playerWrapper, animationProps)

  const mainVideoTrigger = ScrollTrigger.create({
    trigger: mainVideo,
    start: 'top center',
    end: 'bottom center',
    animation: mainVideoTl,
    toggleActions: 'restart none reverse none',
  });
}

// YouTube API가 이미 로드되어 있는 경우를 위한 체크
if (window.YT && window.YT.Player) {
  init();
}